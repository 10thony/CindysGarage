import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ShoppingCart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CartPanel } from './CartPanel'

export function CartFAB() {
  const { getItemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const itemCount = getItemCount()

  if (itemCount === 0 && !isOpen) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-elegant-lg relative"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Badge
                variant="destructive"
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </motion.div>

      <CartPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
