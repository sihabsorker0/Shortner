import { z } from "zod";

// MongoDB compatible schema definitions
export const insertLinkSchema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  customAlias: z.string().optional(),
  expiration: z.string().optional(),
});

export const insertClickSchema = z.object({
  linkId: z.number(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(), // mobile, tablet, desktop
  operatingSystem: z.string().optional(), // iOS, Android, Windows, etc.
  browser: z.string().optional(), // Chrome, Safari, Firefox, etc.
  browserVersion: z.string().optional(),
  screenResolution: z.string().optional(), // 1920x1080
  viewportSize: z.string().optional(), // actual visible area
  devicePixelRatio: z.string().optional(), // screen density
  colorDepth: z.string().optional(), // color bits
  language: z.string().optional(), // en-US, bn-BD, etc.
  timezone: z.string().optional(),
  referrer: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  isp: z.string().optional(), // Internet Service Provider
  connectionType: z.string().optional(), // wifi, cellular, ethernet
  deviceModel: z.string().optional(), // iPhone 14 Pro, Samsung Galaxy S23
  platform: z.string().optional(), // detailed platform info
  cpuCores: z.string().optional(),
  deviceMemory: z.string().optional(),
  networkSpeed: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  accuracy: z.string().optional(),
  batteryLevel: z.string().optional(),
  isCharging: z.boolean().optional(),
  orientation: z.string().optional(), // portrait, landscape
  touchSupport: z.boolean().optional(),
  cookiesEnabled: z.boolean().optional(),
  javaScriptEnabled: z.boolean().optional(),
  doNotTrack: z.boolean().optional(),
  sessionId: z.string().optional(),
});

export type InsertLink = z.infer<typeof insertLinkSchema>;
export type InsertClick = z.infer<typeof insertClickSchema>;

// MongoDB document types
export interface Link {
  _id?: string;
  id: number;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  expiresAt?: Date;
  createdAt: Date;
  isActive: boolean;
  userId: string; // User ID from authentication
}

export interface User {
  _id?: string;
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UpsertUser = Omit<User, '_id' | 'createdAt' | 'updatedAt'>;

export interface Click {
  _id?: string;
  id: number;
  linkId: number;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string; // mobile, tablet, desktop
  operatingSystem?: string; // iOS, Android, Windows, etc.
  browser?: string; // Chrome, Safari, Firefox, etc.
  browserVersion?: string;
  screenResolution?: string; // 1920x1080
  viewportSize?: string; // actual visible area
  devicePixelRatio?: string; // screen density
  colorDepth?: string; // color bits
  language?: string; // en-US, bn-BD, etc.
  timezone?: string;
  referrer?: string;
  country?: string;
  city?: string;
  region?: string;
  isp?: string; // Internet Service Provider
  connectionType?: string; // wifi, cellular, ethernet
  deviceModel?: string; // iPhone 14 Pro, Samsung Galaxy S23
  platform?: string; // detailed platform info
  cpuCores?: string;
  deviceMemory?: string;
  networkSpeed?: string;
  latitude?: string;
  longitude?: string;
  accuracy?: string;
  batteryLevel?: string;
  isCharging?: boolean;
  orientation?: string; // portrait, landscape
  touchSupport?: boolean;
  cookiesEnabled?: boolean;
  javaScriptEnabled?: boolean;
  doNotTrack?: boolean;
  sessionId?: string;
}

export type LinkWithStats = Link & {
  clickCount: number;
  recentClicks: number;
};
