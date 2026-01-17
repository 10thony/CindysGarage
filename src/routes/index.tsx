import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Cindy's Garage
        </h1>
        <p className="text-lg text-gray-600">
          Your garage sale inventory management platform
        </p>
      </div>
    </div>
  )
}
