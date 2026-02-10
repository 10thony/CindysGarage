import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { motion } from "framer-motion"
import { useUser, useAuth } from "@clerk/clerk-react"
import { useNavigate } from "@tanstack/react-router"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { GarageCard } from "./GarageCard"
import { ItemCard } from "./ItemCard"
import { GarageForm } from "./GarageForm"
import { api } from "../../convex/_generated/api"
import { Search, X, Sparkles, LogIn, LogOut, Plus } from "lucide-react"

export function DiscoveryDashboard() {
  const { isSignedIn } = useUser()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [garageSearchTerm, setGarageSearchTerm] = useState("")
  const [itemSearchTerm, setItemSearchTerm] = useState("")
  const [itemMinPrice, setItemMinPrice] = useState<number | undefined>()
  const [itemMaxPrice, setItemMaxPrice] = useState<number | undefined>()
  const [showGarageForm, setShowGarageForm] = useState(false)

  const handleAuthClick = async () => {
    if (isSignedIn) {
      await signOut()
    } else {
      navigate({ to: "/sign-in" })
    }
  }

  // Fetch garages with search (searchGarages handles empty searchTerm by returning all)
  const garages = useQuery(
    api.garages.searchGarages,
    { searchTerm: garageSearchTerm || undefined }
  )

  // Fetch items with search and filters
  const items = useQuery(
    api.items.searchItems,
    {
      searchTerm: itemSearchTerm || undefined,
      minPrice: itemMinPrice,
      maxPrice: itemMaxPrice,
      status: "available" as const, // Only show available items by default
    }
  )

  // Filter items to only show available ones for the shelf
  const availableItems = useMemo(
    () => (items || []).filter((item: { status: string }) => item.status === "available"),
    [items]
  )

  const clearGarageSearch = () => {
    setGarageSearchTerm("")
  }

  const clearItemSearch = () => {
    setItemSearchTerm("")
    setItemMinPrice(undefined)
    setItemMaxPrice(undefined)
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Elegant Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/50 shadow-elegant">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-primary to-accent p-3 rounded-2xl shadow-elegant-lg">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Cindy's Garage
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Discover hidden treasures
                </p>
              </div>
            </div>
            <Button
              onClick={handleAuthClick}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSignedIn ? (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Search Bar - Garage Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Search garages by name or description..."
              value={garageSearchTerm}
              onChange={(e) => setGarageSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-12 text-base border-2 bg-background/50 backdrop-blur-sm shadow-elegant focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {garageSearchTerm && (
              <button
                onClick={clearGarageSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Top Shelf - Garage Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="h-1 w-8 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            <h2 className="text-2xl font-bold text-foreground">Featured Garages</h2>
            {isSignedIn && (
              <Button
                onClick={() => setShowGarageForm(true)}
                size="sm"
                className="ml-auto flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Garage
              </Button>
            )}
          </div>
          {garages === undefined ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="min-w-[320px] h-48 bg-gradient-to-br from-muted to-muted/50 animate-pulse rounded-2xl shadow-elegant"
                />
              ))}
            </div>
          ) : garages.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {garageSearchTerm ? "No garages found" : "No garages available yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {garageSearchTerm
                  ? "Try adjusting your search terms"
                  : "Check back soon for new garage sales!"}
              </p>
            </div>
          ) : (
            <motion.div
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
            >
              {garages.map((garage: { _id: any; name: string; description?: string }, index: number) => (
                <motion.div
                  key={garage._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <GarageCard
                    garageId={garage._id}
                    name={garage.name}
                    description={garage.description}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* Bottom Search Bar - Item Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 space-y-4"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
            <Input
              type="text"
              placeholder="Search items by name..."
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              className="pl-12 pr-12 h-12 text-base border-2 bg-background/50 backdrop-blur-sm shadow-elegant focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {itemSearchTerm && (
              <button
                onClick={clearItemSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Min price"
              value={itemMinPrice || ""}
              onChange={(e) =>
                setItemMinPrice(
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="flex-1 h-11 border-2 bg-background/50 backdrop-blur-sm shadow-elegant focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={itemMaxPrice || ""}
              onChange={(e) =>
                setItemMaxPrice(
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              className="flex-1 h-11 border-2 bg-background/50 backdrop-blur-sm shadow-elegant focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              min="0"
              step="0.01"
            />
          </div>
        </motion.div>

        {/* Bottom Shelf - Item Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="h-1 w-8 bg-gradient-to-r from-primary to-accent rounded-full"></div>
            <h2 className="text-2xl font-bold text-foreground">Available Items</h2>
            {availableItems && availableItems.length > 0 && (
              <span className="ml-auto text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {availableItems.length} {availableItems.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          {items === undefined ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="min-w-[240px] h-80 bg-gradient-to-br from-muted to-muted/50 animate-pulse rounded-2xl shadow-elegant"
                />
              ))}
            </div>
          ) : availableItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {itemSearchTerm || itemMinPrice || itemMaxPrice ? "No items found" : "No items available yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {itemSearchTerm || itemMinPrice || itemMaxPrice
                  ? "Try adjusting your search or filters"
                  : "Check back soon for new treasures!"}
              </p>
            </div>
          ) : (
            <motion.div
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
            >
              {availableItems.map((item: { _id: any; name: string; imageUrl: string; salePrice: number; garageId: any; status: "available" | "sold" | "pending" }, index: number) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                >
                  <ItemCard
                    itemId={item._id}
                    name={item.name}
                    imageUrl={item.imageUrl}
                    salePrice={item.salePrice}
                    garageId={item.garageId}
                    status={item.status}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>
      </div>

      {/* Garage Form Modal */}
      {showGarageForm && (
        <GarageForm
          onSuccess={() => {
            setShowGarageForm(false)
          }}
          onCancel={() => setShowGarageForm(false)}
        />
      )}
    </div>
  )
}
