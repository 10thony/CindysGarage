import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { testGarages, testGarageUpdates, testItems } from "./testData";

describe("garages", () => {
  describe("create garage", () => {
    it("creates a garage when authenticated", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });

      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      expect(garageId).toBeDefined();
      const garage = await asUser.query(api.garages.getGarage, { garageId });
      expect(garage).toMatchObject({
        name: testGarages.main.name,
        description: testGarages.main.description,
        isPublic: testGarages.main.isPublic,
      });
    });

    it("creates a private garage", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Owner" });

      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.private);
      const garage = await asUser.query(api.garages.getGarage, { garageId });

      expect(garage?.isPublic).toBe(false);
      expect(garage?.name).toBe(testGarages.private.name);
    });

    it("throws when unauthenticated", async () => {
      const t = convexTest(schema);

      await expect(
        async () => await t.mutation(api.garages.createGarage, testGarages.main)
      ).rejects.toThrow("Authentication required");
    });

    it("throws when name is empty", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "User" });

      await expect(
        async () =>
          await asUser.mutation(api.garages.createGarage, {
            ...testGarages.main,
            name: "   ",
          })
      ).rejects.toThrow("Garage name is required");
    });
  });

  describe("list garages", () => {
    it("returns only public garages when unauthenticated", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      await asCindy.mutation(api.garages.createGarage, testGarages.main);
      await asCindy.mutation(api.garages.createGarage, testGarages.private);

      const listUnauth = await t.query(api.garages.listGarages);
      const publicNames = listUnauth.map((g) => g.name);
      expect(publicNames).toContain(testGarages.main.name);
      expect(publicNames).not.toContain(testGarages.private.name);
    });

    it("returns own and public garages when authenticated", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      await asCindy.mutation(api.garages.createGarage, testGarages.main);
      await asCindy.mutation(api.garages.createGarage, testGarages.private);

      const listAuth = await asCindy.query(api.garages.listGarages);
      const names = listAuth.map((g) => g.name);
      expect(names).toContain(testGarages.main.name);
      expect(names).toContain(testGarages.private.name);
    });
  });

  describe("update garage", () => {
    it("updates name and description", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await asUser.mutation(api.garages.updateGarage, {
        garageId,
        name: testGarageUpdates.rename.name,
        description: testGarageUpdates.changeDescription.description,
      });

      const garage = await asUser.query(api.garages.getGarage, { garageId });
      expect(garage?.name).toBe(testGarageUpdates.rename.name);
      expect(garage?.description).toBe(testGarageUpdates.changeDescription.description);
    });

    it("updates isPublic", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await asUser.mutation(api.garages.updateGarage, {
        garageId,
        isPublic: false,
      });

      const garage = await asUser.query(api.garages.getGarage, { garageId });
      expect(garage?.isPublic).toBe(false);
    });

    it("throws when updating another user's garage", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      const asOther = t.withIdentity({ name: "Other" });
      const garageId = await asCindy.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await asOther.mutation(api.garages.updateGarage, {
            garageId,
            name: "Hacked",
          })
      ).rejects.toThrow("Unauthorized");
    });

    it("throws when name is set to empty", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);

      await expect(
        async () =>
          await asUser.mutation(api.garages.updateGarage, {
            garageId,
            name: "  ",
          })
      ).rejects.toThrow("Garage name cannot be empty");
    });
  });

  describe("delete garage", () => {
    it("deletes a garage when it has no items", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.minimal);

      await asUser.mutation(api.garages.deleteGarage, { garageId });

      const garage = await asUser.query(api.garages.getGarage, { garageId });
      expect(garage).toBeNull();
    });

    it("throws when garage has items", async () => {
      const t = convexTest(schema);
      const asUser = t.withIdentity({ name: "Cindy" });
      const garageId = await asUser.mutation(api.garages.createGarage, testGarages.main);
      await asUser.mutation(api.items.createItem, {
        garageId,
        ...testItems.tool,
      });

      await expect(
        async () => await asUser.mutation(api.garages.deleteGarage, { garageId })
      ).rejects.toThrow("Cannot delete garage with existing items");
    });

    it("throws when deleting another user's garage", async () => {
      const t = convexTest(schema);
      const asCindy = t.withIdentity({ name: "Cindy" });
      const asOther = t.withIdentity({ name: "Other" });
      const garageId = await asCindy.mutation(api.garages.createGarage, testGarages.minimal);

      await expect(
        async () => await asOther.mutation(api.garages.deleteGarage, { garageId })
      ).rejects.toThrow("Unauthorized");
    });
  });
});
