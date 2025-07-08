import { type Link, type InsertLink, type Click, type InsertClick, type LinkWithStats, type User, type UpsertUser } from "@shared/schema";
import { MongoClient, Db, Collection } from "mongodb";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Link operations
  createLink(link: Omit<InsertLink, 'expiration'> & { shortCode: string; expiresAt?: Date; userId: string }): Promise<Link>;
  getLinkByShortCode(shortCode: string): Promise<Link | undefined>;
  getLinkById(id: number): Promise<Link | undefined>;
  getAllLinks(): Promise<LinkWithStats[]>;
  getLinksByUserId(userId: string): Promise<LinkWithStats[]>;
  updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined>;
  deleteLink(id: number): Promise<boolean>;
  
  // Click operations
  recordClick(click: Omit<InsertClick, 'id'>): Promise<Click>;
  getClicksForLink(linkId: number): Promise<Click[]>;
  getTotalClicks(): Promise<number>;
  getTodayClicks(): Promise<number>;
  
  // Stats operations
  getTotalLinks(): Promise<number>;
  getTotalLinksByUserId(userId: string): Promise<number>;
  getClickStats(): Promise<{ total: number; today: number; thisWeek: number }>;
  getClickStatsByUserId(userId: string): Promise<{ total: number; today: number; thisWeek: number }>;
}

export class MemStorage implements IStorage {
  private links: Map<number, Link>;
  private clicks: Map<number, Click>;
  private users: Map<string, User>;
  private currentLinkId: number;
  private currentClickId: number;

  constructor() {
    this.links = new Map();
    this.clicks = new Map();
    this.users = new Map();
    this.currentLinkId = 1;
    this.currentClickId = 1;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createLink(linkData: Omit<InsertLink, 'expiration'> & { shortCode: string; expiresAt?: Date; userId: string }): Promise<Link> {
    const id = this.currentLinkId++;
    const link: Link = {
      id,
      originalUrl: linkData.originalUrl,
      shortCode: linkData.shortCode,
      customAlias: linkData.customAlias || undefined,
      expiresAt: linkData.expiresAt || undefined,
      createdAt: new Date(),
      isActive: true,
      userId: linkData.userId,
    };
    this.links.set(id, link);
    return link;
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    return Array.from(this.links.values()).find(
      (link) => link.shortCode === shortCode || link.customAlias === shortCode
    );
  }

  async getLinkById(id: number): Promise<Link | undefined> {
    return this.links.get(id);
  }

  async getAllLinks(): Promise<LinkWithStats[]> {
    const linksArray = Array.from(this.links.values());
    const linksWithStats: LinkWithStats[] = [];
    
    for (const link of linksArray) {
      const clickCount = await this.getClickCountForLink(link.id);
      const recentClicks = await this.getRecentClicksForLink(link.id);
      linksWithStats.push({
        ...link,
        clickCount,
        recentClicks,
      });
    }
    
    return linksWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined> {
    const link = this.links.get(id);
    if (!link) return undefined;
    
    const updatedLink = { ...link, ...updates };
    this.links.set(id, updatedLink);
    return updatedLink;
  }

  async deleteLink(id: number): Promise<boolean> {
    // Also delete associated clicks
    const clicksToDelete = Array.from(this.clicks.entries())
      .filter(([_, click]) => click.linkId === id)
      .map(([clickId, _]) => clickId);
    
    clicksToDelete.forEach(clickId => this.clicks.delete(clickId));
    
    return this.links.delete(id);
  }

  async recordClick(clickData: Omit<InsertClick, 'id'>): Promise<Click> {
    const id = this.currentClickId++;
    const click: Click = {
      id,
      linkId: clickData.linkId,
      clickedAt: new Date(),
      ipAddress: clickData.ipAddress,
      userAgent: clickData.userAgent,
      deviceType: clickData.deviceType,
      operatingSystem: clickData.operatingSystem,
      browser: clickData.browser,
      browserVersion: clickData.browserVersion,
      screenResolution: clickData.screenResolution,
      viewportSize: clickData.viewportSize,
      devicePixelRatio: clickData.devicePixelRatio,
      colorDepth: clickData.colorDepth,
      language: clickData.language,
      timezone: clickData.timezone,
      referrer: clickData.referrer,
      country: clickData.country,
      city: clickData.city,
      region: clickData.region,
      isp: clickData.isp,
      connectionType: clickData.connectionType,
      deviceModel: clickData.deviceModel,
      platform: clickData.platform,
      cpuCores: clickData.cpuCores,
      deviceMemory: clickData.deviceMemory,
      networkSpeed: clickData.networkSpeed,
      latitude: clickData.latitude,
      longitude: clickData.longitude,
      accuracy: clickData.accuracy,
      batteryLevel: clickData.batteryLevel,
      isCharging: clickData.isCharging,
      orientation: clickData.orientation,
      touchSupport: clickData.touchSupport,
      cookiesEnabled: clickData.cookiesEnabled,
      javaScriptEnabled: clickData.javaScriptEnabled,
      doNotTrack: clickData.doNotTrack,
      sessionId: clickData.sessionId,
    };
    this.clicks.set(id, click);
    return click;
  }

  async getClicksForLink(linkId: number): Promise<Click[]> {
    return Array.from(this.clicks.values())
      .filter((click) => click.linkId === linkId)
      .sort((a, b) => b.clickedAt.getTime() - a.clickedAt.getTime());
  }

  async getTotalClicks(): Promise<number> {
    return this.clicks.size;
  }

  async getTodayClicks(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.clicks.values())
      .filter((click) => click.clickedAt >= today).length;
  }

  async getLinksByUserId(userId: string): Promise<LinkWithStats[]> {
    const userLinks = Array.from(this.links.values()).filter(link => link.userId === userId);
    const linksWithStats = await Promise.all(
      userLinks.map(async (link) => {
        const clickCount = await this.getClickCountForLink(link.id);
        const recentClicks = await this.getRecentClicksForLink(link.id);
        return {
          ...link,
          clickCount,
          recentClicks,
        };
      })
    );
    return linksWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTotalLinks(): Promise<number> {
    return this.links.size;
  }

  async getTotalLinksByUserId(userId: string): Promise<number> {
    return Array.from(this.links.values()).filter(link => link.userId === userId).length;
  }

  async getClickStats(): Promise<{ total: number; today: number; thisWeek: number }> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const allClicks = Array.from(this.clicks.values());
    
    return {
      total: allClicks.length,
      today: allClicks.filter(click => click.clickedAt >= today).length,
      thisWeek: allClicks.filter(click => click.clickedAt >= weekAgo).length,
    };
  }

  async getClickStatsByUserId(userId: string): Promise<{ total: number; today: number; thisWeek: number }> {
    const userLinks = Array.from(this.links.values()).filter(link => link.userId === userId);
    const userLinkIds = userLinks.map(link => link.id);
    const userClicks = Array.from(this.clicks.values()).filter(click => userLinkIds.includes(click.linkId));
    
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return {
      total: userClicks.length,
      today: userClicks.filter(click => click.clickedAt >= today).length,
      thisWeek: userClicks.filter(click => click.clickedAt >= weekAgo).length,
    };
  }

  private async getClickCountForLink(linkId: number): Promise<number> {
    return Array.from(this.clicks.values())
      .filter((click) => click.linkId === linkId).length;
  }

  private async getRecentClicksForLink(linkId: number): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return Array.from(this.clicks.values())
      .filter((click) => click.linkId === linkId && click.clickedAt >= oneDayAgo).length;
  }
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private linksCollection: Collection<Link>;
  private clicksCollection: Collection<Click>;
  private usersCollection: Collection<User>;
  private currentLinkId: number = 1;
  private currentClickId: number = 1;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db("linkshortener");
    this.linksCollection = this.db.collection<Link>("links");
    this.clicksCollection = this.db.collection<Click>("clicks");
    this.usersCollection = this.db.collection<User>("users");
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log("Connected to MongoDB");
    
    // Initialize counters
    const lastLink = await this.linksCollection.findOne({}, { sort: { id: -1 } });
    const lastClick = await this.clicksCollection.findOne({}, { sort: { id: -1 } });
    
    this.currentLinkId = lastLink ? lastLink.id + 1 : 1;
    this.currentClickId = lastClick ? lastClick.id + 1 : 1;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ id });
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await this.usersCollection.findOneAndReplace(
      { id: userData.id },
      user,
      { upsert: true, returnDocument: 'after' }
    );
    
    return result || user;
  }

  async createLink(linkData: Omit<InsertLink, 'expiration'> & { shortCode: string; expiresAt?: Date; userId: string }): Promise<Link> {
    const id = this.currentLinkId++;
    const link: Link = {
      id,
      originalUrl: linkData.originalUrl,
      shortCode: linkData.shortCode,
      customAlias: linkData.customAlias,
      expiresAt: linkData.expiresAt,
      createdAt: new Date(),
      isActive: true,
      userId: linkData.userId,
    };
    
    await this.linksCollection.insertOne(link);
    return link;
  }

  async getLinkByShortCode(shortCode: string): Promise<Link | undefined> {
    const link = await this.linksCollection.findOne({ shortCode });
    return link || undefined;
  }

  async getLinkById(id: number): Promise<Link | undefined> {
    const link = await this.linksCollection.findOne({ id });
    return link || undefined;
  }

  async getAllLinks(): Promise<LinkWithStats[]> {
    const links = await this.linksCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    const linksWithStats = await Promise.all(
      links.map(async (link) => {
        const clickCount = await this.getClickCountForLink(link.id);
        const recentClicks = await this.getRecentClicksForLink(link.id);
        return {
          ...link,
          clickCount,
          recentClicks,
        };
      })
    );
    
    return linksWithStats;
  }

  async updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined> {
    const result = await this.linksCollection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteLink(id: number): Promise<boolean> {
    const result = await this.linksCollection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async recordClick(clickData: Omit<InsertClick, 'id'>): Promise<Click> {
    const id = this.currentClickId++;
    const click: Click = {
      id,
      linkId: clickData.linkId,
      clickedAt: new Date(),
      ipAddress: clickData.ipAddress,
      userAgent: clickData.userAgent,
      deviceType: clickData.deviceType,
      operatingSystem: clickData.operatingSystem,
      browser: clickData.browser,
      browserVersion: clickData.browserVersion,
      screenResolution: clickData.screenResolution,
      viewportSize: clickData.viewportSize,
      devicePixelRatio: clickData.devicePixelRatio,
      colorDepth: clickData.colorDepth,
      language: clickData.language,
      timezone: clickData.timezone,
      referrer: clickData.referrer,
      country: clickData.country,
      city: clickData.city,
      region: clickData.region,
      isp: clickData.isp,
      connectionType: clickData.connectionType,
      deviceModel: clickData.deviceModel,
      platform: clickData.platform,
      cpuCores: clickData.cpuCores,
      deviceMemory: clickData.deviceMemory,
      networkSpeed: clickData.networkSpeed,
      latitude: clickData.latitude,
      longitude: clickData.longitude,
      accuracy: clickData.accuracy,
      batteryLevel: clickData.batteryLevel,
      isCharging: clickData.isCharging,
      orientation: clickData.orientation,
      touchSupport: clickData.touchSupport,
      cookiesEnabled: clickData.cookiesEnabled,
      javaScriptEnabled: clickData.javaScriptEnabled,
      doNotTrack: clickData.doNotTrack,
      sessionId: clickData.sessionId,
    };
    
    await this.clicksCollection.insertOne(click);
    return click;
  }

  async getClicksForLink(linkId: number): Promise<Click[]> {
    return await this.clicksCollection.find({ linkId }).sort({ clickedAt: -1 }).toArray();
  }

  async getTotalClicks(): Promise<number> {
    return await this.clicksCollection.countDocuments();
  }

  async getTodayClicks(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await this.clicksCollection.countDocuments({
      clickedAt: { $gte: today }
    });
  }

  async getLinksByUserId(userId: string): Promise<LinkWithStats[]> {
    const links = await this.linksCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
    
    const linksWithStats = await Promise.all(
      links.map(async (link) => {
        const clickCount = await this.getClickCountForLink(link.id);
        const recentClicks = await this.getRecentClicksForLink(link.id);
        return {
          ...link,
          clickCount,
          recentClicks,
        };
      })
    );
    
    return linksWithStats;
  }

  async getTotalLinks(): Promise<number> {
    return await this.linksCollection.countDocuments();
  }

  async getTotalLinksByUserId(userId: string): Promise<number> {
    return await this.linksCollection.countDocuments({ userId });
  }

  async getClickStats(): Promise<{ total: number; today: number; thisWeek: number }> {
    const total = await this.getTotalClicks();
    const today = await this.getTodayClicks();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await this.clicksCollection.countDocuments({
      clickedAt: { $gte: oneWeekAgo }
    });
    
    return { total, today, thisWeek };
  }

  async getClickStatsByUserId(userId: string): Promise<{ total: number; today: number; thisWeek: number }> {
    // Get user's links
    const userLinks = await this.linksCollection.find({ userId }, { projection: { id: 1 } }).toArray();
    const userLinkIds = userLinks.map(link => link.id);
    
    if (userLinkIds.length === 0) {
      return { total: 0, today: 0, thisWeek: 0 };
    }
    
    // Get clicks for user's links
    const total = await this.clicksCollection.countDocuments({ linkId: { $in: userLinkIds } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayClicks = await this.clicksCollection.countDocuments({
      linkId: { $in: userLinkIds },
      clickedAt: { $gte: today }
    });
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await this.clicksCollection.countDocuments({
      linkId: { $in: userLinkIds },
      clickedAt: { $gte: oneWeekAgo }
    });
    
    return { total, today: todayClicks, thisWeek };
  }

  private async getClickCountForLink(linkId: number): Promise<number> {
    return await this.clicksCollection.countDocuments({ linkId });
  }

  private async getRecentClicksForLink(linkId: number): Promise<number> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return await this.clicksCollection.countDocuments({
      linkId,
      clickedAt: { $gte: oneDayAgo }
    });
  }
}

export const memStorage = new MemStorage();

// Try MongoDB first, fallback to in-memory storage
let storage: IStorage = memStorage; // Default to in-memory

async function initializeStorage() {
  const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sihabsorker:0QbHvqaHUBVi62jj@cluster0.ijcuovp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  
  // Try MongoDB connection first
  try {
    const mongoStorage = new MongoStorage(mongoUri);
    await mongoStorage.connect();
    console.log("Connected to MongoDB");
    storage = mongoStorage;
  } catch (error) {
    console.warn("Failed to connect to MongoDB, using in-memory storage:", error.message);
    storage = memStorage;
  }
  return storage;
}

// Initialize storage asynchronously
const storagePromise = initializeStorage();

export { storage, storagePromise };
