# Folder Reorganization Plan

## Current Issues
- Root directory cluttered with 13+ documentation files
- Components scattered without logical grouping
- No clear separation between feature-specific components
- Difficult to locate related files

## Proposed Structure

### Documentation Organization
```
docs/
├── guides/              # User guides and getting started
│   ├── GETTING_STARTED.md
│   ├── QUICK_REFERENCE.md
│   └── SUPABASE_AUTH_SETUP.md
├── development/         # Development documentation
│   ├── 00-START-HERE.md
│   ├── COMPLETION_CHECKLIST.md
│   └── FEATURE_VERIFICATION_CHECKLIST.md
├── project/            # Project documentation
│   ├── PROJECT_SUMMARY.md
│   ├── README_OVERVIEW.md
│   ├── COMPLETION_SUMMARY.md
│   ├── FINAL_DELIVERY.md
│   └── IMPLEMENTATION_COMPLETE.md
├── features/           # Feature-specific docs
│   ├── MARKETPLACE_FEATURES_IMPLEMENTATION.md
│   └── VISUAL_SUMMARY.md
└── README.md           # Main documentation index
```

### Component Organization
```
src/components/
├── layout/             # Layout components
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   ├── AppSidebar.tsx
│   └── Section.tsx
├── dashboard/          # Dashboard-specific components
│   ├── FarmerDashboard.tsx
│   ├── RestaurantDashboard.tsx
│   ├── HotelDashboard.tsx
│   └── LGUWasteCollectionView.tsx
├── marketplace/        # Marketplace components
│   ├── MarketplaceView.tsx
│   ├── ListingCard.tsx
│   ├── BuyRequestModal.tsx
│   └── TradeRequestModal.tsx
├── messaging/          # Chat/messaging components
│   ├── ChatMessenger.tsx
│   ├── MessagesView.tsx
│   └── MessageNotification.tsx
├── notifications/      # Notification components
│   ├── NotificationBell.tsx
│   ├── NotificationListener.tsx
│   ├── NotificationsView.tsx
│   └── AnnouncementNotification.tsx
├── waste/             # Waste management components
│   ├── WasteCollectionView.tsx
│   ├── WasteReportsView.tsx
│   └── ProduceInventoryView.tsx
├── feed/              # Social feed components
│   ├── FeedView.tsx
│   ├── PostCard.tsx
│   ├── FeedComments.tsx
│   └── FeedReactions.tsx
├── planning/          # Planning & forecast components
│   ├── PlanningForecastDashboard.tsx
│   └── GISMapView.tsx
├── auth/              # Authentication components
│   └── LocationPicker.tsx
├── common/            # Shared/common components
│   ├── LoadingScreen.tsx
│   ├── LanguageSelector.tsx
│   ├── ThemeCustomizer.tsx
│   ├── EcoPointsView.tsx
│   ├── CircularEconomyWorkflow.tsx
│   ├── TransactionDetails.tsx
│   ├── LocationView.tsx
│   ├── AIChatbot.tsx
│   └── Media.tsx
└── ui/                # UI components (shadcn/ui)
    └── [existing UI components]
```

### Migration Steps
1. Create new folder structure
2. Move components to appropriate folders
3. Update import statements in all files
4. Move documentation files to docs/
5. Update any file references
6. Test application
7. Generate comprehensive system documentation
