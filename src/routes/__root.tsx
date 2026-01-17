import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
})

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🏠</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-6">Looks like this garage sale item has already been sold!</p>
        <a 
          href="/" 
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Back to the Garage
        </a>
      </div>
    </div>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4">⚠️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h1>
        <p className="text-gray-600 mb-4">We encountered an unexpected error.</p>
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6 text-left">
          <p className="text-red-700 text-sm font-mono break-all">{error.message}</p>
        </div>
        <a 
          href="/" 
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Back to the Garage
        </a>
      </div>
    </div>
  )
}

function RootComponent() {
  return <Outlet />
}
