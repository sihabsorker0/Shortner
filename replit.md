# URL Shortener Application

## Overview

This is a full-stack URL shortener application built with React, Express, and TypeScript. The application allows users to create shortened URLs with optional custom aliases and expiration dates, track click analytics, and manage their links through a modern dashboard interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Request Handling**: Express middleware for JSON parsing, rate limiting, and logging
- **Error Handling**: Centralized error handling middleware

### Data Layer
- **Database**: MongoDB (MongoDB Atlas) with native driver
- **Connection**: MongoDB URI with connection pooling and automatic reconnection
- **Schema Management**: Zod schemas for type validation
- **Storage Interface**: Abstracted storage layer with MongoDB implementation for production and in-memory for development

## Key Components

### Database Schema
- **Links Collection**: Stores URL mappings with metadata (original URL, short code, custom alias, expiration, creation timestamp, active status)
- **Clicks Collection**: Tracks click analytics (link ID, timestamp, IP address, user agent)
- **Relationships**: One-to-many relationship between links and clicks using linkId reference

### API Endpoints
- `GET /api/login` - Demo login (creates session for demo user)
- `GET /api/logout` - Logout and destroy session
- `GET /api/auth/user` - Get current authenticated user info (protected)
- `POST /api/links` - Create new shortened URL (protected, user-specific)
- `GET /api/links` - Retrieve user's links with statistics (protected, user-specific)
- `GET /api/links/:id/analytics` - Get detailed analytics for user's specific link (protected)
- `DELETE /api/links/:id` - Delete user's link (protected, user-specific)
- `GET /api/stats` - Get user's platform statistics (protected, user-specific)
- `GET /:shortCode` - Redirect to original URL and track click (public)

### Frontend Features
- **User Authentication**: Demo authentication system with session management
- **URL Shortener Form**: Create links with optional custom aliases and expiration settings (authenticated users only)
- **Personal Dashboard**: User-specific overview with statistics cards and links management table
- **Analytics Modal**: Detailed click analytics and link performance metrics for user's links
- **Search & Filter**: Filter user's links by URL, short code, or custom alias
- **Navigation**: Authentication-aware navigation with login/logout functionality
- **Responsive Design**: Mobile-first responsive layout with dark/light mode support

## Data Flow

1. **Link Creation**: User submits URL → Frontend validates → API generates short code → Database stores link → Response with shortened URL
2. **Link Access**: User visits short URL → API looks up original URL → Records click analytics → Redirects to original URL
3. **Analytics**: Dashboard fetches statistics → API aggregates data from database → Frontend displays charts and metrics
4. **Link Management**: Users can view, search, and delete links through the dashboard interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Development Tools
- **@replit/vite-plugin-***: Replit-specific development plugins
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Static type checking
- **vite**: Build tool and development server

## Deployment Strategy

### Development Mode
- **Frontend**: Vite dev server with HMR enabled
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: In-memory storage for development, PostgreSQL for production

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment**: Single process serving both static files and API endpoints
- **Environment**: Configured for Replit deployment with banner integration

### Configuration Management
- **Environment Variables**: `MONGODB_URI` for MongoDB connection
- **Path Aliases**: Configured for clean imports (`@/`, `@shared/`)
- **Build Optimization**: Separate client and server build processes

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Migrated from PostgreSQL to MongoDB using MongoDB Atlas
- July 05, 2025. Implemented user authentication system with user-specific link filtering
- July 08, 2025. Enhanced click tracking with comprehensive device information collection
- July 08, 2025. Added device parser for User Agent analysis and client-side device detection
- July 08, 2025. Implemented fallback storage system (MongoDB with in-memory fallback)
- July 08, 2025. Updated analytics modal to display detailed device information
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```