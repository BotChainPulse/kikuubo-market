import { useState } from 'react'
import { Link } from 'react-router'
import { Minus, Plus, Trash2, ShoppingCart, CircleCheckBig, Wallet } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { fmt, useCart } from '../lib/cart'
import { trpc } from '@/providers/trpc'
import { ORANGE } from '../lib/site'

export default function Cart() {
  const { items, setQty, remove, clear, subtotal, count } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', address: '', payment: 'mtn_momo' as 'mtn_momo' | 'airtel_money' | 'cash' })
  const createOrder = trpc.orders.create.useMutation()
  const [placed, setPlaced] = useState<{ code: string; total: number } | null>(null)

  const deliveryFee = items.length ? 3000 : 0
  const total = subtotal + deliveryFee
  const valid = form.name.length >= 2 && form.phone.length >= 9 && form.address.length >= 5

  const submit = async () => {
    const order = await createOrder.mutateAsync({
      customerName: form.name,
      phone: form.phone,
      address: form.address,
      paymentMethod: form.payment,
      items: items.map((i) => ({ itemType: i.itemType, itemId: i.itemId, name: i.name, price: i.price, qty: i.qty })),
      deliveryFee,
    })
    setPlaced({ code: order.code, total: order.total })
    clear()
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900 antialiased">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {placed ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
            <CircleCheckBig size={52} className="mx-auto text-green-600" />
            <h1 className="mt-4 text-2xl font-extrabold">Order placed!</h1>
            <p className="mt-2 text-neutral-600">Your order code is</p>
            <p className="mt-1 text-3xl font-extrabold tracking-widest" style={{ color: ORANGE }}>{placed.code}</p>
            <p className="mt-3 text-sm text-neutral-600">Total: <b>{fmt(placed.total)}</b> · Keep your code and phone number to track the order. We'll confirm on WhatsApp/SMS shortly.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/track" className="text-sm font-bold text-white px-6 py-3 rounded-full" style={{ background: ORANGE }}>Track order</Link>
              <Link to="/" className="text-sm font-bold px-6 py-3 rounded-full border border-neutral-300">Continue shopping</Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={44} className="mx-auto text-neutral-300" />
            <h1 className="mt-4 text-xl font-extrabold">Your cart is empty</h1>
            <p className="text-neutral-500 text-sm mt-1">Add products or order food to get started.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/" className="text-sm font-bold text-white px-6 py-3 rounded-full" style={{ background: ORANGE }}>Shop Flash Sale</Link>
              <Link to="/food" className="text-sm font-bold px-6 py-3 rounded-full border border-neutral-300">Order food</Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">Cart ({count})</h1>
            <div className="mt-5 space-y-3">
              {items.map((i) => (
                <div key={`${i.itemType}-${i.itemId}`} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{i.name}</p>
                    <p className="text-sm font-extrabold mt-0.5" style={{ color: ORANGE }}>{fmt(i.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(i.itemType, i.itemId, i.qty - 1)} className="w-8 h-8 rounded-full border border-neutral-300 grid place-items-center"><Minus size={14} /></button>
                    <span className="w-6 text-center font-bold text-sm">{i.qty}</span>
                    <button onClick={() => setQty(i.itemType, i.itemId, i.qty + 1)} className="w-8 h-8 rounded-full border border-neutral-300 grid place-items-center"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => remove(i.itemType, i.itemId)} className="p-2 text-neutral-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {/* Checkout */}
            <div className="mt-8 bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-extrabold text-lg flex items-center gap-2"><Wallet size={20} style={{ color: ORANGE }} /> Checkout</h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Full name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Phone (MoMo/Airtel) *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500" placeholder="07XX XXX XXX" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1.5">Delivery address *</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500" placeholder="e.g. Ntinda, near Capital Shoppers" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {([['mtn_momo', 'MTN MoMo'], ['airtel_money', 'Airtel Money'], ['cash', 'Cash on delivery']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setForm({ ...form, payment: v })}
                    className={`rounded-xl border-2 py-3 text-xs sm:text-sm font-bold transition-all ${form.payment === v ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="mt-5 space-y-1.5 text-sm border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Delivery</span><span>{fmt(deliveryFee)}</span></div>
                <div className="flex justify-between font-extrabold text-base"><span>Total</span><span style={{ color: ORANGE }}>{fmt(total)}</span></div>
              </div>
              <button
                disabled={!valid || createOrder.isPending}
                onClick={submit}
                className="mt-5 w-full text-sm font-bold text-white py-3.5 rounded-full disabled:opacity-40"
                style={{ background: ORANGE }}>
                {createOrder.isPending ? 'Placing order…' : `Place order — ${fmt(total)}`}
              </button>
              {createOrder.isError && <p className="mt-2 text-sm text-red-600 text-center">Something went wrong — please try again.</p>}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
