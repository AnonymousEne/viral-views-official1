# Viral Views - Music Collaboration Platform

## Overview

Viral Views is a **production-ready** live streaming platform specifically designed for rap battles and freestyle ciphers. The core focus is real-time audio streaming for live rap battles, with contestants battling each other through peer-to-peer audio connections. The platform enables live streaming rap battles, real-time voting, and collaborative music sessions using Web Audio API and WebRTC technology.

**Current Status**: Production deployment ready with full live streaming functionality for rap battles and ciphers as the primary feature.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling and hot module replacement
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens for a dark music platform theme
- **Mobile Support**: Responsive design with dedicated mobile navigation component

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Build System**: ESBuild for production bundling with TypeScript compilation
- **Development**: TSX for TypeScript execution in development with hot reloading
- **API Design**: RESTful API structure with dedicated route handlers for different resources
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive data model covering users, tracks, battles, beats, collaborations, and votes
- **Connection**: Neon Database serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for database schema migrations and management

### Key Features Architecture
- **Battle System**: Real-time voting mechanism with contestant tracking and vote aggregation
- **Beat Marketplace**: License-based beat sales with genre categorization and producer profiles
- **Collaborative Mixing**: Multi-user audio mixing interface with waveform visualization
- **Live Streaming**: Live session support for freestyle battles and beat-making sessions
- **Social Features**: User profiles with follower systems, track sharing, and engagement metrics

### Authentication & Authorization
- **User Management**: Role-based system supporting artists, producers, and fans
- **Session Handling**: Cookie-based session management with PostgreSQL session store
- **Security**: Password hashing and input validation with Zod schemas

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support

### UI & Design System
- **Shadcn/ui**: Pre-built accessible component library
- **Radix UI**: Headless UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom color palette
- **Lucide Icons**: Comprehensive icon library for UI elements

### Development Tools
- **Vite**: Frontend build tool with React plugin and development server
- **TypeScript**: Type safety across frontend and backend code
- **ESBuild**: Fast JavaScript bundler for production builds
- **TanStack Query**: Server state management with caching and synchronization

### Audio & Media
- **Embla Carousel**: Touch-friendly carousel component for content display
- **Custom Waveform Visualization**: Canvas-based audio waveform rendering
- **Date-fns**: Date manipulation and formatting utilities

### Validation & Forms
- **Zod**: Schema validation for API inputs and form data
- **React Hook Form**: Form state management with validation integration
- **Drizzle-Zod**: Integration between Drizzle schemas and Zod validation