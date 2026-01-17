import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryDashboard } from '../components/DiscoveryDashboard'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <DiscoveryDashboard />
}
