import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { ItemForm } from '../../components/ItemForm'
import { ArrowLeft, Store, Edit, Trash2, ShoppingCart, Tag, Calendar, Check } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useCart } from '../../contexts/CartContext'
import { useState } from 'react'

export const Route = createFileRoute('/item/$itemId')({
  component: ItemDetailPage,
})

function ItemDetailPage() {
  const { itemId } = Route.useParams()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const { addItem, isItemInCart, removeItem } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const deleteItem = useMutation(api.items.deleteItem)
  
  // Fetch item data
  const item = useQuery(api.items.getItem, { 
    itemId: itemId as Id<"items">
  })
  
  // Fetch garage data for this item
  const garage = item ? useQuery(api.garages.getGarage, { 
    garageId: item.garageId
  }) : null
  
  // Check if current user is the owner
  const isOwner = item && isSignedIn && user && item.ownerId === user.id
  const itemInCart = item ? isItemInCart(item._id) : false
  
  // Loading state
  if (item === undefined || (item && garage === undefined)) {
    return (
      <div className="min-h-screen gradient-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded-lg w-48"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded-lg"></div>
                <div className="h-6 bg-muted rounded-lg w-32"></div>
                <div className="h-24 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Not found state
  if (item === null) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Item not found</h1>
          <p className="text-gray-600 mb-4">This item may have been removed or is no longer available.</p>
          <Button onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }
  
  const canAddToCart = item.status === "available" && !isOwner && !itemInCart
  
  const handleAddToCart = async () => {
    if (!item || isAddingToCart || item.status !== "available") return
    
    try {
      setIsAddingToCart(true)
      await addItem({
        itemId: item._id,
        name: item.name,
        imageUrl: item.imageUrl,
        salePrice: item.salePrice,
        garageId: item.garageId,
      })
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      // The error from markItemAsPending will indicate why it failed
      // (e.g., item is sold or already pending)
      alert(error instanceof Error ? error.message : 'Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleRemoveFromCart = () => {
    if (!item) return
    removeItem(item._id)
  }
  
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold line-clamp-1">{item.name}</h1>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
                      try {
                        await deleteItem({ itemId: itemId as Id<"items"> })
                        navigate({ to: "/" })
                      } catch (error) {
                        console.error("Failed to delete item:", error)
                        alert(error instanceof Error ? error.message : "Failed to delete item")
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="card-gradient border-2 border-border/50 shadow-elegant overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {item.status === "sold" && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
                    <Badge variant="destructive" className="text-lg font-bold px-6 py-3 shadow-elegant-lg">
                      SOLD
                    </Badge>
                  </div>
                )}
                {item.status === "pending" && (
                  <div className="absolute inset-0 bg-amber-500/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <Badge className="bg-amber-500 text-white font-bold text-lg px-6 py-3 shadow-elegant-lg border-0">
                      PENDING
                    </Badge>
                  </div>
                )}
                <motion.img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </Card>
          </div>
          
          {/* Details Section */}
          <div className="space-y-6">
            {/* Price and Status */}
            <Card className="card-gradient border-2 border-border/50 shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Sale Price
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">
                        ${item.salePrice.toFixed(2)}
                      </span>
                      {item.initialPrice > item.salePrice && (
                        <span className="text-xl text-muted-foreground line-through">
                          ${item.initialPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === "available"
                        ? "default"
                        : item.status === "sold"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-sm font-bold px-4 py-2"
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
                
                {item.status === "sold" && item.purchasedAt && (
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Sold on {new Date(item.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Garage Link */}
            {garage && (
              <Card className="card-gradient border-2 border-border/50 shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        From Garage
                      </p>
                      <button
                        onClick={() => navigate({ to: `/garage/${garage._id}` })}
                        className="text-lg font-bold text-primary hover:underline line-clamp-1"
                      >
                        {garage.name}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Actions */}
            {canAddToCart && (
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            )}
            
            {itemInCart && (
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleRemoveFromCart}
              >
                <Check className="h-5 w-5 mr-2" />
                In Cart - Remove
              </Button>
            )}
            
            {isOwner && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement edit item functionality
                    console.log("Edit item:", itemId)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item Details
                </Button>
                {item.status === "available" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // TODO: Implement mark as sold functionality
                      console.log("Mark as sold:", itemId)
                    }}
                  >
                    Mark as Sold
                  </Button>
                )}
              </div>
            )}
            
            {/* Item Info */}
            <Card className="card-gradient border-2 border-border/50 shadow-elegant">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Item Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Item Name
                    </p>
                    <p className="text-base font-semibold">{item.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Original Price
                    </p>
                    <p className="text-base font-semibold">${item.initialPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Current Status
                    </p>
                    <Badge
                      variant={
                        item.status === "available"
                          ? "default"
                          : item.status === "sold"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-sm font-bold"
                    >
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Item Form Modal */}
      {showEditForm && item && (
        <ItemForm
          garageId={item.garageId}
          itemId={item._id}
          initialData={{
            name: item.name,
            imageUrl: item.imageUrl,
            initialPrice: item.initialPrice,
            salePrice: item.salePrice,
          }}
          onSuccess={() => {
            setShowEditForm(false)
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  )
}
