import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { XCircle, ShoppingCart, Home } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/payment/cancel')({
  component: PaymentCancelPage,
})

function PaymentCancelPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
            <XCircle className="h-12 w-12 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-lg text-muted-foreground">
            Your payment was cancelled. No charges were made.
          </p>
        </motion.div>

        <Card className="card-gradient border-2 border-border/50 shadow-elegant mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Your items are still in your cart. You can complete your purchase anytime.
            </p>
            <p className="text-sm text-muted-foreground">
              If you experienced any issues, please contact support.
            </p>
          </CardContent>
        </Card>

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
              // Scroll to cart FAB or open cart panel
              // For now, just go home - user can click cart FAB
              navigate({ to: '/' })
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
