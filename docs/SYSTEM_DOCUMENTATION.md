# Siargao EcoLoop - Complete System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Integration](#api-integration)
8. [Authentication & Authorization](#authentication--authorization)
9. [Component Organization](#component-organization)
10. [Development Workflow](#development-workflow)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Overview

Siargao EcoLoop is a circular food economy platform designed for the Siargao community. It connects farmers, restaurants, hotels, residents, and local government units (LGUs) to reduce food waste, promote sustainable practices, and create a local circular economy.

### Key Objectives
- Reduce food waste through redistribution and composting
- Connect local producers with consumers
- Provide LGU oversight and planning tools
- Promote sustainable practices through gamification
- Create transparency in the local food supply chain

---

## Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **State Management**: React hooks and custom hooks
- **UI Components**: shadcn/ui with Tailwind CSS
- **Build Tool**: Vite

### Backend Architecture
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage
- **API**: RESTful via Supabase client

### System Flow
```
User → Authentication → Role-based Dashboard → Feature Access → Data Operations → Database
```

---

## Technology Stack

### Frontend
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **TanStack Router**: File-based routing with type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built UI components
- **Lucide React**: Icon library
- **Recharts**: Data visualization
- **Sonner**: Toast notifications
- **Zod**: Schema validation

### Backend
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - File storage
  - Row Level Security (RLS)

### Development Tools
- **Vite**: Build tool and dev server
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Bun**: Package manager and runtime

---

## Project Structure

```
siargao-ecoloop-main/
├── docs/                          # Documentation
│   ├── guides/                    # User guides
│   ├── development/               # Development docs
│   ├── project/                   # Project documentation
│   └── features/                  # Feature documentation
├── public/                        # Static assets
├── src/
│   ├── assets/                    # Images and static files
│   ├── components/                # React components
│   │   ├── layout/               # Layout components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── marketplace/          # Marketplace components
│   │   ├── messaging/            # Chat/messaging components
│   │   ├── notifications/        # Notification components
│   │   ├── waste/                # Waste management components
│   │   ├── feed/                 # Social feed components
│   │   ├── planning/             # Planning & forecast components
│   │   ├── auth/                 # Authentication components
│   │   ├── common/               # Shared/common components
│   │   └── ui/                   # shadcn/ui components
│   ├── config/                    # Configuration files
│   ├── data/                      # Mock data and constants
│   ├── hooks/                     # Custom React hooks
│   ├── integrations/              # Third-party integrations
│   ├── lib/                       # Utility functions
│   ├── routes/                    # Route components
│   │   ├── _authenticated/       # Protected routes
│   │   └── [public routes]       # Public routes
│   ├── styles.css                # Global styles
│   ├── server.ts                 # Server entry
│   ├── start.ts                  # Application entry
│   └── router.tsx               # Router configuration
├── supabase/
│   └── migrations/               # Database migrations
├── .env                          # Environment variables
├── .env.local                    # Local environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── vercel.json                   # Vercel deployment config
```

---

## Core Features

### 1. User Roles & Authentication
- **Farmers**: Post produce listings, manage inventory, view harvest forecasts
- **Restaurants**: Browse marketplace, post waste reports, purchase produce
- **Hotels**: Post waste reports, manage compost collection
- **Residents**: Browse marketplace, post waste reports
- **LGU Admins**: User management, announcements, reports, planning dashboard

### 2. Marketplace System
- **Produce Marketplace**: Fresh local produce listings
- **Food Waste Marketplace**: Available food waste for compost/animal feed
- **Trade Requests**: Barter system between users
- **Purchase Requests**: Direct purchase requests
- **Listing Management**: Create, edit, delete listings with images

### 3. Waste Management
- **Waste Reports**: Submit food waste reports
- **Collection Requests**: Schedule waste collection pickups
- **Compost Inventory**: Track compost production and distribution
- **LGU Oversight**: Monitor waste collection across barangays

### 4. Planning & Forecasting
- **Harvest Forecasts**: Farmers post expected harvests
- **LGU Distributions**: LGU posts upcoming distributions
- **Projected Waste Reports**: Hotel owners post projected waste
- **GIS Map**: Visual monitoring of waste management

### 5. Messaging System
- **Real-time Chat**: Direct messaging between users
- **Message Notifications**: Real-time message alerts
- **Conversation Management**: Organized message threads

### 6. Social Feed
- **Posts**: Share updates and achievements
- **Comments**: Engage with posts
- **Reactions**: Like and react to posts
- **Feed Filtering**: Filter by content type

### 7. Notifications
- **System Notifications**: Platform announcements
- **Activity Notifications**: Trade requests, messages, etc.
- **Notification Management**: Mark as read, delete

### 8. Eco Points & Gamification
- **Points System**: Earn points for sustainable actions
- **Achievements**: Unlock badges and achievements
- **Leaderboards**: Compare sustainability scores

### 9. Theme Customization
- **Font Selection**: Choose from multiple fonts
- **Color Themes**: Select color schemes
- **Dark Mode**: Toggle dark/light mode
- **Custom Backgrounds**: Upload custom backgrounds

### 10. User Profiles
- **Profile Management**: Edit personal information
- **LGU Verification**: Government ID verification
- **Location Settings**: Set municipality and barangay
- **Theme Preferences**: Personalize UI experience

---

## Database Schema

### Core Tables

#### profiles
```sql
- id: UUID (primary key, references auth.users)
- full_name: TEXT
- email: TEXT
- phone: TEXT
- primary_role: TEXT (farmer, restaurant, hotel, resident, lgu_admin)
- municipality: TEXT
- barangay: TEXT
- avatar_url: TEXT
- lgu_verified: BOOLEAN
- lgu_id_document_url: TEXT
- theme_preferences: JSONB
- eco_points: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### marketplace_listings
```sql
- id: UUID (primary key)
- user_id: UUID (references profiles)
- title: TEXT
- description: TEXT
- kind: TEXT (produce, food_waste)
- price: NUMERIC
- quantity: NUMERIC
- unit: TEXT
- municipality: TEXT
- barangay: TEXT
- images: TEXT[]
- status: TEXT (active, sold, cancelled)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### trade_requests
```sql
- id: UUID (primary key)
- from_user_id: UUID
- to_user_id: UUID
- listing_id: UUID
- status: TEXT (pending, accepted, rejected, completed)
- message: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### food_waste_reports
```sql
- id: UUID (primary key)
- user_id: UUID
- business_name: TEXT
- waste_type: TEXT
- quantity_kg: NUMERIC
- municipality: TEXT
- barangay: TEXT
- notes: TEXT
- status: TEXT (pending, scheduled, collected)
- created_at: TIMESTAMP
```

#### waste_collections
```sql
- id: UUID (primary key)
- waste_report_id: UUID
- scheduled_date: DATE
- collected_date: DATE
- status: TEXT
- notes: TEXT
```

#### harvest_forecasts
```sql
- id: UUID (primary key)
- user_id: UUID
- farmer_name: TEXT
- crop_type: TEXT
- estimated_quantity_kg: NUMERIC
- projected_harvest_date: DATE
- municipality: TEXT
- barangay: TEXT
- images: TEXT[]
- status: TEXT
```

#### lgu_distributions
```sql
- id: UUID (primary key)
- user_id: UUID
- lgu_name: TEXT
- distribution_type: TEXT
- title: TEXT
- description: TEXT
- distribution_date: DATE
- location: TEXT
- target_beneficiaries: TEXT[]
- municipality: TEXT
- barangay: TEXT[]
- images: TEXT[]
- status: TEXT
```

#### projected_waste_reports
```sql
- id: UUID (primary key)
- user_id: UUID
- business_name: TEXT
- business_type: TEXT
- estimated_quantity_kg: NUMERIC
- projected_date: DATE
- waste_type: TEXT
- municipality: TEXT
- barangay: TEXT
- images: TEXT[]
- status: TEXT
```

#### announcements
```sql
- id: UUID (primary key)
- title: TEXT
- content: TEXT
- target_role: TEXT[]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### notifications
```sql
- id: UUID (primary key)
- user_id: UUID
- type: TEXT
- title: TEXT
- message: TEXT
- read: BOOLEAN
- created_at: TIMESTAMP
```

#### messages
```sql
- id: UUID (primary key)
- from_user_id: UUID
- to_user_id: UUID
- content: TEXT
- read: BOOLEAN
- created_at: TIMESTAMP
```

#### feed_posts
```sql
- id: UUID (primary key)
- user_id: UUID
- content: TEXT
- images: TEXT[]
- created_at: TIMESTAMP
```

#### feed_comments
```sql
- id: UUID (primary key)
- post_id: UUID
- user_id: UUID
- content: TEXT
- created_at: TIMESTAMP
```

#### feed_reactions
```sql
- id: UUID (primary key)
- post_id: UUID
- user_id: UUID
- emoji: TEXT
```

---

## API Integration

### Supabase Client Configuration
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Common Database Operations

#### Query Data
```typescript
const { data, error } = await supabase
  .from('marketplace_listings')
  .select('*')
  .eq('status', 'active')
```

#### Insert Data
```typescript
const { data, error } = await supabase
  .from('marketplace_listings')
  .insert([{ title, description, kind, price }])
  .select()
```

#### Update Data
```typescript
const { data, error } = await supabase
  .from('marketplace_listings')
  .update({ status: 'sold' })
  .eq('id', listingId)
```

#### Delete Data
```typescript
const { error } = await supabase
  .from('marketplace_listings')
  .delete()
  .eq('id', listingId)
```

#### Real-time Subscriptions
```typescript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
    // Handle new notification
  })
  .subscribe()
```

---

## Authentication & Authorization

### Authentication Flow
1. User registers with email/password
2. Email verification required
3. User selects role (farmer, restaurant, etc.)
4. LGU verification for certain roles
5. Access granted based on role

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies restrict access based on:
  - User authentication
  - User role
  - Data ownership
  - Municipality/barangay

### Role-Based Access Control
```typescript
// Example: Only farmers can create harvest forecasts
CREATE POLICY "Farmers can create harvest forecasts"
ON harvest_forecasts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.primary_role = 'farmer'
  )
);
```

---

## Component Organization

### Layout Components (`src/components/layout/`)
- **SiteHeader**: Main navigation header
- **SiteFooter**: Footer with links and info
- **AppSidebar**: Sidebar navigation
- **Section**: Container and page hero components

### Dashboard Components (`src/components/dashboard/`)
- **FarmerDashboard**: Farmer-specific dashboard
- **RestaurantDashboard**: Restaurant-specific dashboard
- **HotelDashboard**: Hotel-specific dashboard
- **LGUWasteCollectionView**: LGU waste management view

### Marketplace Components (`src/components/marketplace/`)
- **MarketplaceView**: Main marketplace interface
- **ListingCard**: Individual listing display
- **BuyRequestModal**: Purchase request dialog
- **TradeRequestModal**: Trade request dialog

### Messaging Components (`src/components/messaging/`)
- **ChatMessenger**: Real-time chat interface
- **MessagesView**: Message inbox
- **MessageNotification**: Message alert component

### Notification Components (`src/components/notifications/`)
- **NotificationBell**: Notification icon with badge
- **NotificationListener**: Real-time notification listener
- **NotificationsView**: Notification center
- **AnnouncementNotification**: Announcement display

### Waste Components (`src/components/waste/`)
- **WasteCollectionView**: Waste collection management
- **WasteReportsView**: Waste reporting interface
- **ProduceInventoryView**: Inventory management

### Feed Components (`src/components/feed/`)
- **FeedView**: Social feed display
- **PostCard**: Individual post display
- **FeedComments**: Comment section
- **FeedReactions**: Reaction buttons

### Planning Components (`src/components/planning/`)
- **PlanningForecastDashboard**: Planning dashboard
- **GISMapView**: GIS map interface

### Auth Components (`src/components/auth/`)
- **LocationPicker**: Location selection component

### Common Components (`src/components/common/`)
- **LoadingScreen**: Loading animation
- **LanguageSelector**: Language switcher
- **ThemeCustomizer**: Theme settings
- **EcoPointsView**: Points display
- **CircularEconomyWorkflow**: Workflow visualization
- **TransactionDetails**: Transaction information
- **LocationView**: Location display
- **AIChatbot**: AI assistant
- **Media**: Media utilities

---

## Development Workflow

### Getting Started
1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables
4. Run development server: `bun run dev`

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

### Git Workflow
- Main branch: production
- Feature branches: feature/description
- Pull requests for code review

---

## Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Supabase Setup
1. Create Supabase project
2. Run migrations in order
3. Set up storage buckets
4. Configure RLS policies
5. Enable real-time subscriptions

---

## Troubleshooting

### Common Issues

#### Authentication Errors
- Check email verification status
- Verify RLS policies
- Check environment variables

#### Database Connection Issues
- Verify Supabase URL and key
- Check network connectivity
- Review Supabase status

#### Build Errors
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all imports

#### Real-time Not Working
- Enable real-time on Supabase tables
- Check subscription setup
- Verify RLS policies allow real-time---

## Additional Resources

### Documentation
- [User Guides](docs/guides/)
- [Development Docs](docs/development/)
- [Project Documentation](docs/project/)
- [Feature Documentation](docs/features/)

### External Links
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Router](https://tanstack.com/router)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## Support

For issues or questions:
1. Check existing documentation
2. Review troubleshooting section
3. Check Supabase dashboard for errors
4. Review browser console for errors

---

## Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added planning dashboard and GIS map
- **v1.2.0**: Enhanced marketplace with trade system
- **v1.3.0**: Added theme customization
- **v1.4.0**: Component reorganization and documentation

---

*Last Updated: July 14, 2026*
