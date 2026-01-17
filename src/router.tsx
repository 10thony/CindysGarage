import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultNotFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
        <a href="/" className="text-amber-600 hover:text-amber-700 underline">
          Go back home
        </a>
      </div>
    </div>
  ),
  defaultErrorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">An error occurred</h1>
        <p className="text-gray-600">{error.message}</p>
        <a href="/" className="text-amber-600 hover:text-amber-700 underline mt-4 inline-block">
          Go back home
        </a>
      </div>
    </div>
  ),
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function getRouter() {
  return router
}
