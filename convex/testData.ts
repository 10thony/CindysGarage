/**
 * Test data fixtures for garages and items.
 * Used by convex-test workflow tests.
 */

export const testGarages = {
  main: {
    name: "Cindy's Main Garage",
    description: "Spring 2026 garage sale - tools, furniture, and more.",
    isPublic: true,
  },
  private: {
    name: "Private Collection",
    description: "By invitation only.",
    isPublic: false,
  },
  minimal: {
    name: "Quick Sale",
    description: undefined,
    isPublic: true,
  },
} as const;

export const testGarageUpdates = {
  rename: {
    name: "Cindy's Updated Garage Name",
    description: undefined,
    isPublic: undefined,
  },
  makePrivate: {
    name: undefined,
    description: undefined,
    isPublic: false,
  },
  changeDescription: {
    name: undefined,
    description: "Updated description for testing.",
    isPublic: undefined,
  },
} as const;

/** Placeholder image URL acceptable for item creation (required field). */
export const testItemImageUrl = "https://utfs.io/f/test-placeholder-item.jpg";

export const testItems = {
  tool: {
    name: "Vintage Wrench Set",
    imageUrl: testItemImageUrl,
    initialPrice: 45,
    salePrice: 35,
  },
  furniture: {
    name: "Wooden Bookshelf",
    imageUrl: testItemImageUrl,
    initialPrice: 120,
    salePrice: 80,
  },
  small: {
    name: "Desk Lamp",
    imageUrl: testItemImageUrl,
    initialPrice: 25,
    salePrice: 15,
  },
} as const;

export const testItemUpdates = {
  rename: {
    name: "Updated Wrench Set Name",
    imageUrl: undefined,
    initialPrice: undefined,
    salePrice: undefined,
    status: undefined,
  },
  priceChange: {
    name: undefined,
    imageUrl: undefined,
    initialPrice: 50,
    salePrice: 40,
    status: undefined,
  },
  markSold: {
    name: undefined,
    imageUrl: undefined,
    initialPrice: undefined,
    salePrice: undefined,
    status: "sold" as const,
  },
} as const;
