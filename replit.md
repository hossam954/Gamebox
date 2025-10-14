# Mystery Box Betting Game

## Overview

This is a full-stack mystery box betting game built with React, Express, and TypeScript. Players can select bet amounts, open mystery boxes to reveal multipliers (ranging from losses to 5000x wins), and manage their balance through deposits and withdrawals. The application features a gaming-inspired dark mode UI with admin capabilities for managing users, transactions, and payment settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server with HMR support
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Components & Styling**
- Shadcn UI component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Dark mode gaming aesthetic with custom CSS variables for theming
- Design inspired by casino/gaming platforms (Stake.com, CS:GO case opening)
- Typography hierarchy: Inter (UI), Outfit (display numbers), JetBrains Mono (precise values)

**State Management**
- Local component state with React hooks
- TanStack Query for server-side state synchronization
- LocalStorage for persisting user session data (userId, username, isAdmin)

**Key Features**
- Mystery box opening with animated reveals and win tier celebrations
- Bet selection with horizontal scrolling interface
- Wallet management (deposits, withdrawals, transaction history)
- User settings (password change, promo codes)
- Support ticket system
- Admin panel for user and payment management

### Backend Architecture

**Runtime & Framework**
- Node.js with Express.js for RESTful API endpoints
- TypeScript for type safety across the entire backend
- ESM module system

**API Design**
- RESTful endpoints organized by domain:
  - `/api/auth/*` - Authentication (register, login, password recovery)
  - `/api/users/*` - User management
  - `/api/wallet/*` - Financial transactions
  - `/api/admin/*` - Administrative operations
  - `/api/support/*` - Support ticket handling
  - `/api/promo/*` - Promo code system

**Database Layer**
- SQLite database using Better-SQLite3 for data persistence
  - All user data, transactions, and settings are stored in `database.db`
  - Automatic initialization of admin account and default payment settings
- Storage abstraction pattern (IStorage interface) allows switching between implementations
- Schema-first approach with Drizzle for type-safe database operations
- Database file is git-ignored to prevent committing user data

**Game Logic**
- Mystery box opening generates random multipliers
- Multiplier ranges: 0 (loss) to 5000x with weighted probabilities
- Balance updates are atomic and server-validated
- Win/loss statistics tracked per user
- **House Advantage Control System**: Admin can easily control game outcomes via 4 preset modes:
  - 🎉 Player Wins Mode (~70% win rate): Players win frequently with higher multipliers
  - ⚖️ Balanced Mode (~50% win rate): Fair gameplay with standard settings
  - 💰 House Wins Mode (~25% win rate): House has strong advantage
  - 🚫 Always Lose Mode (0% win rate): Players always lose (testing/maintenance)

### Data Storage Solutions

**Database Schema**
- **users**: Core user data including authentication, balance, statistics, and admin flags
- **password_recovery_requests**: Password reset workflow with admin approval
- **deposit_requests**: Pending deposit transactions requiring admin approval
- **withdraw_requests**: Withdrawal requests with admin approval workflow
- **payment_settings**: Global payment configuration (fees, limits, addresses)
- **payment_methods**: Dynamic payment method configuration
- **promo_codes**: Promotional codes with usage tracking
- **support_tickets**: Customer support ticket system

**Schema Features**
- UUID-based primary keys with auto-generation
- Timestamp tracking for audit trails (createdAt fields)
- Status enums for workflow states (pending, approved, rejected)
- Zod validation schemas generated from Drizzle schemas for runtime validation

### Authentication & Authorization

**Authentication Flow**
- Password-based authentication (plain text storage - should be hashed in production)
- Session management via localStorage (client-side)
- Login accepts username or email
- No JWT/session tokens - relies on userId persistence

**Authorization Levels**
- Regular users: Can play games, manage wallet, submit support tickets
- Admin users: Full access to admin panel, user management, financial approvals
- Role-based route protection on both client and server

**Security Considerations**
- Passwords stored in plain text (security risk - needs bcrypt/argon2)
- No CSRF protection
- No rate limiting on authentication endpoints
- Client-side session storage (vulnerable to XSS)

### External Dependencies

**Frontend Libraries**
- @radix-ui/* - Accessible UI primitives for all interactive components
- @tanstack/react-query - Server state management
- @hookform/resolvers - Form validation integration
- class-variance-authority - Type-safe variant styling
- cmdk - Command palette component
- date-fns - Date manipulation utilities
- lucide-react - Icon library
- tailwind-merge - Tailwind class merging utility
- wouter - Lightweight routing
- zod - Runtime type validation

**Backend Libraries**
- drizzle-orm - Type-safe ORM
- drizzle-kit - Database migrations toolkit
- better-sqlite3 - SQLite database engine for development
- @neondatabase/serverless - PostgreSQL serverless driver for production
- express - Web framework
- tsx - TypeScript execution for development

**Development Tools**
- Vite plugins for Replit integration (@replit/vite-plugin-*)
- TypeScript with strict mode enabled
- ESBuild for production bundling
- PostCSS with Tailwind and Autoprefixer

**Database Services**
- Configured for Neon serverless PostgreSQL (via DATABASE_URL environment variable)
- Falls back to SQLite for local development
- Migration system via drizzle-kit