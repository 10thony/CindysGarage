import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Stripe from "stripe";

// Initialize Stripe with secret key from environment (set in Convex dashboard)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

/**
 * Action to create a Stripe checkout session
 * Requires authentication
 */
export const createCheckoutSession = action({
  args: {
    itemIds: v.array(v.id("items")),
    customerId: v.string(),
  },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null; orderId: string }> => {
    // Get authenticated user identity
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Authentication required to create checkout session");
    }
    
    // Verify customer ID matches authenticated user
    if (identity.subject !== args.customerId) {
      throw new Error("Unauthorized: Customer ID does not match authenticated user");
    }
    
    if (args.itemIds.length === 0) {
      throw new Error("Cart is empty");
    }
    
    // Fetch items from database
    const items = await Promise.all(
      args.itemIds.map(async (itemId): Promise<{ _id: string; name: string; imageUrl: string; salePrice: number; status: string }> => {
        const item = await ctx.runQuery(api.items.getItem, { itemId });
        if (!item) {
          throw new Error(`Item ${itemId} not found`);
        }
        // Verify item is still pending (in cart)
        if (item.status !== "pending") {
          throw new Error(`Item ${item.name} is no longer available for purchase`);
        }
        return item;
      })
    );
    
    // Calculate total
    const totalAmount = items.reduce((sum: number, item: { salePrice: number }) => sum + item.salePrice, 0);
    
    // Create order in database first (with pending status)
    const orderId = await ctx.runMutation(api.orders.createOrder, {
      customerId: args.customerId,
      itemIds: args.itemIds,
      totalAmount: totalAmount,
      status: "pending",
    });
    
    // Get base URL from environment or use default
    const baseUrl = process.env.SITE_URL || "http://localhost:5173";
    
    // Create Stripe checkout session
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: { name: string; imageUrl: string; salePrice: number }) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: [item.imageUrl],
          },
          unit_amount: Math.round(item.salePrice * 100), // Convert to cents
        },
        quantity: 1,
      })),
      mode: "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      metadata: {
        orderId: orderId,
        customerId: args.customerId,
      },
      customer_email: identity.email, // Use Clerk email if available
    });
    
    // Update order with Stripe session ID
    await ctx.runMutation(api.orders.updateOrderStripeSessionId, {
      orderId: orderId,
      stripeSessionId: session.id,
    });
    
    return {
      sessionId: session.id,
      url: session.url,
      orderId: orderId,
    };
  },
});
