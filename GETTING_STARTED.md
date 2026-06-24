# Getting Started with EcoLoop Siargao

## Prerequisites

- Node.js 18+ or Bun runtime
- Git
- Supabase account (free tier available at https://supabase.com)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd siargao-ecoloop-main
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

Get these values from your Supabase project settings.

### 4. Database Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

#### Option B: Manual Setup

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run migrations from `supabase/migrations/` in order
4. Verify tables are created

### 5. Storage Setup

1. In Supabase dashboard, go to Storage
2. Create a new bucket called `uploads` (or match VITE_SUPABASE_STORAGE_BUCKET)
3. Set bucket policies to allow authenticated uploads

### 6. Start Development Server

Using Bun:
```bash
bun dev
```

Or using npm:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Project Structure

```
siargao-ecoloop-main/
├── src/
│   ├── components/          # React components
│   │   ├── FarmerDashboard.tsx
│   │   ├── RestaurantDashboard.tsx
│   │   ├── MarketplaceView.tsx
│   │   ├── FeedView.tsx
│   │   └── ...
│   ├── routes/              # TanStack Router pages
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Landing page
│   │   ├── auth.tsx         # Login/signup
│   │   └── _authenticated/  # Protected routes
│   │       ├── dashboard/
│   │       │   ├── farmer.tsx
│   │       │   └── restaurant.tsx
│   │       ├── dashboard.tsx (LGU)
│   │       ├── marketplace.tsx
│   │       ├── feed.tsx
│   │       └── ...
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── integrations/        # Supabase integration
│   ├── assets/              # Images and static files
│   └── styles.css           # Global styles
├── supabase/
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase config
├── public/                  # Static files
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Dependencies
```

---

## User Roles & Access

### Farmer
- **Route**: `/dashboard/farmer`
- **Features**: 
  - Produce inventory
  - Order management
  - Compost purchasing
  - Community participation

### Restaurant/Hotel
- **Route**: `/dashboard/restaurant`
- **Features**:
  - Browse & purchase produce
  - Waste reporting
  - Collection scheduling
  - Community participation

### LGU Admin
- **Route**: `/dashboard`
- **Features**:
  - System analytics
  - User management
  - Waste monitoring
  - Compost management
  - Reports & statistics

### Resident (Local User)
- **Route**: Community section
- **Features**:
  - Browse marketplace
  - Community feed
  - Messages
  - Eco points

---

## Testing the Application

### Create Test Accounts

1. Go to `/auth` on running app
2. Click "Sign up"
3. Use different roles for each account
4. Use test email addresses (e.g., farmer@test.com, restaurant@test.com)

### Test Workflows

#### Produce Listing Workflow
1. Login as Farmer
2. Go to Produce Inventory
3. Create a new listing
4. Login as Restaurant
5. Browse marketplace
6. Place purchase request
7. Verify notifications

#### Waste Management Workflow
1. Login as Restaurant
2. Submit waste report
3. Schedule collection
4. Login as LGU Admin
5. View waste submissions
6. Monitor collection

#### Community Engagement
1. Any user goes to `/feed`
2. Create a post with optional image
3. Like and comment on other posts
4. Earn eco points
5. View eco points progress at `/eco-points`

---

## Common Issues & Troubleshooting

### Issue: "Supabase connection failed"
**Solution**: 
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
- Check Supabase project is active
- Verify API keys are correct

### Issue: "File upload fails"
**Solution**:
- Ensure `uploads` bucket exists in Supabase Storage
- Check bucket policies allow authenticated uploads
- Verify VITE_SUPABASE_STORAGE_BUCKET matches bucket name

### Issue: "Routes not loading"
**Solution**:
- Clear browser cache
- Restart dev server
- Check database migrations were applied

### Issue: "Images not displaying"
**Solution**:
- Verify image URLs in database are correct
- Check Supabase Storage URL format
- Ensure signed URLs if private bucket

---

## Building for Production

### Build the Application

Using Bun:
```bash
bun build
```

Or using npm:
```bash
npm run build
```

Output will be in `dist/` directory.

### Deployment Options

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

#### Docker
```bash
docker build -t ecoloop-siargao .
docker run -p 80:5173 ecoloop-siargao
```

#### Traditional Hosting
- Upload `dist/` to web server
- Configure web server for SPA routing
- Set environment variables on server

---

## API Endpoints

All data is accessed through Supabase client SDK. Key tables:

- `profiles` - User information
- `marketplace_listings` - Produce listings
- `purchase_requests` - Buy requests
- `trade_requests` - Barter requests
- `feed_posts` - Community posts
- `comments` - Post comments
- `notifications` - User notifications
- `waste_reports` - Food waste submissions
- `compost_inventory` - Available compost

See `src/integrations/supabase/types.ts` for full schema.

---

## Database Migrations

Migrations are in `supabase/migrations/` and include:

- User and profile setup
- Marketplace tables
- Trade and purchase request tables
- Conversation and message tables
- Notification system
- Feed, comments, and likes tables
- Waste reporting tables
- Compost inventory tables
- Database triggers for automation

Apply migrations in order using Supabase CLI or manually.

---

## Key Features Overview

| Feature | Location | Notes |
|---------|----------|-------|
| Marketplace | `/marketplace` | Browse & trade/purchase produce |
| Feed | `/feed` | Community posts & interactions |
| Eco Points | `/eco-points` | Gamification system |
| Notifications | `/notifications` | Real-time notifications |
| Messages | `/messages` | In-app chat |
| Waste Reports | `/waste-reports` | Report food waste |
| Analytics | `/dashboard` | LGU admin analytics |
| Compost | `/compost-marketplace` | Compost inventory |

---

## Development Tips

### Code Organization
- Components: One component per file
- Hooks: In `src/hooks/` directory
- API functions: In `src/lib/api/` directory
- Utils: In `src/lib/` directory

### TypeScript
- Type definitions in `src/integrations/supabase/types.ts`
- Use types for database tables
- Import from types file

### Styling
- Use Tailwind classes
- Color system: primary (green), accent (orange)
- Dark mode ready with color system

### Performance
- TanStack Query for caching
- Lazy loading components
- Image optimization
- Database query optimization

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TanStack Router**: https://tanstack.com/router
- **TypeScript**: https://www.typescriptlang.org

---

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

---

## License

[Add appropriate license]

---

## Contact

For questions or support, contact: [support email]

---

**Happy coding! 🌱**
