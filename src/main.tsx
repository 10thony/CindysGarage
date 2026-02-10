import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ConvexProviderWithAuth } from 'convex/react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { convex } from './lib/convex'
import { getRouter } from './router'
import { CartProvider } from './contexts/CartContext'
import { CartFAB } from './components/CartFAB'
import './index.css'

const router = getRouter()

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. " +
    "Please set it in your .env.local file."
  )
}

// Wrapper component to use Clerk's useAuth hook with Convex
function ConvexProviderWithClerk({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  
  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => ({
        isLoading: !auth.isLoaded,
        isAuthenticated: auth.isSignedIn ?? false,
        fetchAccessToken: async () => {
          // Check for token from environment variable first
          const envToken = import.meta.env.VITE_CONVEX_AUTH_TOKEN
          if (envToken) {
            return envToken
          }
          // Fall back to getting token from Clerk
          const token = await auth.getToken({ template: "convex" })
          return token ?? null
        },
      })}
    >
      {children}
    </ConvexProviderWithAuth>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/"
      signUpUrl="/sign-up"
      signUpFallbackRedirectUrl="/"
    >
      <ConvexProviderWithClerk>
        <CartProvider>
          <RouterProvider router={router} />
          <CartFAB />
        </CartProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
)
