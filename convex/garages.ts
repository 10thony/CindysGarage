import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to fetch all public garages, or user's garages if authenticated
 */
export const listGarages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (identity) {
      // If authenticated, return both public garages and user's own garages
      const publicGarages = await ctx.db
        .query("garages")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
      
      const userGarages = await ctx.db
        .query("garages")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
        .collect();
      
      // Combine and deduplicate
      const garageMap = new Map();
      [...publicGarages, ...userGarages].forEach((garage) => {
        garageMap.set(garage._id, garage);
      });
      
      return Array.from(garageMap.values());
    } else {
      // If not authenticated, return only public garages
      return await ctx.db
        .query("garages")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
    }
  },
});

/**
 * Query to fetch a single garage by ID
 */
export const getGarage = query({
  args: { garageId: v.id("garages") },
  handler: async (ctx, args) => {
    const garage = await ctx.db.get(args.garageId);
    
    if (!garage) {
      return null;
    }
    
    const identity = await ctx.auth.getUserIdentity();
    
    // Return garage if it's public or if user is the owner
    if (garage.isPublic || (identity && garage.ownerId === identity.subject)) {
      return garage;
    }
    
    return null;
  },
});

/**
 * Query to fetch all garages for a specific owner
 */
export const getGaragesByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("garages")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

/**
 * Query to search garages by name, city, or owner
 * Note: City search would require adding a city field to the schema
 */
export const searchGarages = query({
  args: { 
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const searchTerm = args.searchTerm?.toLowerCase() || "";
    
    // Get all accessible garages (same logic as listGarages)
    let allGarages;
    if (identity) {
      // If authenticated, return both public garages and user's own garages
      const publicGarages = await ctx.db
        .query("garages")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
      
      const userGarages = await ctx.db
        .query("garages")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
        .collect();
      
      // Combine and deduplicate
      const garageMap = new Map();
      [...publicGarages, ...userGarages].forEach((garage) => {
        garageMap.set(garage._id, garage);
      });
      
      allGarages = Array.from(garageMap.values());
    } else {
      // If not authenticated, return only public garages
      allGarages = await ctx.db
        .query("garages")
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();
    }
    
    if (!searchTerm) {
      // If no search term, return all accessible garages
      return allGarages;
    }
    
    // Filter by search term (name matching)
    return allGarages.filter((garage) => {
      const nameMatch = garage.name.toLowerCase().includes(searchTerm);
      const descriptionMatch = garage.description?.toLowerCase().includes(searchTerm) || false;
      
      return nameMatch || descriptionMatch;
    });
  },
});

/**
 * Mutation to create a new garage
 * Requires authentication
 */
export const createGarage = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to create a garage");
    }
    
    // Validate input
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Garage name is required");
    }
    
    const garageId = await ctx.db.insert("garages", {
      ownerId: identity.subject,
      name: args.name.trim(),
      description: args.description?.trim(),
      isPublic: args.isPublic,
    });
    
    return garageId;
  },
});

/**
 * Mutation to update garage details
 * Requires authentication and ownership verification
 */
export const updateGarage = mutation({
  args: {
    garageId: v.id("garages"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to update a garage");
    }
    
    const garage = await ctx.db.get(args.garageId);
    
    if (!garage) {
      throw new Error("Garage not found");
    }
    
    // Verify ownership
    if (garage.ownerId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own garages");
    }
    
    // Build update object
    const updates: any = {};
    if (args.name !== undefined) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error("Garage name cannot be empty");
      }
      updates.name = args.name.trim();
    }
    if (args.description !== undefined) {
      updates.description = args.description?.trim();
    }
    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }
    
    await ctx.db.patch(args.garageId, updates);
    
    return args.garageId;
  },
});

/**
 * Mutation to delete a garage
 * Requires authentication and ownership verification
 * Note: This will fail if there are items in the garage (foreign key constraint)
 */
export const deleteGarage = mutation({
  args: {
    garageId: v.id("garages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to delete a garage");
    }
    
    const garage = await ctx.db.get(args.garageId);
    
    if (!garage) {
      throw new Error("Garage not found");
    }
    
    // Verify ownership
    if (garage.ownerId !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own garages");
    }
    
    // Check if garage has items
    const items = await ctx.db
      .query("items")
      .withIndex("by_garage", (q) => q.eq("garageId", args.garageId))
      .collect();
    
    if (items.length > 0) {
      throw new Error("Cannot delete garage with existing items. Please delete or move items first.");
    }
    
    await ctx.db.delete(args.garageId);
    
    return args.garageId;
  },
});
