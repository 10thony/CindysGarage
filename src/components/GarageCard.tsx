import { Card, CardContent } from "./ui/card"
import { Progress } from "./ui/progress"
import { api } from "../../convex/_generated/api"
import { useQuery } from "convex/react"
import { Id } from "../../convex/_generated/dataModel"
import { motion } from "framer-motion"
import { Store, TrendingUp } from "lucide-react"

interface GarageCardProps {
  garageId: Id<"garages">
  name: string
  description?: string
}

export function GarageCard({ garageId, name, description }: GarageCardProps) {
  // Get items for this garage to calculate progress
  const items = useQuery(api.items.getItemsByGarage, { garageId }) || []
  
  const totalItems = items.length
  const soldItems = items.filter((item: { status: string }) => item.status === "sold").length
  const totalValue = items.reduce((sum: number, item: { initialPrice: number }) => sum + item.initialPrice, 0)
  const soldValue = items
    .filter((item: { status: string }) => item.status === "sold")
    .reduce((sum: number, item: { initialPrice: number }) => sum + item.initialPrice, 0)
  const progress = totalValue > 0 ? (soldValue / totalValue) * 100 : 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        // TODO: Navigate to /garage/$garageId when route is created
        console.log("Navigate to garage:", garageId)
      }}
    >
      <Card className="min-w-[320px] snap-start cursor-pointer card-gradient border-2 border-border/50 shadow-elegant hover:shadow-elegant-lg transition-all duration-300 overflow-hidden group">
        {/* Decorative gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        <CardContent className="p-6">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 blur-md rounded-xl"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 p-3 rounded-xl border border-primary/20">
                <Store className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl mb-1.5 line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Stats and Progress */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Items
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sold
                </p>
                <p className="text-lg font-bold text-primary">
                  {soldItems}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold text-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
