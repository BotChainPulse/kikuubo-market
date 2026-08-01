import { useState } from 'react'
import { Link } from 'react-router'
import { ShieldCheck, Store, Package, Users, LayoutDashboard, LogOut, Check, X, ChevronDown, ClipboardList } from 'lucide-react'
import { trpc } from '../providers/trpc'
import { fmt } from '../lib/cart'
import { ORANGE } from '../lib/site'

const KEY_STORAGE = 'kikuubo_admin_key'
const ORDER_STATUSES = ['placed', 'confirmed', 'on_the_way', 'delivered', 'cancelled'] as const
const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', on_the_way: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
}
type Tab = 'overview' | 'sellers' | 'listings' | 'orders' | 'affiliates'

export default function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) ?? '')
  const [input, setInput] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [err, setErr] = useState('')

  const login = trpc.admin.login.useMutation({
    onSuccess: () => { sessionStorage.setItem(KEY_STORAGE, input.trim()); setKey(input.trim()); setErr('') },
    onError: () => setErr('Wrong admin key. Try again.'),
  })

  if (!key) {
    return (
      <div className="min-h-screen bg-neutral-900 grid place-items-center px-4">
        <form
          onSubmit={(e) => { e.preventDefault(); login.mutate({ key: input.trim() }) }}
          className="w-full max-w-sm bg-white rounded-2xl p-8"
        >
          <div className="w-12 h-12 rounded-xl grid place-items-center text-white mx-auto" style={{ background: ORANGE }}>
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-center">Kikuubo Admin</h1>
          <p className="mt-1 text-sm text-neutral-500 text-center">Enter your admin key to continue.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Admin key"
            className="mt-5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-500"
            autoFocus
          />
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={login.isPending || !input.trim()}
            className="mt-4 w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: ORANGE }}
          >
            {login.isPending ? 'Checking…' : 'Sign in'}
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-neutral-400 hover:text-neutral-600">← Back to the market</Link>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="w-8 h-8 rounded-lg grid place-items-center text-sm" style={{ background: ORANGE }}>K</span>
            Kikuubo Admin
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-neutral-400 hover:text-white">View store</Link>
            <button
              onClick={() => { sessionStorage.removeItem(KEY_STORAGE); setKey('') }}
              className="flex items-center gap-1 text-neutral-400 hover:text-white"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 flex gap-1 text-sm">
          {([['overview', LayoutDashboard, 'Overview'], ['sellers', Store, 'Sellers'], ['listings', ClipboardList, 'Listings'], ['orders', Package, 'Orders'], ['affiliates', Users, 'Affiliates']] as const).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg font-medium ${tab === t ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-white'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'overview' && <Overview adminKey={key} />}
        {tab === 'sellers' && <Sellers adminKey={key} />}
        {tab === 'listings' && <Listings adminKey={key} />}
        {tab === 'orders' && <Orders adminKey={key} />}
        {tab === 'affiliates' && <Affiliates adminKey={key} />}
      </main>
    </div>
  )
}

function Overview({ adminKey }: { adminKey: string }) {
  const { data, isLoading } = trpc.admin.stats.useQuery({ key: adminKey })
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>
  const cards = [
    ['Revenue (active orders)', fmt(data.revenue)],
    ['Orders', String(data.orderCount)],
    ['Sellers', String(data.sellerCount)],
    ['Pending sellers', String(data.pendingSellers)],
    ['Products', String(data.productCount)],
    ['Affiliates', String(data.affiliateCount)],
  ]
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 font-extrabold text-lg">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="font-bold mb-3">Orders by status</h2>
        <div className="flex flex-wrap gap-2">
          {data.ordersByStatus.map((s) => (
            <span key={s.status} className="px-3 py-1.5 rounded-full bg-neutral-100 text-sm font-medium">
              {STATUS_LABEL[s.status]}: <b>{s.count}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Sellers({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.admin.sellers.useQuery({ key: adminKey })
  const setStatus = trpc.admin.setSellerStatus.useMutation({
    onSuccess: () => { utils.admin.sellers.invalidate(); utils.admin.stats.invalidate() },
  })
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>
  return (
    <div className="space-y-3">
      {data.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{s.shopName}</h3>
                <StatusPill status={s.status} />
                {s.verified && <span className="text-xs font-semibold text-sky-600">✓ verified badge</span>}
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {s.ownerName} · {s.phone}{s.email ? ` · ${s.email}` : ''}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {s.idType}: {s.idNumber} (photo: {s.idPhotoName}) · {s.district}, {s.landmark}{s.tin ? ` · TIN ${s.tin}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">Payout: {s.payoutMethod} → {s.payoutNumber}</p>
            </div>
            {s.status === 'pending' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'approved' })}
                  disabled={setStatus.isPending}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'rejected' })}
                  disabled={setStatus.isPending}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            ) : (
              <button
                onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'pending' })}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Reset to pending
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Listings({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.admin.listings.useQuery({ key: adminKey })
  const setStatus = trpc.admin.setListingStatus.useMutation({
    onSuccess: () => { utils.admin.listings.invalidate(); utils.admin.stats.invalidate() },
  })
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>
  if (data.length === 0) return <p className="text-neutral-500">No seller listings yet.</p>
  return (
    <div className="space-y-3">
      {data.map((l) => (
        <div key={l.id} className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{l.name}</h3>
                <StatusPill status={l.status} />
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {fmt(l.price)}{l.oldPrice ? <span className="line-through text-neutral-400 ml-2">{fmt(l.oldPrice)}</span> : null}
                {' '}· stock {l.stock} · <b className="capitalize">{l.condition}</b>
                {l.condition !== 'new' ? `, ${l.warrantyMonths}mo warranty` : ''}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Category: {l.category} · Photos: {l.imageNote}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Seller: {l.sellerName}{l.sellerVerified ? ' ✓' : ''} · submitted {new Date(l.createdAt).toLocaleDateString()}
              </p>
              {l.status === 'approved' && (
                <p className="mt-1 text-xs text-green-700 font-semibold">Published to the market — visible in search & catalog.</p>
              )}
            </div>
            {l.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus.mutate({ key: adminKey, id: l.id, status: 'approved' })}
                  disabled={setStatus.isPending}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <Check size={15} /> Approve & publish
                </button>
                <button
                  onClick={() => setStatus.mutate({ key: adminKey, id: l.id, status: 'rejected' })}
                  disabled={setStatus.isPending}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    placed: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    on_the_way: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function Orders({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.admin.orders.useQuery({ key: adminKey })
  const setStatus = trpc.admin.setOrderStatus.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.stats.invalidate() },
  })
  const [openId, setOpenId] = useState<number | null>(null)
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>
  if (data.length === 0) return <p className="text-neutral-500">No orders yet.</p>
  return (
    <div className="space-y-3">
      {data.map((o) => (
        <div key={o.id} className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="flex items-center gap-2 text-left">
              <ChevronDown size={16} className={`transition-transform ${openId === o.id ? 'rotate-180' : ''}`} />
              <span className="font-bold">{o.code}</span>
              <StatusPill status={o.status} />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-extrabold">{fmt(o.total)}</span>
              <select
                value={o.status}
                onChange={(e) => setStatus.mutate({ key: adminKey, id: o.id, status: e.target.value as typeof ORDER_STATUSES[number] })}
                className="text-sm rounded-lg border border-neutral-300 px-2 py-1.5 bg-white"
              >
                {ORDER_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
              </select>
            </div>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {o.customerName} · {o.phone} · {o.address} · {o.paymentMethod.replace('_', ' ')} · {new Date(o.createdAt).toLocaleString('en-UG')}
          </p>
          {openId === o.id && (
            <ul className="mt-3 border-t border-neutral-100 pt-3 space-y-1 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.qty} × {i.name}</span>
                  <span className="text-neutral-600">{fmt(i.price * i.qty)}</span>
                </li>
              ))}
              <li className="flex justify-between text-neutral-500"><span>Delivery</span><span>{fmt(o.deliveryFee)}</span></li>
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function Affiliates({ adminKey }: { adminKey: string }) {
  const { data, isLoading } = trpc.admin.affiliates.useQuery({ key: adminKey })
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>
  if (data.length === 0) return <p className="text-neutral-500">No affiliates yet.</p>
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
          <tr><th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Phone</th><th className="px-4 py-2.5">Channel</th><th className="px-4 py-2.5">Joined</th></tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-bold">{a.code}</td>
              <td className="px-4 py-2.5">{a.name}</td>
              <td className="px-4 py-2.5">{a.phone}</td>
              <td className="px-4 py-2.5">{a.channel}</td>
              <td className="px-4 py-2.5 text-neutral-500">{new Date(a.createdAt).toLocaleDateString('en-UG')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
