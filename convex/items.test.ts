import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { testGarages, testItems, testItemUpdates } from "./testData";

describe("items", () => {
  describe("create item", () => {
    it("creates an item in own garage when authenticated", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      const itemId = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      expect(itemId).toBeDefined();
      const item = await asUser.query(api.items.getItem, { itemId });
      expect(item).toMatchObject({
        name: testItems.tool.name,
        initialPrice: testItems.tool.initialPrice,
        salePrice: testItems.tool.salePrice,
        status: "available",
      });
      expect(item?.garageId).toBe(garageId);
    });

    it("throws when adding item to another user's garage", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      const asOther = t.withIdentity({ name: "Other" });
      const garageId = await asCindy.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await asOther.mutation(api.items.createItem, {
            garageId,
            ...testItems.tool,
          })
      ).rejects.toThrow("Unauthorized");
    });

    it("throws when unauthenticated", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await t.mutation(api.items.createItem, {
            garageId,
            ...testItems.tool,
          })
      ).rejects.toThrow("Authentication required");
    });

    it("throws when name is empty", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await asUser.mutation(api.items.createItem, {
            garageId,
            ...testItems.tool,
            name: "  ",
          })
      ).rejects.toThrow("Item name is required");
    });

    it("throws when prices are zero or negative", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await asUser.mutation(api.items.createItem, {
            garageId,
            ...testItems.tool,
            initialPrice: 0,
            salePrice: 10,
          })
      ).rejects.toThrow("Prices must be greater than zero");
    });
  });

  describe("list and get items", () => {
    it("getItemsByGarage returns items for garage", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      await asUser.mutation(api.items.createItem, { garageId, ...testItems.tool });
      await asUser.mutation(api.items.createItem, { garageId, ...testItems.furniture });

      const items = await asUser.query(api.items.getItemsByGarage, { garageId });
      expect(items).toHaveLength(2);
      const names = items.map((i) => i.name);
      expect(names).toContain(testItems.tool.name);
      expect(names).toContain(testItems.furniture.name);
    });

    it("listItems with status filter returns only matching items", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      await asUser.mutation(api.items.createItem, { garageId, ...testItems.tool });
      const itemId2 = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.furniture,
      });
      await asUser.mutation(api.items.updateItem, {
        itemId: itemId2,
        status: "sold",
      });

      const available = await asUser.query(api.items.listItems, {
        status: "available",
        garageId,
      });
      expect(available).toHaveLength(1);
      expect(available[0].name).toBe(testItems.tool.name);
    });
  });

  describe("update item", () => {
    it("updates name and prices", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await asUser.mutation(api.items.updateItem, {
        itemId,
        name: testItemUpdates.rename.name,
        initialPrice: testItemUpdates.priceChange.initialPrice,
        salePrice: testItemUpdates.priceChange.salePrice,
      });

      const item = await asUser.query(api.items.getItem, { itemId });
      expect(item?.name).toBe(testItemUpdates.rename.name);
      expect(item?.initialPrice).toBe(50);
      expect(item?.salePrice).toBe(40);
    });

    it("can mark item as sold", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await asUser.mutation(api.items.updateItem, {
        itemId,
        status: "sold",
      });

      const item = await asUser.query(api.items.getItem, { itemId });
      expect(item?.status).toBe("sold");
      expect(item?.purchasedAt).toBeDefined();
    });

    it("throws when updating another user's item", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      const asOther = t.withIdentity({ name: "Other" });
      const garageId = await asCindy.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asCindy.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await expect(
        async () =>
          await asOther.mutation(api.items.updateItem, {
            itemId,
            name: "Hacked",
          })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("delete item", () => {
    it("deletes own item", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await asUser.mutation(api.items.deleteItem, { itemId });

      const item = await asUser.query(api.items.getItem, { itemId });
      expect(item).toBeNull();
    });

    it("allows deleting garage after all items are deleted", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await asUser.mutation(api.items.deleteItem, { itemId });
      await asUser.mutation(api.garages.deleteGarage, { garageId });

      const garage = await asUser.query(api.garages.getGarage, { garageId });
      expect(garage).toBeNull();
    });

    it("throws when deleting another user's item", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      const asOther = t.withIdentity({ name: "Other" });
      const garageId = await asCindy.mutation(api.garages.createGarage, testGarages.main);
      const itemId = await asCindy.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await expect(
        async () => await asOther.mutation(api.items.deleteItem, { itemId })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
