import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { ItemCard } from '../../components/ItemCard'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { ItemForm } from '../../components/ItemForm'
import { ArrowLeft, Store, Edit, Plus, Search, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/garage/$garageId')({
  component: GarageDetailPage,
})

function GarageDetailPage() {
  const { garageId } = Route.useParams()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  
  // Fetch garage data
  const garage = useQuery(api.garages.getGarage, { 
    garageId: garageId as Id<"garages">
  })
  
  // Fetch items for this garage
  const allItems = useQuery(api.items.getItemsByGarage, { 
    garageId: garageId as Id<"garages">
  })
  
  // Local state for filtering
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "sold" | "pending">("all")
  const [showItemForm, setShowItemForm] = useState(false)
  
  // Filter items
  const filteredItems = useMemo(() => {
    if (!allItems) return []
    
    let filtered = allItems
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term)
      )
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    
    return filtered
  }, [allItems, searchTerm, statusFilter])
  
  // Check if current user is the owner
  const isOwner = garage && isSignedIn && user && garage.ownerId === user.id
  
  // Loading state
  if (garage === undefined || allItems === undefined) {
    return (
      <div className="min-h-screen gradient-bg p-4" data-theme="garage">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded-lg w-48"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Not found state
  if (garage === null) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4" data-theme="garage">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Garage not found</h1>
          <p className="text-muted-foreground mb-4">This garage may have been removed or is private.</p>
          <Button onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }
  
  // Calculate stats
  const totalItems = allItems.length
  const availableItems = allItems.filter(item => item.status === "available").length
  const soldItems = allItems.filter(item => item.status === "sold").length
  const pendingItems = allItems.filter(item => item.status === "pending").length
  const totalValue = allItems.reduce((sum, item) => sum + item.initialPrice, 0)
  const soldValue = allItems
    .filter(item => item.status === "sold")
    .reduce((sum, item) => sum + item.initialPrice, 0)
  const progress = totalValue > 0 ? (soldValue / totalValue) * 100 : 0
  
  return (
    <div className="min-h-screen gradient-bg" data-theme="garage">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              className="flex-shrink-0 text-foreground hover:text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold line-clamp-1 text-foreground">{garage.name}</h1>
              {garage.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {garage.description}
                </p>
              )}
            </div>
            {isOwner && (
              <Button
                onClick={() => {
                  // TODO: Implement edit garage functionality
                  console.log("Edit garage:", garageId)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        <Card className="card-gradient border-2 border-border/50 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Garage Statistics</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Items
                </p>
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Available
                </p>
                <p className="text-2xl font-bold text-accent">{availableItems}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Sold
                </p>
                <p className="text-2xl font-bold text-primary">{soldItems}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-muted-foreground">{pendingItems}</p>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Sales Progress</span>
                <span className="font-bold">{progress.toFixed(0)}%</span>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "available", "sold", "pending"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
          {isOwner && (
            <Button
              onClick={() => setShowItemForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
        
        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="card-gradient border-2 border-border/50 shadow-elegant">
            <CardContent className="p-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : isOwner
                  ? "Start by adding your first item"
                  : "This garage doesn't have any items yet"}
              </p>
              {isOwner && !searchTerm && statusFilter === "all" && (
                <Button onClick={() => setShowItemForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
            }}
          >
            {filteredItems.map((item) => (
              <ItemCard
                key={item._id}
                variant="grid"
                itemId={item._id}
                name={item.name}
                imageUrl={item.imageUrl}
                salePrice={item.salePrice}
                garageId={item.garageId}
                status={item.status}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <ItemForm
          garageId={garageId as Id<"garages">}
          onSuccess={() => {
            setShowItemForm(false)
          }}
          onCancel={() => setShowItemForm(false)}
        />
      )}
    </div>
  )
}
