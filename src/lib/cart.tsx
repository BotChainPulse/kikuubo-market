import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type CartItem = {
  itemType: 'product' | 'menu_item'
  itemId: number
  name: string
  price: number
  qty: number
}

type CartCtx = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (itemType: string, itemId: number) => void
  setQty: (itemType: string, itemId: number, qty: number) => void
  clear: () => void
  count: number
  subtotal: number
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('kikuubo_cart') ?? '[]') } catch { return [] }
  })
  useEffect(() => { localStorage.setItem('kikuubo_cart', JSON.stringify(items)) }, [items])

  const add: CartCtx['add'] = (item, qty = 1) =>
    setItems((prev) => {
      const i = prev.findIndex((p) => p.itemType === item.itemType && p.itemId === item.itemId)
      if (i >= 0) { const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + qty }; return next }
      return [...prev, { ...item, qty }]
    })
  const remove: CartCtx['remove'] = (t, id) => setItems((p) => p.filter((i) => !(i.itemType === t && i.itemId === id)))
  const setQty: CartCtx['setQty'] = (t, id, qty) =>
    setItems((p) => (qty <= 0 ? p.filter((i) => !(i.itemType === t && i.itemId === id)) : p.map((i) => (i.itemType === t && i.itemId === id ? { ...i, qty } : i))))
  const clear = () => setItems([])

  return (
    <Ctx.Provider value={{
      items, add, remove, setQty, clear,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart outside CartProvider')
  return c
}

export const fmt = (n: number) => 'UGX ' + n.toLocaleString('en-UG')
