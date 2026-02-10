import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/** Dummy garages to insert (ownerId set at runtime). */
const DUMMY_GARAGES = [
  {
    name: "Cindy's Spring 2026 Sale",
    description: "Tools, furniture, outdoor gear, and household items. Everything must go!",
    isPublic: true,
  },
  {
    name: "Downtown Garage Sale",
    description: "Moving sale - books, small appliances, and collectibles.",
    isPublic: true,
  },
  {
    name: "The Shed",
    description: "Mostly tools and garden stuff.",
    isPublic: true,
  },
];

/** Dummy items per garage index; imageUrl and ownerId set at runtime. */
const DUMMY_ITEMS_BY_GARAGE: Array<{ name: string; initialPrice: number; salePrice: number }[]> = [
  [
    { name: "Vintage Wrench Set", initialPrice: 45, salePrice: 35 },
    { name: "Wooden Bookshelf", initialPrice: 120, salePrice: 80 },
    { name: "Desk Lamp", initialPrice: 25, salePrice: 15 },
    { name: "Coffee Table", initialPrice: 80, salePrice: 55 },
    { name: "Patio Chair Set (4)", initialPrice: 200, salePrice: 140 },
  ],
  [
    { name: "Blender", initialPrice: 30, salePrice: 20 },
    { name: "Stack of Novels", initialPrice: 15, salePrice: 8 },
    { name: "Small Microwave", initialPrice: 50, salePrice: 35 },
    { name: "Picture Frames (assorted)", initialPrice: 25, salePrice: 12 },
  ],
  [
    { name: "Lawn Mower", initialPrice: 150, salePrice: 100 },
    { name: "Hand Trowel Set", initialPrice: 20, salePrice: 12 },
    { name: "Garden Hose", initialPrice: 35, salePrice: 22 },
  ],
];

const PLACEHOLDER_IMAGE =
  "https://utfs.io/f/placeholder-item.png";

/**
 * Seeds the database with dummy garages and items.
 * Requires CONVEX_SEED_SECRET to be set in Convex env and passed as args.secret.
 * Run from project root: bunx convex run seed:runSeed '{"secret":"your-secret"}'
 */
export const runSeed = mutation({
  args: {
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_SEED_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Invalid or missing CONVEX_SEED_SECRET. Set it in Convex Dashboard → Settings → Environment Variables.");
    }

    const ownerId = "seed-owner-dummy";
    const garageIds: Id<"garages">[] = [];

    for (const g of DUMMY_GARAGES) {
      const id = await ctx.db.insert("garages", {
        ownerId,
        name: g.name,
        description: g.description,
        isPublic: g.isPublic,
      });
      garageIds.push(id);
    }

    for (let i = 0; i < DUMMY_ITEMS_BY_GARAGE.length; i++) {
      const garageId = garageIds[i];
      const items = DUMMY_ITEMS_BY_GARAGE[i];
      for (const it of items) {
        await ctx.db.insert("items", {
          garageId,
          ownerId,
          name: it.name,
          imageUrl: PLACEHOLDER_IMAGE,
          initialPrice: it.initialPrice,
          salePrice: it.salePrice,
          status: "available",
        });
      }
    }

    return { garages: garageIds.length, items: DUMMY_ITEMS_BY_GARAGE.flat().length };
  },
});
