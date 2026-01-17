# Garage Sale Inventory Manager

A mobile-first, high-performance garage sale inventory management platform that enables owners to manage their garage sales and customers to discover and purchase items in real-time.

## 🚀 Features

- **Discovery Dashboard**: Browse garages and items through intuitive horizontal scrolling "shelves"
- **Real-time Sync**: Live updates using Convex for instant inventory changes
- **Multi-tenant Authentication**: Support for "Owner" and "Customer" roles via Clerk
- **Secure Payments**: Integrated Stripe checkout for seamless transactions
- **Image Hosting**: UploadThing integration for item photos
- **Mobile-Optimized**: PWA support with offline capabilities and haptic feedback
- **Optimistic UI**: Instant feedback while background operations complete

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fastest JavaScript runtime
- **Framework**: [TanStack Start](https://tanstack.com/start) - SSR with type-safe routing
- **Database & Backend**: [Convex](https://www.convex.dev/) - Real-time sync with TypeScript-first schema
- **Authentication**: [Clerk](https://clerk.com/) - Multi-tenant user management
- **Payments**: [Stripe](https://stripe.com/) - Checkout sessions and seller payouts
- **Storage**: [UploadThing](https://uploadthing.com/) - Image hosting
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) - Responsive design with fluid animations

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Accounts set up for:
  - Convex
  - Clerk
  - Stripe
  - UploadThing

## 🏁 Getting Started

### Installation

```bash
# Initialize the project
bun create tanstack-start garage-sale-manager

# Install dependencies
bun add convex clerk-react @tanstack/react-router uploadthing stripe framer-motion
```

### Development

```bash
# Start both the Convex backend and frontend development server
bun run dev
```

This will run both `bunx convex dev` and `vite dev` concurrently. If you need to run them separately, you can use:
- `bun run dev:convex` - Run only the Convex backend
- `bun run dev:vite` - Run only the Vite frontend

## 🎨 UI/UX Design

### Discovery Dashboard

The homepage features a **Discovery Dashboard** with horizontal "shelves" optimized for mobile browsing while maximizing vertical screen space.

#### Global Layout

- **Reactive Container**: Adaptive padding that shrinks on mobile devices
- **Full-Width Scrolls**: Cards bleed to the edge to signal swipeable content
- **Dual Search Bars**:
  - **Top Search**: Filters garages by name, city, or owner
  - **Bottom Search**: Filters items by name, category, or price range

#### Horizontal Scrolling Shelves

- **Implementation**: `flex overflow-x-auto` with `snap-type-x mandatory`
- **Gesture Support**: Framer Motion handles native-feeling swipe physics

**Garage Card (Top Shelf)**
- Displays: Name, Total Items count, Progress bar (sold vs. remaining value)
- Navigation: Tapping routes to `/garage/$garageId`

**Item Card (Bottom Shelf)**
- Displays: Thumbnail image, Price tag overlay, Name, Garage name (as link)
- Navigation: Tapping routes to `/item/$itemId`

## 🗄️ Database Schema

The Convex schema defines the following tables:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  garages: defineTable({
    ownerId: v.string(), // Clerk User ID
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  }).index("by_owner", ["ownerId"]),

  items: defineTable({
    garageId: v.id("garages"),
    ownerId: v.string(), 
    name: v.string(),
    imageUrl: v.string(), // UploadThing URL
    initialPrice: v.number(),
    salePrice: v.number(),
    status: v.union(v.literal("available"), v.literal("sold"), v.literal("pending")),
    purchasedAt: v.number(), // Timestamp
  }).index("by_garage", ["garageId"]),

  orders: defineTable({
    customerId: v.string(),
    itemIds: v.array(v.id("items")),
    stripeSessionId: v.string(),
    totalAmount: v.number(),
    status: v.string(),
  })
});
```

## 🔒 Security & Permissions

The Convex backend enforces the following security measures:

### Authentication Barrier
- `createGarage` and `createItem` mutations require authenticated users
- Requests are rejected if `ctx.auth.getUserIdentity()` returns null

### Ownership Lock
- **`addItemToGarage`**: Verifies `garage.ownerId === identity.subject` before insertion
- **`updateItem`**: Verifies `item.ownerId === identity.subject` before updates

### State Management
- Items added to cart move to `pending` status (locked for 10 minutes)
- On successful Stripe webhook, item status changes to `sold`

## 📱 Mobile Features & Optimizations

1. **Haptic Feedback**: Browser WebHaptics API triggers when items are added to cart (where supported)
2. **Optimistic UI**: Items appear immediately in lists while image uploads complete in background
3. **PWA Capabilities**: Service Worker caches Garage/Item cards for offline viewing (critical for areas with spotty connectivity)
4. **Sticky Cart**: Floating action button (FAB) in bottom right shows item count and opens slide-over checkout panel

## 📁 Project Structure

```
garage-sale-manager/
├── convex/           # Convex backend functions and schema
├── app/              # TanStack Start application
├── public/           # Static assets
└── README.md         # This file
```

## 🤝 Contributing

This is a private project. Please follow the established patterns and ensure all security checks pass before submitting changes.

## 📄 License

[Add your license here]

---

Built with ❤️ using Bun, TanStack Start, and Convex
