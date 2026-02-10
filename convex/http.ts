import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import type Stripe from "stripe";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

function getOrderIdFromSession(session: Stripe.Checkout.Session): Id<"orders"> | undefined {
  const raw = session.metadata?.orderId;
  return raw ? (raw as Id<"orders">) : undefined;
}

// Register Stripe webhook handler at /stripe/webhook with custom order/items logic
registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: {
    "checkout.session.completed": async (ctx, event: Stripe.Event) => {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = getOrderIdFromSession(session);
      if (!orderId) return;

      const order = await ctx.runQuery(api.orders.getOrder, { orderId });
      if (!order) return;

      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId,
        status: "completed",
      });
      for (const itemId of order.itemIds) {
        try {
          await ctx.runMutation(api.items.markItemAsSold, { itemId });
        } catch (err) {
          console.error(`Failed to mark item ${itemId} as sold:`, err);
        }
      }
    },
    "checkout.session.async_payment_failed": async (ctx, event: Stripe.Event) => {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = getOrderIdFromSession(session);
      if (!orderId) return;

      const order = await ctx.runQuery(api.orders.getOrder, { orderId });
      if (!order) return;

      for (const itemId of order.itemIds) {
        try {
          await ctx.runMutation(api.items.releasePendingItem, { itemId });
        } catch (err) {
          console.error(`Failed to release item ${itemId}:`, err);
        }
      }
      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId,
        status: "failed",
      });
    },
    "checkout.session.async_payment_succeeded": async (ctx, event: Stripe.Event) => {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = getOrderIdFromSession(session);
      if (!orderId) return;

      const order = await ctx.runQuery(api.orders.getOrder, { orderId });
      if (!order) return;

      for (const itemId of order.itemIds) {
        try {
          await ctx.runMutation(api.items.markItemAsSold, { itemId });
        } catch (err) {
          console.error(`Failed to mark item ${itemId} as sold:`, err);
        }
      }
      await ctx.runMutation(api.orders.updateOrderStatus, {
        orderId,
        status: "completed",
      });
    },
  },
});

export default http;
