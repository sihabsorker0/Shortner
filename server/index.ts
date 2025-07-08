import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add short URL redirect middleware BEFORE registering routes
  app.use((req, res, next) => {
    // Only handle GET requests that look like short codes
    if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/src') && !req.url.includes('.') && req.url !== '/') {
      const shortCode = req.url.slice(1); // Remove leading slash
      
      // Check if it matches short code pattern
      if (/^[a-zA-Z0-9-]{3,50}$/.test(shortCode)) {
        // Import storage dynamically
        import("./storage").then(async ({ storage, storagePromise }) => {
          await storagePromise; // Wait for storage to initialize
          storage.getLinkByShortCode(shortCode).then(link => {
            if (link && link.isActive) {
              // Check expiration
              if (link.expiresAt && new Date() > link.expiresAt) {
                return res.status(410).send('Link has expired');
              }
              
              // Instead of direct redirect, serve tracking page
              const trackingPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title></title>
    <style>
        body { 
            margin: 0;
            padding: 0;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .loader {
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <script>
        async function getComprehensiveDeviceInfo() {
            const deviceInfo = {
                screenResolution: screen.width + 'x' + screen.height,
                viewportSize: window.innerWidth + 'x' + window.innerHeight,
                devicePixelRatio: window.devicePixelRatio?.toString() || 'unknown',
                colorDepth: screen.colorDepth?.toString() || 'unknown',
                language: navigator.language || navigator.languages?.[0] || 'unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
                platform: navigator.platform || 'unknown',
                cpuCores: navigator.hardwareConcurrency?.toString() || 'unknown',
                deviceMemory: navigator.deviceMemory?.toString() || 'unknown',
                cookiesEnabled: navigator.cookieEnabled || false,
                javaScriptEnabled: true, // obviously true if this runs
                doNotTrack: navigator.doNotTrack === '1' || false,
                touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                orientation: screen.orientation?.type || (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'),
                sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            };

            // Try to get connection info
            if (navigator.connection) {
                deviceInfo.connectionType = navigator.connection.effectiveType || navigator.connection.type || 'unknown';
                deviceInfo.networkSpeed = navigator.connection.downlink?.toString() + 'Mbps' || 'unknown';
            }

            // Try to get battery info
            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    deviceInfo.batteryLevel = (battery.level * 100).toFixed(0) + '%';
                    deviceInfo.isCharging = battery.charging;
                } catch (e) {
                    deviceInfo.batteryLevel = 'unknown';
                    deviceInfo.isCharging = false;
                }
            }

            // Try to get geolocation
            if (navigator.geolocation) {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            deviceInfo.latitude = position.coords.latitude.toString();
                            deviceInfo.longitude = position.coords.longitude.toString();
                            deviceInfo.accuracy = position.coords.accuracy.toString();
                            resolve(deviceInfo);
                        },
                        () => {
                            // Geolocation failed, return without location
                            resolve(deviceInfo);
                        },
                        { timeout: 5000, enableHighAccuracy: false }
                    );
                });
            }

            return deviceInfo;
        }
        
        async function recordClickAndRedirect() {
            const deviceInfo = await getComprehensiveDeviceInfo();
            const originalUrl = '${link.originalUrl}';
            const linkId = ${link.id};
            
            try {
                await fetch('/api/track-click', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        linkId: linkId,
                        ...deviceInfo
                    }),
                });
            } catch (error) {
                console.log('Failed to track click');
            }
            
            // Redirect to original URL immediately
            setTimeout(() => {
                window.location.href = originalUrl;
            }, 100);
        }
        
        // Start tracking immediately
        recordClickAndRedirect();
    </script>
</body>
</html>`;
              
              res.send(trackingPageHtml);
            } else {
              next(); // Let other routes handle it
            }
          }).catch(() => {
            next(); // Let other routes handle it
          });
        }).catch(() => {
          next(); // Let other routes handle it
        });
      } else {
        next(); // Let other routes handle it
      }
    } else {
      next(); // Let other routes handle it
    }
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });



  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
