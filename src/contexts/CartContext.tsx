import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

export interface CartItem {
  itemId: Id<"items">
  name: string
  imageUrl: string
  salePrice: number
  garageId: Id<"garages">
  addedAt: number // timestamp
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'addedAt'>) => Promise<void>
  removeItem: (itemId: Id<"items">) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  isItemInCart: (itemId: Id<"items">) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'cindys-garage-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const markItemAsPending = useMutation(api.items.markItemAsPending)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate that items still exist and are valid
        setItems(parsed)
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  }, [items])

  // Clean up pending items that have been in cart for more than 10 minutes
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      const tenMinutes = 10 * 60 * 1000
      
      setItems((currentItems) => {
        const validItems = currentItems.filter((item) => {
          const age = now - item.addedAt
          return age < tenMinutes
        })
        
        // If items were removed, clear localStorage
        if (validItems.length !== currentItems.length) {
          try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems))
          } catch (error) {
            console.error('Failed to update localStorage:', error)
          }
        }
        
        return validItems
      })
    }, 60000) // Check every minute

    return () => clearInterval(cleanup)
  }, [])

  const addItem = async (item: Omit<CartItem, 'addedAt'>) => {
    // Check if item is already in cart
    if (items.some((i) => i.itemId === item.itemId)) {
      return
    }

    try {
      // Mark item as pending in backend
      // This will throw an error if item is not available (sold or already pending)
      await markItemAsPending({ itemId: item.itemId })
      
      // Add to cart
      const newItem: CartItem = {
        ...item,
        addedAt: Date.now(),
      }
      setItems((prev) => [...prev, newItem])
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      // Re-throw error so UI can handle it
      throw error
    }
  }

  const removeItem = (itemId: Id<"items">) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId))
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.salePrice, 0)
  }

  const getItemCount = () => {
    return items.length
  }

  const isItemInCart = (itemId: Id<"items">) => {
    return items.some((item) => item.itemId === itemId)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        getTotal,
        getItemCount,
        isItemInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
