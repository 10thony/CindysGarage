import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { api } from "../../convex/_generated/api"
import { useQuery } from "convex/react"
import { Id } from "../../convex/_generated/dataModel"
import { motion } from "framer-motion"
import { Store, Tag } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

interface ItemCardProps {
  itemId: Id<"items">
  name: string
  imageUrl: string
  salePrice: number
  garageId: Id<"garages">
  status: "available" | "sold" | "pending"
}

export function ItemCard({
  itemId,
  name,
  imageUrl,
  salePrice,
  garageId,
  status,
}: ItemCardProps) {
  const navigate = useNavigate()
  // Get garage name for display
  const garage = useQuery(api.garages.getGarage, { garageId })

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        navigate({ to: `/item/${itemId}` })
      }}
    >
      <Card className="min-w-[240px] snap-start cursor-pointer card-gradient border-2 border-border/50 shadow-elegant hover:shadow-elegant-xl transition-all duration-300 overflow-hidden group">
        <div className="relative overflow-hidden">
          {/* Image with elegant overlay on hover */}
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <motion.img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Price Badge - Elegant design */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute top-3 right-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg"></div>
                <Badge className="relative bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm px-3 py-1.5 shadow-elegant border-0">
                  <Tag className="h-3 w-3 mr-1.5" />
                  ${salePrice.toFixed(2)}
                </Badge>
              </div>
            </motion.div>

            {/* Status Overlays */}
            {status === "sold" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"
              >
                <Badge variant="destructive" className="text-base font-bold px-5 py-2.5 shadow-elegant-lg">
                  SOLD
                </Badge>
              </motion.div>
            )}
            {status === "pending" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center"
              >
                <Badge className="bg-primary text-primary-foreground font-bold text-base px-5 py-2.5 shadow-elegant-lg border-0">
                  PENDING
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-4 space-y-2">
          <h4 className="font-bold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {name}
          </h4>
          {garage && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ to: `/garage/${garageId}` })
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors group/garage"
            >
              <Store className="h-3 w-3 group-hover/garage:scale-110 transition-transform" />
              <span className="line-clamp-1">{garage.name}</span>
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
