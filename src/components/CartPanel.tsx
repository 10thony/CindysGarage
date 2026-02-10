import { useCart } from '../contexts/CartContext'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { X, ShoppingCart, Trash2, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { items, removeItem, getTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
  const [isProcessing, setIsProcessing] = useState(false)
  const total = getTotal()

  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      // Redirect to sign-in if not authenticated
      navigate({ to: '/sign-in' })
      onClose()
      return
    }

    if (items.length === 0) {
      return
    }

    try {
      setIsProcessing(true)
      
      // Get item IDs from cart
      const itemIds = items.map(item => item.itemId)
      
      // Create checkout session
      const result = await createCheckoutSession({
        itemIds: itemIds,
        customerId: user.id,
      })

      // Redirect to Stripe checkout
      if (result.url) {
        // Clear cart before redirecting (items will be marked as sold via webhook)
        clearCart()
        window.location.href = result.url
      } else {
        throw new Error('No checkout URL returned from Stripe')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-elegant-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Shopping Cart</h2>
                {items.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-6">
                    Start adding items to your cart to continue shopping
                  </p>
                  <Button onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((cartItem) => (
                    <CartItemCard
                      key={cartItem.itemId}
                      cartItem={cartItem}
                      onRemove={() => removeItem(cartItem.itemId)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing || !isSignedIn}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Processing...
                    </>
                  ) : !isSignedIn ? (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Sign In to Checkout
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    clearCart()
                    onClose()
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface CartItemCardProps {
  cartItem: {
    itemId: Id<"items">
    name: string
    imageUrl: string
    salePrice: number
    garageId: Id<"garages">
  }
  onRemove: () => void
}

function CartItemCard({ cartItem, onRemove }: CartItemCardProps) {
  const navigate = useNavigate()
  const garage = useQuery(api.garages.getGarage, { garageId: cartItem.garageId })
  const item = useQuery(api.items.getItem, { itemId: cartItem.itemId })

  // Show loading state
  if (item === undefined) {
    return (
      <Card className="card-gradient border-2 border-border/50 shadow-elegant">
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If item is no longer available, show removed state
  if (item === null || item.status !== 'pending') {
    return (
      <Card className="card-gradient border-2 border-border/50 shadow-elegant opacity-60">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground line-through">
                {cartItem.name}
              </p>
              <p className="text-xs text-destructive mt-1">No longer available</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-gradient border-2 border-border/50 shadow-elegant">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <button
            onClick={() => {
              navigate({ to: `/item/${cartItem.itemId}` })
            }}
            className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0"
          >
            <img
              src={cartItem.imageUrl}
              alt={cartItem.name}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => {
                navigate({ to: `/item/${cartItem.itemId}` })
              }}
              className="text-left"
            >
              <h4 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                {cartItem.name}
              </h4>
            </button>
            {garage && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {garage.name}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-primary">
                ${cartItem.salePrice.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
