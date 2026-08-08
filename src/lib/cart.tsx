import { createContext, useContext, useState, ReactNode } from 'react'

export type CartItem = {
  id: number
  name: string
  price: number
  qty: number
  image?: string
  sellerId?: number
  sellerName?: string
}

type CartContextType = {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (id: number) => void
  updateQty: (id: number, qty: number) => void
  clear: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('ugsouq_cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const save = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem('ugsouq_cart', JSON.stringify(next))
  }

  const add = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + item.qty } : i))
        : [...prev, item]
      localStorage.setItem('ugsouq_cart', JSON.stringify(next))
      return next
    })
  }

  const remove = (id: number) => save(items.filter((i) => i.id !== id))
  const updateQty = (id: number, qty: number) =>
    save(qty <= 0 ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, qty } : i)))
  const clear = () => save([])
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}

export const fmt = (n: number | string | null | undefined) => {
  const val = typeof n === 'string' ? parseFloat(n) : Number(n);
  if (!Number.isFinite(val)) return 'UGX 0';
  return 'UGX ' + val.toLocaleString('en-UG');
};
