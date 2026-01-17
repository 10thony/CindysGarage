# Missing Functionality Specification

This document details all functionality described in the README that has not yet been implemented in the codebase.

## Overview

The README describes a comprehensive garage sale inventory management platform with real-time sync, authentication, payments, and mobile-optimized UI. Currently, only the basic project structure, schema definitions, and a minimal welcome page have been implemented.

---

## 1. Discovery Dashboard UI

### Status: ❌ Not Implemented

### Description
The homepage should feature a Discovery Dashboard with horizontal scrolling "shelves" optimized for mobile browsing.

### Missing Components:

#### 1.1 Global Layout
- [ ] **Reactive Container**: Adaptive padding that shrinks on mobile devices
- [ ] **Full-Width Scrolls**: Cards that bleed to the edge to signal swipeable content

#### 1.2 Dual Search Bars
- [ ] **Top Search Bar**: 
  - Filters garages by name, city, or owner
  - Real-time filtering as user types
  - Clear/reset functionality
- [ ] **Bottom Search Bar**: 
  - Filters items by name, category, or price range
  - Price range slider/input
  - Category dropdown/filter

#### 1.3 Horizontal Scrolling Shelves
- [ ] **Implementation**: `flex overflow-x-auto` with `snap-type-x mandatory` CSS
- [ ] **Gesture Support**: Framer Motion integration for native-feeling swipe physics
- [ ] **Top Shelf - Garage Cards**:
  - Display garage name
  - Display total items count
  - Progress bar showing sold vs. remaining value
  - Click/tap navigation to `/garage/$garageId`
  - Card design with proper spacing and styling
- [ ] **Bottom Shelf - Item Cards**:
  - Thumbnail image display
  - Price tag overlay
  - Item name
  - Garage name (as clickable link)
  - Click/tap navigation to `/item/$itemId`
  - Card design with proper spacing and styling

---

## 2. Routing & Pages

### Status: ❌ Not Implemented

### Missing Routes:

#### 2.1 Garage Detail Page (`/garage/$garageId`)
- [ ] Route definition in `src/routes/garage/$garageId.tsx`
- [ ] Display garage information (name, description, owner)
- [ ] List all items in the garage
- [ ] Filter/sort items within garage view
- [ ] Owner-specific actions (if authenticated as owner):
  - Edit garage details
  - Add new items
  - Manage existing items

#### 2.2 Item Detail Page (`/item/$itemId`)
- [ ] Route definition in `src/routes/item/$itemId.tsx`
- [ ] Display full item image
- [ ] Item details (name, price, description, status)
- [ ] Garage information and link
- [ ] Add to cart functionality
- [ ] Owner-specific actions (if authenticated as owner):
  - Edit item details
  - Update price
  - Mark as sold
  - Delete item

#### 2.3 Owner Dashboard (Optional but recommended)
- [ ] Route for garage owners to manage their garages
- [ ] List of all garages owned by user
- [ ] Create new garage functionality
- [ ] Sales analytics/statistics

---

## 3. Convex Backend Functions

### Status: ❌ Not Implemented

### Missing Queries:

#### 3.1 Garage Queries
- [ ] `listGarages`: Query to fetch all public garages (or user's garages if authenticated)
- [ ] `getGarage`: Query to fetch a single garage by ID
- [ ] `getGaragesByOwner`: Query to fetch all garages for a specific owner
- [ ] `searchGarages`: Query to search garages by name, city, or owner

#### 3.2 Item Queries
- [ ] `listItems`: Query to fetch all available items (with optional filters)
- [ ] `getItem`: Query to fetch a single item by ID
- [ ] `getItemsByGarage`: Query to fetch all items for a specific garage
- [ ] `searchItems`: Query to search items by name, category, or price range
- [ ] `getItemsByStatus`: Query to filter items by status (available, sold, pending)

#### 3.3 Order Queries
- [ ] `getOrdersByCustomer`: Query to fetch all orders for a customer
- [ ] `getOrder`: Query to fetch a single order by ID
- [ ] `getOrdersByItem`: Query to fetch orders containing a specific item

#### 3.4 User Queries
- [ ] `getUser`: Query to fetch user by Clerk ID
- [ ] `getCurrentUser`: Query to fetch authenticated user's profile

### Missing Mutations:

#### 3.5 Garage Mutations
- [ ] `createGarage`: 
  - Requires authentication
  - Creates a new garage with ownerId from authenticated user
  - Validates input (name, description, isPublic)
- [ ] `updateGarage`:
  - Requires authentication
  - Verifies ownership (`garage.ownerId === identity.subject`)
  - Updates garage details
- [ ] `deleteGarage`:
  - Requires authentication
  - Verifies ownership
  - Handles cascade deletion of items (or prevents deletion if items exist)

#### 3.6 Item Mutations
- [ ] `createItem` / `addItemToGarage`:
  - Requires authentication
  - Verifies garage ownership (`garage.ownerId === identity.subject`)
  - Creates item with imageUrl from UploadThing
  - Sets initial status to "available"
- [ ] `updateItem`:
  - Requires authentication
  - Verifies item ownership (`item.ownerId === identity.subject`)
  - Updates item details (name, price, image, status)
- [ ] `deleteItem`:
  - Requires authentication
  - Verifies ownership
  - Removes item from garage
- [ ] `markItemAsPending`:
  - Sets item status to "pending" when added to cart
  - Implements 10-minute lock mechanism
  - Auto-releases if not purchased within timeout
- [ ] `markItemAsSold`:
  - Updates item status to "sold"
  - Sets purchasedAt timestamp
  - Called via Stripe webhook

#### 3.7 Order Mutations
- [ ] `createOrder`:
  - Creates order record with Stripe session ID
  - Links items to order
  - Sets initial status
- [ ] `updateOrderStatus`:
  - Updates order status (typically called via webhook)
  - Handles payment confirmation

### Missing Actions:

#### 3.8 Stripe Integration Actions
- [ ] `createCheckoutSession`:
  - Creates Stripe checkout session
  - Returns session URL for redirect
  - Links session to order
- [ ] `handleStripeWebhook` (HTTP Action):
  - Processes Stripe webhook events
  - Updates order status on payment success
  - Marks items as sold
  - Releases pending items on payment failure

---

## 4. Authentication Integration

### Status: ❌ Not Implemented

### Missing Components:

#### 4.1 Clerk Setup
- [ ] Clerk provider wrapper in root component
- [ ] Environment variables for Clerk keys
- [ ] Authentication context/hooks integration
- [ ] Sign-in/Sign-up UI components
- [ ] Protected route wrapper for owner-only pages

#### 4.2 User Management
- [ ] User profile creation on first login (sync with Convex users table)
- [ ] Role management (Owner vs Customer)
- [ ] User profile display/edit functionality

#### 4.3 Authentication Barriers
- [ ] Frontend route protection for authenticated pages
- [ ] Backend authentication checks in Convex functions (as described in README)

---

## 5. Payment Integration (Stripe)

### Status: ❌ Not Implemented

### Missing Components:

#### 5.1 Checkout Flow
- [ ] Cart state management
- [ ] Checkout button/trigger
- [ ] Integration with `createCheckoutSession` action
- [ ] Redirect to Stripe checkout
- [ ] Return URL handling after payment

#### 5.2 Webhook Handling
- [ ] Stripe webhook endpoint configuration
- [ ] Webhook signature verification
- [ ] Event processing (payment success/failure)
- [ ] Order status updates
- [ ] Item status updates (sold/pending release)

#### 5.3 Payment UI
- [ ] Cart display (item list, totals)
- [ ] Payment confirmation page
- [ ] Order history view

---

## 6. Image Upload (UploadThing)

### Status: ❌ Not Implemented

### Missing Components:

#### 6.1 Upload Configuration
- [ ] UploadThing API route setup
- [ ] File upload component
- [ ] Image preview functionality
- [ ] Upload progress indicator

#### 6.2 Image Management
- [ ] Image upload on item creation
- [ ] Image update on item edit
- [ ] Image deletion (cleanup)
- [ ] Image optimization/compression

#### 6.3 Optimistic UI
- [ ] Display placeholder while image uploads
- [ ] Update UI immediately with placeholder
- [ ] Replace with actual image when upload completes

---

## 7. Shopping Cart Functionality

### Status: ❌ Not Implemented

### Missing Components:

#### 7.1 Cart State Management
- [ ] Cart state (local state or context)
- [ ] Add to cart functionality
- [ ] Remove from cart functionality
- [ ] Update quantities (if multi-quantity supported)
- [ ] Cart persistence (localStorage or session)

#### 7.2 Cart UI
- [ ] **Sticky Cart FAB**: Floating action button in bottom right
  - Shows item count badge
  - Opens slide-over checkout panel on click
- [ ] **Slide-over Checkout Panel**:
  - List of items in cart
  - Item details (image, name, price)
  - Total calculation
  - Remove item buttons
  - Checkout button
  - Empty cart state

#### 7.3 Cart Logic
- [ ] Prevent adding sold items
- [ ] Handle pending items (10-minute lock)
- [ ] Update item status to "pending" when added
- [ ] Release pending items if cart abandoned

---

## 8. Mobile Features & Optimizations

### Status: ❌ Not Implemented

### Missing Components:

#### 8.1 Haptic Feedback
- [ ] WebHaptics API integration
- [ ] Haptic feedback on:
  - Item added to cart
  - Successful purchase
  - Error states
- [ ] Feature detection and graceful degradation

#### 8.2 PWA Capabilities
- [ ] Service Worker registration
- [ ] Service Worker implementation:
  - Cache Garage cards for offline viewing
  - Cache Item cards for offline viewing
  - Cache strategy (network-first, cache-fallback)
- [ ] Web App Manifest:
  - App name, icons, theme colors
  - Display mode (standalone)
  - Start URL
- [ ] Offline detection and messaging

#### 8.3 Mobile Optimizations
- [ ] Touch-friendly button sizes
- [ ] Swipe gestures for navigation
- [ ] Pull-to-refresh functionality
- [ ] Mobile viewport optimizations
- [ ] Performance optimizations (lazy loading, image optimization)

---

## 9. Real-time Updates

### Status: ❌ Not Implemented

### Missing Components:

#### 9.1 Convex Real-time Queries
- [ ] Use Convex `useQuery` hooks for real-time data
- [ ] Automatic UI updates when data changes
- [ ] Optimistic updates for mutations

#### 9.2 Live Inventory Updates
- [ ] Items appear/disappear in real-time as they're sold
- [ ] Garage progress bars update in real-time
- [ ] Cart updates reflect current item availability

---

## 10. Security & Permissions

### Status: ❌ Not Implemented

### Missing Implementation:

#### 10.1 Authentication Barriers
- [ ] All mutations require `ctx.auth.getUserIdentity()` check
- [ ] Return appropriate errors for unauthenticated requests

#### 10.2 Ownership Verification
- [ ] `addItemToGarage`: Verify `garage.ownerId === identity.subject`
- [ ] `updateItem`: Verify `item.ownerId === identity.subject`
- [ ] `updateGarage`: Verify `garage.ownerId === identity.subject`
- [ ] Return appropriate errors for unauthorized requests

#### 10.3 State Management
- [ ] Items move to "pending" status when added to cart
- [ ] 10-minute timeout mechanism for pending items
- [ ] Automatic release of pending items after timeout
- [ ] Status update to "sold" on successful Stripe webhook

---

## 11. UI Components & Styling

### Status: ⚠️ Partially Implemented

### Missing Components:

#### 11.1 Base UI Components
- [ ] Card component (for Garage and Item cards)
- [ ] Search input component
- [ ] Progress bar component
- [ ] Badge component (for cart count)
- [ ] Slide-over panel component
- [ ] Loading states/skeletons
- [ ] Error states/error boundaries

#### 11.2 Styling
- [ ] Complete Tailwind CSS implementation for all components
- [ ] Framer Motion animations:
  - Swipe gestures
  - Card transitions
  - Page transitions
  - Loading animations
- [ ] Responsive design for all breakpoints
- [ ] Dark mode support (if desired)

---

## 12. Error Handling & Validation

### Status: ❌ Not Implemented

### Missing Components:

#### 12.1 Input Validation
- [ ] Form validation for garage creation/editing
- [ ] Form validation for item creation/editing
- [ ] Price validation (positive numbers, reasonable ranges)
- [ ] Image validation (file type, size limits)

#### 12.2 Error Handling
- [ ] Error boundaries for React components
- [ ] Error messages for failed mutations
- [ ] Network error handling
- [ ] Stripe error handling
- [ ] UploadThing error handling

#### 12.3 User Feedback
- [ ] Success notifications (toast messages)
- [ ] Error notifications
- [ ] Loading indicators
- [ ] Confirmation dialogs for destructive actions

---

## 13. Testing & Quality Assurance

### Status: ❌ Not Implemented

### Missing Components:

#### 13.1 Unit Tests
- [ ] Convex function tests
- [ ] Component tests
- [ ] Utility function tests

#### 13.2 Integration Tests
- [ ] End-to-end user flows
- [ ] Payment flow testing
- [ ] Authentication flow testing

#### 13.3 Performance Testing
- [ ] Load testing for real-time updates
- [ ] Image optimization verification
- [ ] Mobile performance testing

---

## 14. Environment Configuration

### Status: ⚠️ Partially Implemented

### Missing Components:

#### 14.1 Environment Variables
- [ ] Clerk configuration (publishable key, secret key)
- [ ] Stripe configuration (publishable key, secret key, webhook secret)
- [ ] UploadThing configuration (API keys)
- [ ] Convex deployment URL
- [ ] Environment variable validation on startup

#### 14.2 Configuration Files
- [ ] `.env.example` updates with all required variables
- [ ] Environment-specific configurations (dev, staging, prod)

---

## 15. Documentation

### Status: ⚠️ Partially Implemented

### Missing Components:

#### 15.1 Code Documentation
- [ ] JSDoc comments for all functions
- [ ] Component documentation
- [ ] API documentation

#### 15.2 User Documentation
- [ ] User guide for garage owners
- [ ] User guide for customers
- [ ] FAQ section

---

## Priority Recommendations

### High Priority (Core Functionality)
1. **Convex Backend Functions** - All queries and mutations
2. **Discovery Dashboard UI** - Main user-facing feature
3. **Authentication Integration** - Required for ownership features
4. **Routing & Pages** - Garage and Item detail pages
5. **Cart Functionality** - Core shopping experience

### Medium Priority (Enhanced Experience)
6. **Payment Integration** - Complete the purchase flow
7. **Image Upload** - Essential for item listings
8. **Real-time Updates** - Core value proposition
9. **Security & Permissions** - Critical for data integrity

### Low Priority (Polish & Optimization)
10. **Mobile Features** - PWA, haptics, optimizations
11. **Error Handling** - Better user experience
12. **Testing** - Quality assurance
13. **Documentation** - Developer and user guides

---

## Implementation Notes

- The schema is already defined in `convex/schema.ts` and matches the README specification
- Dependencies are installed in `package.json` but not yet integrated
- The project structure follows TanStack Start conventions
- Consider implementing features incrementally, starting with queries and basic UI, then adding mutations and advanced features

---

**Last Updated**: Based on codebase analysis as of project review date
**Total Missing Features**: ~100+ individual components/functions across 15 major categories
