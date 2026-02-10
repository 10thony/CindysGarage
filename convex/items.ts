import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to fetch all available items (with optional filters)
 */
export const listItems = query({
  args: {
    status: v.optional(v.union(v.literal("available"), v.literal("sold"), v.literal("pending"))),
    garageId: v.optional(v.id("garages")),
  },
  handler: async (ctx, args) => {
    let items;
    
    if (args.garageId) {
      // Get items for specific garage
      const garageId = args.garageId; // TypeScript narrowing
      items = await ctx.db
        .query("items")
        .withIndex("by_garage", (q) => q.eq("garageId", garageId))
        .collect();
    } else {
      // Get all items
      items = await ctx.db.query("items").collect();
    }
    
    // Filter by status if provided
    if (args.status) {
      items = items.filter((item) => item.status === args.status);
    }
    
    return items;
  },
});

/**
 * Query to fetch a single item by ID
 */
export const getItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});

/**
 * Query to fetch all items for a specific garage
 */
export const getItemsByGarage = query({
  args: { garageId: v.id("garages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_garage", (q) => q.eq("garageId", args.garageId))
      .collect();
  },
});

/**
 * Query to search items by name, category, or price range
 * Note: Category search would require adding a category field to the schema
 */
export const searchItems = query({
  args: {
    searchTerm: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    status: v.optional(v.union(v.literal("available"), v.literal("sold"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("items").collect();
    
    // Filter by search term (name matching)
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by price range
    if (args.minPrice !== undefined) {
      items = items.filter((item) => item.salePrice >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      items = items.filter((item) => item.salePrice <= args.maxPrice!);
    }
    
    // Filter by status
    if (args.status) {
      items = items.filter((item) => item.status === args.status);
    }
    
    return items;
  },
});

/**
 * Query to filter items by status
 */
export const getItemsByStatus = query({
  args: {
    status: v.union(v.literal("available"), v.literal("sold"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

/**
 * Mutation to create/add an item to a garage
 * Requires authentication and garage ownership verification
 */
export const createItem = mutation({
  args: {
    garageId: v.id("garages"),
    name: v.string(),
    imageUrl: v.string(),
    initialPrice: v.number(),
    salePrice: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to create an item");
    }
    
    // Verify garage exists and user owns it
    const garage = await ctx.db.get(args.garageId);
    
    if (!garage) {
      throw new Error("Garage not found");
    }
    
    if (garage.ownerId !== identity.subject) {
      throw new Error("Unauthorized: You can only add items to your own garages");
    }
    
    // Validate input
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Item name is required");
    }
    
    if (args.salePrice <= 0 || args.initialPrice <= 0) {
      throw new Error("Prices must be greater than zero");
    }
    
    if (!args.imageUrl || args.imageUrl.trim().length === 0) {
      throw new Error("Image URL is required");
    }
    
    const itemId = await ctx.db.insert("items", {
      garageId: args.garageId,
      ownerId: identity.subject,
      name: args.name.trim(),
      imageUrl: args.imageUrl.trim(),
      initialPrice: args.initialPrice,
      salePrice: args.salePrice,
      status: "available",
    });
    
    return itemId;
  },
});

/**
 * Mutation to update item details
 * Requires authentication and item ownership verification
 */
export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    initialPrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    status: v.optional(v.union(v.literal("available"), v.literal("sold"), v.literal("pending"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to update an item");
    }
    
    const item = await ctx.db.get(args.itemId);
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    // Verify ownership
    if (item.ownerId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own items");
    }
    
    // Build update object
    const updates: any = {};
    if (args.name !== undefined) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error("Item name cannot be empty");
      }
      updates.name = args.name.trim();
    }
    if (args.imageUrl !== undefined) {
      if (!args.imageUrl || args.imageUrl.trim().length === 0) {
        throw new Error("Image URL cannot be empty");
      }
      updates.imageUrl = args.imageUrl.trim();
    }
    if (args.initialPrice !== undefined) {
      if (args.initialPrice <= 0) {
        throw new Error("Initial price must be greater than zero");
      }
      updates.initialPrice = args.initialPrice;
    }
    if (args.salePrice !== undefined) {
      if (args.salePrice <= 0) {
        throw new Error("Sale price must be greater than zero");
      }
      updates.salePrice = args.salePrice;
    }
    if (args.status !== undefined) {
      updates.status = args.status;
      
      // If marking as sold, set purchasedAt timestamp
      if (args.status === "sold" && !item.purchasedAt) {
        updates.purchasedAt = Date.now();
      }
    }
    
    await ctx.db.patch(args.itemId, updates);
    
    return args.itemId;
  },
});

/**
 * Mutation to delete an item
 * Requires authentication and ownership verification
 */
export const deleteItem = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to delete an item");
    }
    
    const item = await ctx.db.get(args.itemId);
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    // Verify ownership
    if (item.ownerId !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own items");
    }
    
    await ctx.db.delete(args.itemId);
    
    return args.itemId;
  },
});

/**
 * Mutation to mark an item as pending (when added to cart)
 * Implements 10-minute lock mechanism
 */
export const markItemAsPending = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    if (item.status !== "available") {
      throw new Error(`Item is not available. Current status: ${item.status}`);
    }
    
    // Mark as pending
    await ctx.db.patch(args.itemId, {
      status: "pending",
    });
    
    return args.itemId;
  },
});

/**
 * Mutation to mark an item as sold
 * Typically called via Stripe webhook
 */
export const markItemAsSold = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    await ctx.db.patch(args.itemId, {
      status: "sold",
      purchasedAt: Date.now(),
    });
    
    return args.itemId;
  },
});

/**
 * Mutation to release an item from pending status back to available
 * Called when payment fails or cart is abandoned
 */
export const releasePendingItem = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    
    if (!item) {
      throw new Error("Item not found");
    }
    
    if (item.status !== "pending") {
      throw new Error(`Item is not pending. Current status: ${item.status}`);
    }
    
    await ctx.db.patch(args.itemId, {
      status: "available",
    });
    
    return args.itemId;
  },
});
