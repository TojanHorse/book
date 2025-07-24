# Digital Library Chat Application

## Overview

This is a full-stack web application that presents itself as a digital book reader while secretly containing a real-time chat application. The application uses a clever disguise mechanism where users must perform specific interactions with the "book" interface to reveal the hidden chat functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API for authentication and socket management
- **Real-time Communication**: Socket.IO client for live chat features
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Session Management**: PostgreSQL-based session storage
- **Real-time**: Socket.IO server for WebSocket connections

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Migrations**: Generated in `./migrations` directory
- **Connection**: Neon Database serverless PostgreSQL

## Key Components

### Authentication System
- JWT-based authentication with email verification
- Password hashing using bcryptjs
- Protected routes with automatic redirects
- User session management with persistent storage

### Book Disguise Interface
- Fetches real books from Gutendex API (Project Gutenberg)
- Implements realistic page-turning animations
- Secret trigger system requiring specific user interactions
- Seamless transition between book and chat interfaces

### Real-time Chat System
- WebSocket-based messaging with Socket.IO
- Support for text, images, videos, and document sharing
- Typing indicators and read receipts
- File upload with Cloudinary integration
- Conversation management and user search

### UI/UX Design
- Responsive design with mobile-first approach
- Custom book-themed styling with CSS animations
- Radix UI components for consistent interface elements
- Toast notifications for user feedback

## Data Flow

### Authentication Flow
1. User registers/logs in through `/auth` routes
2. Server validates credentials and issues JWT token
3. Token stored in localStorage and added to axios headers
4. Protected routes check token validity via AuthContext
5. Email verification required before accessing main application

### Book Disguise Flow
1. Application fetches random book from Gutendx API
2. Book content rendered with realistic pagination
3. Secret trigger tracks user interaction patterns
4. Specific sequence unlocks chat interface
5. Smooth transition maintains user immersion

### Chat Flow
1. Socket.IO establishes real-time connection
2. Users can search and start conversations
3. Messages sent through WebSocket with optimistic updates
4. File uploads processed through Cloudinary
5. Real-time delivery with typing indicators

## External Dependencies

### APIs and Services
- **Gutendx API**: Provides free books from Project Gutenberg
- **Neon Database**: Serverless PostgreSQL hosting
- **Cloudinary**: File storage and processing (referenced in chat components)

### Key Libraries
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless
- **drizzle-orm**: Type-safe ORM with excellent TypeScript support
- **socket.io**: Real-time bidirectional communication
- **@radix-ui**: Headless UI components for accessibility
- **react-hot-toast**: User notification system
- **axios**: HTTP client with interceptors for authentication

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for running TypeScript server files
- Replit-specific plugins for development integration

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- esbuild compiles server TypeScript to `dist/index.js`
- Single process serves both static files and API routes
- Environment variables for database and API configuration

### Database Management
- Drizzle Kit for schema migrations
- `db:push` script for development schema updates
- Production migrations through generated SQL files

### Architecture Benefits
- **Stealth Design**: Legitimate book interface provides perfect cover
- **Type Safety**: Shared schema ensures consistency across stack
- **Real-time Performance**: Socket.IO provides instant messaging experience
- **Scalable**: Serverless database and modular architecture support growth
- **Security**: JWT authentication with email verification and bcrypt hashing

### Development Workflow
- Hot reload for both client and server code
- TypeScript compilation checking with `npm run check`
- Database schema changes via Drizzle migrations
- Integrated error handling with custom modal overlays