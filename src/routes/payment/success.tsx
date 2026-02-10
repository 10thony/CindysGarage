import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { CheckCircle, ShoppingBag, Home, Package } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useCart } from '../../contexts/CartContext'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/payment/success')({
  component: PaymentSuccessPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      session_id: (search.session_id as string) || undefined,
    }
  },
})

function PaymentSuccessPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { clearCart } = useCart()
  const { session_id: sessionId } = Route.useSearch()

  // Clear cart on successful payment
  useEffect(() => {
    if (sessionId) {
      clearCart()
    }
  }, [sessionId, clearCart])

  // Fetch recent orders for the user (call useQuery unconditionally to satisfy Rules of Hooks)
  const orders = useQuery(
    api.orders.getOrdersByCustomer,
    user ? { customerId: user.id } : "skip"
  )

  // Get the most recent order (assuming it's the one just completed)
  const recentOrder = orders && orders.length > 0 
    ? orders.sort((a, b) => {
        // Sort by status - completed orders first, then by creation time
        if (a.status === 'completed' && b.status !== 'completed') return -1
        if (a.status !== 'completed' && b.status === 'completed') return 1
        return 0
      })[0]
    : null

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </motion.div>

        {recentOrder && (
          <Card className="card-gradient border-2 border-border/50 shadow-elegant mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Order ID: {recentOrder._id}
                  </p>
                </div>
                <Badge variant="default" className="text-sm font-bold">
                  {recentOrder.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-semibold">{recentOrder.itemIds.length}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">
                    ${recentOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => navigate({ to: '/' })}
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1"
            onClick={() => {
              // TODO: Navigate to order history page when implemented
              navigate({ to: '/' })
            }}
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            View Orders
          </Button>
        </div>
      </div>
    </div>
  )
}
