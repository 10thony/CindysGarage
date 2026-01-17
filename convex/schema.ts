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
    purchasedAt: v.optional(v.number()), // Timestamp
  }).index("by_garage", ["garageId"]),

  orders: defineTable({
    customerId: v.string(),
    itemIds: v.array(v.id("items")),
    stripeSessionId: v.string(),
    totalAmount: v.number(),
    status: v.string(),
  }),
});
