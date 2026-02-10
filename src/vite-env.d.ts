/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_CONVEX_AUTH_TOKEN?: string
  // Add more env variables as needed
  [key: string]: any
}
