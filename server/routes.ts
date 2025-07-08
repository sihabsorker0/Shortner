import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, storagePromise } from "./storage";
import { insertLinkSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseExpiration(expiration?: string): Date | undefined {
  if (!expiration || expiration === 'never') return undefined;
  
  const now = new Date();
  switch (expiration) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '1d':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '1w':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1m':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Wait for storage initialization
  await storagePromise;
  
  // Setup authentication
  await setupAuth(app);

  

  // Rate limiting middleware
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  const rateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimitMap.get(ip)!;
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    
    limit.count++;
    next();
  };

  // Create short link
  app.post('/api/links', rateLimit, async (req: any, res) => {
    try {
      const validatedData = insertLinkSchema.parse(req.body);
      const userId = 'anonymous'; // Set default user ID
      
      let shortCode = validatedData.customAlias;
      
      // Check if custom alias is available
      if (shortCode) {
        const existing = await storage.getLinkByShortCode(shortCode);
        if (existing) {
          return res.status(400).json({ message: 'Custom alias already exists' });
        }
      } else {
        // Generate unique short code
        do {
          shortCode = generateShortCode();
        } while (await storage.getLinkByShortCode(shortCode));
      }
      
      const expiresAt = parseExpiration(validatedData.expiration);
      
      const link = await storage.createLink({
        originalUrl: validatedData.originalUrl,
        customAlias: validatedData.customAlias,
        shortCode,
        expiresAt,
        userId, // Add user ID to link
      });
      
      res.json({
        id: link.id,
        originalUrl: link.originalUrl,
        shortUrl: `${req.protocol}://${req.get('host')}/${link.shortCode}`,
        shortCode: link.shortCode,
        customAlias: link.customAlias,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all links
  app.get('/api/links', async (req: any, res) => {
    try {
      const userId = 'anonymous';
      const links = await storage.getLinksByUserId(userId);
      res.json(links.map(link => ({
        ...link,
        shortUrl: `${req.protocol}://${req.get('host')}/${link.shortCode}`,
      })));
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get link analytics
  app.get('/api/links/:id/analytics', async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const link = await storage.getLinkById(id);
      
      if (!link) {
        return res.status(404).json({ message: 'Link not found' });
      }
      
      const clicks = await storage.getClicksForLink(id);
      
      res.json({
        link: {
          ...link,
          shortUrl: `${req.protocol}://${req.get('host')}/${link.shortCode}`,
        },
        totalClicks: clicks.length,
        recentClicks: clicks.filter(c => 
          c.clickedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        clicks: clicks.slice(0, 100), // Return recent 100 clicks
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Track click with comprehensive device information
  app.post('/api/track-click', async (req, res) => {
    try {
      const { 
        linkId, screenResolution, viewportSize, devicePixelRatio, colorDepth,
        language, timezone, platform, cpuCores, deviceMemory, connectionType,
        networkSpeed, latitude, longitude, accuracy, batteryLevel, isCharging,
        orientation, touchSupport, cookiesEnabled, javaScriptEnabled, 
        doNotTrack, sessionId 
      } = req.body;
      
      if (!linkId) {
        return res.status(400).json({ message: 'Link ID is required' });
      }
      
      // Import device parser  
      const { parseUserAgent, parseAcceptLanguage, getLocationFromIP } = await import("./deviceParser");
      
      const userAgent = req.get('User-Agent') || '';
      const deviceInfo = parseUserAgent(userAgent);
      const acceptLanguage = parseAcceptLanguage(req.get('Accept-Language') || '');
      const ip = req.ip || req.connection.remoteAddress || '';
      
      // Get comprehensive geolocation info
      const location = await getLocationFromIP(ip);
      
      // Enhanced device model detection from User Agent
      let deviceModel = 'unknown';
      if (/iPhone/i.test(userAgent)) {
        const iPhoneMatch = userAgent.match(/iPhone(\d+,\d+)/);
        if (iPhoneMatch) deviceModel = `iPhone ${iPhoneMatch[1]}`;
        else deviceModel = 'iPhone';
      } else if (/iPad/i.test(userAgent)) {
        deviceModel = 'iPad';
      } else if (/Android/i.test(userAgent)) {
        const androidModel = userAgent.match(/\(([^)]+)\)/)?.[1]?.split(';')?.[1]?.trim();
        deviceModel = androidModel || 'Android Device';
      }
      
      const clickData = {
        linkId: parseInt(linkId),
        ipAddress: ip,
        userAgent: userAgent,
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        screenResolution: screenResolution || 'unknown',
        viewportSize: viewportSize || 'unknown',
        devicePixelRatio: devicePixelRatio || 'unknown',
        colorDepth: colorDepth || 'unknown',
        language: language || acceptLanguage,
        timezone: timezone || 'unknown',
        referrer: req.get('Referer') || '',
        country: location.country,
        city: location.city,
        region: location.region,
        isp: location.isp,
        connectionType: connectionType || 'unknown',
        deviceModel: deviceModel,
        platform: platform || deviceInfo.operatingSystem,
        cpuCores: cpuCores || 'unknown',
        deviceMemory: deviceMemory || 'unknown',
        networkSpeed: networkSpeed || 'unknown',
        latitude: latitude || null,
        longitude: longitude || null,
        accuracy: accuracy || null,
        batteryLevel: batteryLevel || 'unknown',
        isCharging: isCharging || false,
        orientation: orientation || 'unknown',
        touchSupport: touchSupport || false,
        cookiesEnabled: cookiesEnabled || false,
        javaScriptEnabled: javaScriptEnabled || true,
        doNotTrack: doNotTrack || false,
        sessionId: sessionId || null,
      };
      
      await storage.recordClick(clickData);
      console.log('✓ Click recorded successfully with device details');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  // Delete link
  app.delete('/api/links/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLink(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Link not found' });
      }
      
      res.json({ message: 'Link deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get dashboard stats
  // Get stats
  app.get('/api/stats', async (req: any, res) => {
    try {
      const userId = 'anonymous';
      const totalLinks = await storage.getTotalLinksByUserId(userId);
      const clickStats = await storage.getClickStatsByUserId(userId);
      
      res.json({
        totalLinks,
        totalClicks: clickStats.total,
        todayClicks: clickStats.today,
        ctr: totalLinks > 0 ? ((clickStats.total / totalLinks) * 100).toFixed(1) : '0.0',
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
