# EcoLoop Siargao - Quick Reference Guide

## 🚀 Quick Start

### Start Development Server
```bash
bun dev
# or
npm run dev
```

### Build for Production
```bash
bun build
# or
npm run build
```

### Apply Database Migrations
```bash
supabase db push
```

---

## 📍 Key URLs

### Public Pages
- Home: `/`
- Login: `/auth`

### Authenticated Routes
- Farmer Dashboard: `/dashboard/farmer`
- Restaurant Dashboard: `/dashboard/restaurant`
- LGU Dashboard: `/dashboard`
- Marketplace: `/marketplace`
- Feed: `/feed`
- Eco Points: `/eco-points`
- Notifications: `/notifications`
- Messages: `/messages`
- Profile: `/profile`

### Farmer Routes
- Produce Inventory: `/inventory`
- Orders: `/orders`
- Compost: `/compost-marketplace`
- Compost History: `/compost-history`

### Restaurant Routes
- Order History: `/order-history`
- Waste Reports: `/waste-reports`
- Waste Collection: `/waste-collection`

### LGU Admin Routes
- Diversion Monitoring: `/dashboard-diversion`
- User Management: `/dashboard-users`
- Reports: `/dashboard-reports`
- Announcements: `/dashboard-announcements`
- GIS Map: `/gis-map`

---

## 🔐 User Roles

| Role | Primary Roles | Features |
|------|-----------|----------|
| Farmer | `farmer` | Produce listing, compost purchasing, order management |
| Restaurant | `restaurant` | Produce browsing, waste reporting, collection scheduling |
| Resident | `resident` | Community participation, marketplace access |
| LGU Admin | `lgu_admin` | System administration, monitoring, reporting |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/hooks/use-auth.tsx` | Authentication hook |
| `src/lib/api/` | API/database functions |
| `src/integrations/supabase/` | Supabase client & types |
| `supabase/migrations/` | Database schema |
| `src/routes/` | Application routes |
| `src/components/` | React components |
| `.env.local` | Environment variables |

---

## 🗄️ Key Database Tables

```sql
-- Users and profiles
profiles (id, email, full_name, primary_role, profile_picture_url)

-- Marketplace
marketplace_listings (id, user_id, title, price, transaction_type, category)
purchase_requests (id, user_id, listing_id, status)
trade_requests (id, from_user_id, to_user_id, status)

-- Communication
conversations (id, created_by, participant_id)
messages (id, conversation_id, sender_id, content)
notifications (id, user_id, type, read_at)

-- Community
feed_posts (id, user_id, content, role)
comments (id, post_id, user_id, content)
likes (id, post_id, user_id)

-- Waste Management
waste_reports (id, user_id, quantity, status)
waste_collections (id, waste_report_id, scheduled_date)

-- Compost
compost_inventory (id, quantity, available_date)
compost_requests (id, user_id, quantity, status)
```

---

## 🔄 Common Workflows

### Create Produce Listing (Farmer)
1. Login as Farmer
2. Navigate to Inventory
3. Click "New Listing"
4. Fill form with produce details
5. Upload image
6. Select transaction type
7. Publish

### Purchase Produce (Restaurant)
1. Login as Restaurant
2. Go to Marketplace
3. Search/filter for produce
4. Click listing
5. Place purchase request
6. Wait for farmer approval
7. Receive in Orders

### Submit Waste (Restaurant)
1. Login as Restaurant
2. Go to Waste Reports
3. Click "Submit Report"
4. Enter waste details
5. Schedule collection
6. Receive collection confirmation

### Process Waste (LGU Admin)
1. Login as LGU Admin
2. Go to Diversion Monitoring
3. View waste submissions
4. Schedule collection
5. Assign collection officer
6. Mark as collected
7. Process into compost
8. List compost for farmers

---

## 🛠️ Debugging Tips

### Check Database Connection
```typescript
import { supabase } from '@/integrations/supabase/client';

// Test connection
const { data, error } = await supabase.from('profiles').select('*').limit(1);
console.log(data, error);
```

### Check Authentication
```typescript
import { supabase } from '@/integrations/supabase/client';

// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
```

### Check Real-Time Subscriptions
```typescript
// Subscribe to changes
supabase
  .channel('profiles')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
    console.log('Change received!', payload);
  })
  .subscribe();
```

### View Logs
- Browser console: Open DevTools (F12)
- Supabase: View logs in Supabase dashboard
- Terminal: Check for errors in terminal

---

## 📊 Useful Queries

### Get User's Listings
```typescript
const { data } = await supabase
  .from('marketplace_listings')
  .select('*')
  .eq('user_id', userId);
```

### Get User's Orders
```typescript
const { data } = await supabase
  .from('purchase_requests')
  .select('*')
  .eq('user_id', userId);
```

### Get Feed Posts
```typescript
const { data } = await supabase
  .from('feed_posts')
  .select('*')
  .order('created_at', { ascending: false });
```

### Get Notifications
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('read_at', null);
```

---

## 🎨 Color System

| Color | Usage | Tailwind Class |
|-------|-------|----------------|
| Green/Primary | Main theme, buttons, links | `text-primary`, `bg-primary` |
| Orange/Accent | Restaurant portal, highlights | `text-accent`, `bg-accent` |
| Slate | Text, backgrounds | `text-slate-*`, `bg-slate-*` |

---

## 📦 Dependencies

### Frontend
- react: UI library
- @tanstack/react-router: Routing
- @tanstack/react-query: Data management
- tailwindcss: Styling
- @supabase/supabase-js: Supabase client
- recharts: Charts
- lucide-react: Icons

### Backend
- Supabase (PostgreSQL)
- PostgREST (API)
- Realtime (Subscriptions)
- Auth (Authentication)
- Storage (File storage)

---

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

---

## 🚨 Common Errors & Solutions

### Error: "User is not authenticated"
- User not logged in
- Session expired
- Authentication failed
- **Fix**: Ensure user is logged in

### Error: "Table does not exist"
- Database migrations not applied
- Wrong table name
- **Fix**: Run `supabase db push`

### Error: "No matching function"
- RLS policy denies access
- Function doesn't exist
- **Fix**: Check RLS policies, verify function exists

### Error: "Bucket does not exist"
- Storage bucket not created
- Wrong bucket name
- **Fix**: Create bucket or update `VITE_SUPABASE_STORAGE_BUCKET`

### Error: "CORS error"
- Request from wrong origin
- Supabase CORS not configured
- **Fix**: Add origin to Supabase CORS settings

---

## 📈 Performance Tips

1. **Use React.memo** for expensive components
2. **Lazy load** routes with dynamic imports
3. **Optimize images** before uploading
4. **Paginate** large lists
5. **Cache queries** with React Query
6. **Debounce** search inputs
7. **Use indexes** on frequently queried columns

---

## 🔒 Security Reminders

- Never commit `.env.local` to git
- Rotate API keys regularly
- Keep dependencies updated
- Use environment variables for secrets
- Validate user input
- Implement RLS policies
- Use HTTPS in production
- Monitor for suspicious activity

---

## 📞 Support Contacts

- **Supabase Docs**: https://supabase.com/docs
- **React Help**: https://react.dev/learn
- **TanStack Router**: https://tanstack.com/router
- **Tailwind CSS**: https://tailwindcss.com

---

## 🎯 Development Checklist

Before pushing code:
- [ ] Code works locally
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Tested in multiple browsers
- [ ] Responsive design verified
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Comments added for complex logic
- [ ] Tests pass (if applicable)
- [ ] Performance acceptable

---

## 📅 Maintenance Schedule

### Daily
- Monitor error logs
- Check Supabase status
- Verify critical features working

### Weekly
- Review user feedback
- Check for updates
- Test core workflows
- Backup database

### Monthly
- Security audit
- Performance review
- Update dependencies
- Review analytics
- Plan improvements

### Quarterly
- Major feature releases
- Infrastructure review
- Capacity planning
- User surveys

---

## 🎓 Learning Resources

- **Getting Started**: `GETTING_STARTED.md`
- **Features**: `IMPLEMENTATION_COMPLETE.md`
- **Marketplace**: `MARKETPLACE_FEATURES_IMPLEMENTATION.md`
- **Verification**: `FEATURE_VERIFICATION_CHECKLIST.md`

---

**Keep this guide bookmarked for quick reference!** 🚀
