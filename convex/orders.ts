import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to fetch all orders for a customer
 */
export const getOrdersByCustomer = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("customerId"), args.customerId))
      .collect();
  },
});

/**
 * Query to fetch a single order by ID
 */
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

/**
 * Query to fetch orders containing a specific item
 */
export const getOrdersByItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query("orders").collect();
    
    return allOrders.filter((order) => order.itemIds.includes(args.itemId));
  },
});

/**
 * Mutation to create an order record
 * Links items to order and sets initial status
 */
export const createOrder = mutation({
  args: {
    customerId: v.string(),
    itemIds: v.array(v.id("items")),
    stripeSessionId: v.string(),
    totalAmount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (args.itemIds.length === 0) {
      throw new Error("Order must contain at least one item");
    }
    
    if (args.totalAmount <= 0) {
      throw new Error("Total amount must be greater than zero");
    }
    
    if (!args.stripeSessionId || args.stripeSessionId.trim().length === 0) {
      throw new Error("Stripe session ID is required");
    }
    
    // Verify all items exist
    for (const itemId of args.itemIds) {
      const item = await ctx.db.get(itemId);
      if (!item) {
        throw new Error(`Item ${itemId} not found`);
      }
    }
    
    const orderId = await ctx.db.insert("orders", {
      customerId: args.customerId,
      itemIds: args.itemIds,
      stripeSessionId: args.stripeSessionId.trim(),
      totalAmount: args.totalAmount,
      status: args.status,
    });
    
    return orderId;
  },
});

/**
 * Mutation to update order status
 * Typically called via webhook
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    await ctx.db.patch(args.orderId, {
      status: args.status,
    });
    
    return args.orderId;
  },
});
