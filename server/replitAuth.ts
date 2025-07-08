import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { storage } from "./storage";

const memoryStore = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionStore = new (MemoryStore(session))({
    checkPeriod: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

// Demo authentication - create a demo user for testing
async function createDemoUser() {
  const demoUser = {
    id: "demo-user-123",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: "https://via.placeholder.com/150",
  };
  
  await storage.upsertUser(demoUser);
  return demoUser;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Create demo user
  const demoUser = await createDemoUser();

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Demo login route - automatically logs in as demo user
  app.get("/api/login", (req: any, res) => {
    const userSession = { 
      claims: { 
        sub: demoUser.id,
        email: demoUser.email,
        first_name: demoUser.firstName,
        last_name: demoUser.lastName 
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };
    
    req.login(userSession, (err: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      res.redirect("/");
    });
  });

  app.get("/api/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (req.user.expires_at && now > req.user.expires_at) {
    return res.status(401).json({ message: "Session expired" });
  }

  next();
};