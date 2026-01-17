import { ConvexReactClient } from "convex/react"

// Get the Convex URL from environment variable
// In development, this is typically provided by Convex
// For production, it should be set in environment variables
const convexUrl = import.meta.env.VITE_CONVEX_URL || ""

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL environment variable. " +
    "Run 'npx convex dev' to set it up."
  )
}

export const convex = new ConvexReactClient(convexUrl)
