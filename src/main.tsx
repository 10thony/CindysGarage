import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/"
      signUpUrl="/sign-up"
      signUpFallbackRedirectUrl="/"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <CartProvider>
          <RouterProvider router={router} />
          <CartFAB />
        </CartProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
)
