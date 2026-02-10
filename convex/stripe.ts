import { action, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Stripe from "stripe";

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
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

/**
 * HTTP Action to handle Stripe webhooks
 * This endpoint should be configured in Stripe dashboard
 */
export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }
  
  const body = await request.text();
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
  
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Find order by session ID (we'll need to query orders)
      // For now, we'll use the metadata
      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        console.error("No orderId in session metadata");
        return new Response("Missing orderId in metadata", { status: 400 });
      }
      
      // Get order from database
      const order = await ctx.runQuery(api.orders.getOrder, {
        orderId: orderId as any, // Type assertion needed - orderId from metadata is string
      });
      
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return new Response(`Order ${orderId} not found`, { status: 404 });
      }
      
      // Update order status to completed
      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId: orderId as any,
        status: "completed",
      });
      
      // Mark all items as sold
      for (const itemId of order.itemIds) {
        try {
          await ctx.runMutation(api.items.markItemAsSold, {
            itemId: itemId,
          });
        } catch (error) {
          console.error(`Failed to mark item ${itemId} as sold:`, error);
          // Continue with other items even if one fails
        }
      }
      
      break;
    }
    
    case "checkout.session.async_payment_failed": {
      // Handle failed payment - release items back to available
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        const order = await ctx.runQuery(api.orders.getOrder, {
          orderId: orderId as any,
        });
        
        if (order) {
          // Release all items back to available
          for (const itemId of order.itemIds) {
            try {
              await ctx.runMutation(api.items.releasePendingItem, {
                itemId: itemId,
              });
            } catch (error) {
              console.error(`Failed to release item ${itemId}:`, error);
            }
          }
          
          // Update order status
          await ctx.runMutation(api.orders.updateOrderStatus, {
            orderId: orderId as any,
            status: "failed",
          });
        }
      }
      break;
    }
    
    case "checkout.session.async_payment_succeeded": {
      // Handle async payment success (for delayed payment methods)
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        const order = await ctx.runQuery(api.orders.getOrder, {
          orderId: orderId as any,
        });
        
        if (order) {
          // Mark items as sold
          for (const itemId of order.itemIds) {
            try {
              await ctx.runMutation(api.items.markItemAsSold, {
                itemId: itemId,
              });
            } catch (error) {
              console.error(`Failed to mark item ${itemId} as sold:`, error);
            }
          }
          
          // Update order status
          await ctx.runMutation(api.orders.updateOrderStatus, {
            orderId: orderId as any,
            status: "completed",
          });
        }
      }
      break;
    }
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
