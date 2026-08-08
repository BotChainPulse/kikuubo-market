import { useState } from 'react'
import { Link } from 'react-router'
import { ShieldCheck, Store, Package, Users, LayoutDashboard, LogOut, Check, X, ChevronDown, ClipboardList, Wallet, Download, Banknote, Bike, Megaphone, ScrollText, Search, Settings, RotateCcw, Bell, BarChart3, Truck, CheckCircle } from 'lucide-react'
import { trpc } from '../providers/trpc'
import { fmt } from '../lib/cart'
import { ORANGE } from '../lib/site'
import PayoutPanel from '../components/admin/PayoutPanel'
import SettingsPanel from '../components/admin/SettingsPanel'
import BuyersPanel from '../components/admin/BuyersPanel'
import ReturnsPanel from '../components/admin/ReturnsPanel'

const KEY_STORAGE = 'ugsouq_admin_key'
const ORDER_STATUSES = ['placed', 'confirmed', 'pending_delivery', 'on_the_way', 'delivered', 'cancelled'] as const
const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', pending_delivery: 'Pending delivery', on_the_way: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
}
type Tab = 'overview' | 'sellers' | 'listings' | 'orders' | 'accounts' | 'affiliates' | 'payouts' | 'delivery' | 'ads' | 'audit' | 'buyers' | 'settings' | 'returns'
type DeliveryStatus = 'pending' | 'approved' | 'rejected'
type AdStatus = 'booked' | 'paid' | 'active' | 'completed' | 'cancelled'

function QueryError({ title, error, onRetry }: { title: string; error: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="font-bold text-red-700">{title}</p>
      <p className="mt-1 text-sm text-red-700">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs font-bold text-white px-3 py-2 rounded-lg" style={{ background: ORANGE }}>
          Retry
        </button>
      )}
    </div>
  )
}

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
        <form onSubmit={(e) => { e.preventDefault(); login.mutate({ key: input.trim() }) }} className="w-full max-w-sm bg-white rounded-2xl p-8">
          <div className="w-12 h-12 rounded-xl grid place-items-center text-white mx-auto" style={{ background: ORANGE }}>
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-center">UG Souq Admin</h1>
          <p className="mt-1 text-sm text-neutral-500 text-center">Enter your admin key to continue.</p>
          <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Admin key" className="mt-5 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-500" autoFocus />
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={login.isPending || !input.trim()} className="mt-4 w-full rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50" style={{ background: ORANGE }}>
            {login.isPending ? 'Checking…' : 'Sign in'}
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-neutral-400 hover:text-neutral-600">← Back to the market</Link>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 overflow-x-clip">
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold">
            <img src="/logo-mark.png" alt="UG Souq logo" className="w-8 h-8 rounded-lg object-cover bg-white" />
            UG Souq Admin
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-neutral-400 hover:text-white">View store</Link>
            <button onClick={() => { sessionStorage.removeItem(KEY_STORAGE); setKey('') }} className="flex items-center gap-1 text-neutral-400 hover:text-white">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 flex gap-1 text-sm overflow-x-auto whitespace-nowrap no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
          {([
            ['overview', LayoutDashboard, 'Overview'],
            ['sellers', Store, 'Sellers'],
            ['listings', ClipboardList, 'Listings'],
            ['orders', Package, 'Orders'],
            ['accounts', Wallet, 'Accounts'],
            ['payouts', Banknote, 'Payouts'],
            ['delivery', Bike, 'Delivery'],
            ['buyers', Users, 'Buyers'],
            ['returns', RotateCcw, 'Returns'],
            ['ads', Megaphone, 'Seller Ads'],
            ['settings', Settings, 'Settings'],
            ['audit', ScrollText, 'Audit Log'],
            ['affiliates', Users, 'Affiliates'],
          ] as const).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 rounded-t-lg font-medium ${tab === t ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-white'}`}
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
        {tab === 'accounts' && <Accounts adminKey={key} />}
        {tab === 'affiliates' && <Affiliates adminKey={key} />}
        {tab === 'payouts' && <PayoutPanel adminKey={key} />}
        {tab === 'delivery' && <DeliveryPartners adminKey={key} />}
        {tab === 'buyers' && <BuyersPanel adminKey={key} />}
        {tab === 'returns' && <ReturnsPanel adminKey={key} />}
        {tab === 'ads' && <SellerAds adminKey={key} />}
        {tab === 'settings' && <SettingsPanel adminKey={key} />}
        {tab === 'audit' && <AuditLog adminKey={key} />}
      </main>
    </div>
  )
}

// ============================================
// OVERVIEW WITH ANALYTICS
// ============================================
function Overview({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.stats.useQuery({ key: adminKey }, { retry: false })
  const { data: analytics } = trpc.admin.orderAnalytics.useQuery({ key: adminKey, days: 30 }, { retry: false })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load overview" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load overview" error="No response from server." onRetry={refetch} />

  const cards = [
    ['Revenue (active)', fmt(data.revenue)],
    ['Orders', String(data.orderCount)],
    ['Sellers', String(data.sellerCount)],
    ['Pending sellers', String(data.pendingSellers)],
    ['Products', String(data.productCount)],
    ['Customers', String(data.customerCount)],
    ['Pending payouts', String(data.pendingPayouts)],
    ['Commission (booked)', fmt(data.commissionBooked)],
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="mt-1 font-extrabold text-lg">{value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      {analytics && analytics.daily.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Revenue Trend (Last 30 Days)
          </h2>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px] h-40">
              {analytics.daily.map((d: any) => {
                const maxRev = Math.max(...analytics.daily.map((x: any) => x.revenue), 1)
                const height = Math.max((d.revenue / maxRev) * 100, 4)
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-orange-200 rounded-t relative group" style={{ height: `${height}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-neutral-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {fmt(d.revenue)} — {d.orders} orders
                      </div>
                    </div>
                    <span className="text-[9px] text-neutral-400 rotate-0">{d.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-bold text-sm mb-3">Orders by Status</h3>
            <div className="space-y-2">
              {analytics.statusBreakdown.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{s.status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.max((s.count / Math.max(analytics.totalOrders, 1)) * 100, 4)}%` }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-bold text-sm mb-3">Payment Status</h3>
            <div className="space-y-2">
              {analytics.paymentBreakdown.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{s.status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.max((s.count / Math.max(analytics.totalOrders, 1)) * 100, 4)}%` }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="font-bold mb-3">Orders by Status</h2>
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

// ============================================
// SELLERS WITH SEARCH & CONTRACTS
// ============================================
function Sellers({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data, isLoading, isError, error, refetch } = trpc.admin.sellers.useQuery(
    { key: adminKey, search: search || undefined, status: statusFilter !== 'all' ? statusFilter as any : undefined },
    { retry: false }
  )
  const setStatus = trpc.admin.setSellerStatus.useMutation({
    onSuccess: () => { utils.admin.sellers.invalidate(); utils.admin.stats.invalidate() },
  })
  const acceptContract = trpc.admin.acceptSellerContract.useMutation({
    onSuccess: () => utils.admin.sellers.invalidate(),
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load sellers" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load sellers" error="No response from server." onRetry={refetch} />

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-neutral-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {data.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold">{s.shopName}</h3>
                  <StatusPill status={s.status} />
                  {s.verified && <span className="text-xs font-semibold text-sky-600">✓ verified badge</span>}
                </div>
                <p className="mt-1 text-sm text-neutral-600">{s.ownerName} · {s.phone}{s.email ? ` · ${s.email}` : ''}</p>
                <p className="mt-1 text-xs text-neutral-500">{s.idType}: {s.idNumber} (photo: {s.idPhotoName}) · {s.district}, {s.landmark}{s.tin ? ` · TIN ${s.tin}` : ''}</p>
                <p className="mt-0.5 text-xs text-neutral-500">Payout: {s.payoutMethod} → {s.payoutNumber}</p>

                {/* Contract Status */}
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${s.sellerContractAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    Seller Agreement: {s.sellerContractAccepted ? 'Accepted' : 'Not Accepted'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${s.commissionTermsAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    Commission Terms: {s.commissionTermsAccepted ? 'Accepted' : 'Not Accepted'}
                  </span>
                  {!s.sellerContractAccepted && (
                    <button
                      onClick={() => acceptContract.mutate({ key: adminKey, sellerId: s.id, contractType: 'seller_agreement' })}
                      disabled={acceptContract.isPending}
                      className="text-xs px-2 py-1 rounded-full bg-sky-600 text-white font-medium disabled:opacity-50"
                    >
                      Accept as Admin
                    </button>
                  )}
                  {!s.commissionTermsAccepted && (
                    <button
                      onClick={() => acceptContract.mutate({ key: adminKey, sellerId: s.id, contractType: 'commission_terms' })}
                      disabled={acceptContract.isPending}
                      className="text-xs px-2 py-1 rounded-full bg-sky-600 text-white font-medium disabled:opacity-50"
                    >
                      Accept Commission
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'approved' as any })} disabled={setStatus.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"><Check size={15} /> Approve</button>
                <button onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'rejected' as any })} disabled={setStatus.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"><X size={15} /> Reject</button>
                <button onClick={() => setStatus.mutate({ key: adminKey, id: s.id, status: 'pending' as any })} disabled={setStatus.isPending} className="px-3 py-2 rounded-lg bg-neutral-200 text-neutral-700 text-sm font-semibold disabled:opacity-50">Pending</button>
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-neutral-500">No sellers found.</p>}
      </div>
    </div>
  )
}

// ============================================
// LISTINGS WITH SEARCH
// ============================================
function Listings({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data, isLoading, isError, error, refetch } = trpc.admin.listings.useQuery(
    { key: adminKey, search: search || undefined, status: statusFilter !== 'all' ? statusFilter as any : undefined },
    { retry: false }
  )
  const setStatus = trpc.admin.setListingStatus.useMutation({
    onSuccess: () => { utils.admin.listings.invalidate(); utils.admin.stats.invalidate() },
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load listings" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load listings" error="No response from server." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-neutral-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-neutral-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
            <tr><th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Image</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Seller</th><th className="px-4 py-2.5">Price</th><th className="px-4 py-2.5">Stock</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Date</th></tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-semibold">#{r.id}</td>
                <td className="px-4 py-2.5">
                  {r.imageData ? <img src={r.imageData} alt="" className="w-10 h-10 rounded object-cover" /> : <span className="text-xs text-neutral-400">{r.imageNote}</span>}
                </td>
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5">{r.sellerName}{r.sellerVerified && <span className="text-sky-600 ml-1">✓</span>}</td>
                <td className="px-4 py-2.5 font-semibold">{fmt(r.price)}</td>
                <td className="px-4 py-2.5">{r.stock}</td>
                <td className="px-4 py-2.5">
                  <select value={r.status} onChange={(e) => setStatus.mutate({ key: adminKey, id: r.id, status: e.target.value as any })} className="text-xs rounded-lg border border-neutral-300 px-2 py-1.5 bg-white">
                    {(['pending', 'approved', 'rejected'] as const).map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-UG')}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">No listings found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// ORDERS WITH SEARCH & DELIVERY ASSIGNMENT
// ============================================
function Orders({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [assignPartnerId, setAssignPartnerId] = useState<number | null>(null)

  const { data, isLoading, isError, error, refetch } = trpc.admin.orders.useQuery(
    { key: adminKey, search: search || undefined, status: statusFilter !== 'all' ? statusFilter as any : undefined },
    { retry: false }
  )
  const { data: partnersData } = trpc.admin.deliveryPartners.useQuery({ key: adminKey })
  const setStatus = trpc.admin.setOrderStatus.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.stats.invalidate() },
  })
  const setPayment = trpc.admin.setPaymentStatus.useMutation({
    onSuccess: () => utils.admin.orders.invalidate(),
  })
  const assignDelivery = trpc.admin.assignDeliveryPartner.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.deliveryPartners.invalidate() },
  })
  const unassignDelivery = trpc.admin.unassignDeliveryPartner.useMutation({
    onSuccess: () => utils.admin.orders.invalidate(),
  })
  const markDelivered = trpc.admin.markDelivered.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.stats.invalidate() },
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load orders" error={error?.message ?? 'Unknown error'} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load orders" error="No response from server." onRetry={refetch} />

  const approvedPartners = partnersData?.partners?.filter((p: any) => p.status === 'approved') ?? []

  // Defensive: ensure data is array
  const ordersList = Array.isArray(data) ? data : []

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-neutral-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-neutral-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white">
          <option value="all">All Status</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {ordersList.map((o: any) => {
          const safeTotal = Number(o?.total ?? 0)
          const safeDelivery = Number(o?.deliveryFee ?? 0)
          const safeCommission = Number(o?.commissionFee ?? 0)
          const safeSubtotal = safeTotal + safeCommission + safeDelivery
          const items = Array.isArray(o?.items) ? o.items : []

          return (
            <div key={o?.id ?? Math.random()} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} className="flex items-center gap-1">
                    {expandedOrder === o.id ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-[-90deg]" />}
                  </button>
                  <span className="font-mono font-bold">{o?.code ?? 'N/A'}</span>
                  <StatusPill status={o?.status ?? 'placed'} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o?.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : o?.paymentStatus === 'pending_confirmation' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {o?.paymentStatus === 'paid' ? 'Paid' : o?.paymentStatus === 'pending_confirmation' ? 'Confirming' : 'Unpaid'}
                  </span>
                  {o?.paidOut && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Paid Out</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-lg">{fmt(safeTotal)}</span>
                  <select value={o?.status ?? 'placed'} onChange={(e) => setStatus.mutate({ key: adminKey, id: o.id, status: e.target.value as any })} className="text-sm rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <select value={o?.paymentStatus ?? 'unpaid'} onChange={(e) => setPayment.mutate({ key: adminKey, id: o.id, status: e.target.value as any })} className="text-sm rounded-lg border border-neutral-300 px-3 py-1.5 bg-white">
                    <option value="unpaid">Unpaid</option>
                    <option value="pending_confirmation">Confirming</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  {(o?.customerName ?? 'Unknown')} · {(o?.phone ?? '-')} · {((o?.address ?? '').slice(0, 60))}{((o?.address ?? '').length > 60 ? '...' : '')} · {(o?.paymentMethod ?? '-')} · {o?.createdAt ? new Date(o.createdAt).toLocaleString('en-UG') : '-'}
                </p>

                {/* Delivery Assignment */}
                {o?.status !== 'cancelled' && o?.status !== 'delivered' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {o?.deliveryPartnerId ? (
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-sky-600" />
                        <span className="text-xs text-sky-700 font-medium">Rider assigned</span>
                        <button
                          onClick={() => unassignDelivery.mutate({ key: adminKey, orderId: o.id })}
                          disabled={unassignDelivery.isPending}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium disabled:opacity-50"
                        >
                          Unassign
                        </button>
                        <button
                          onClick={() => markDelivered.mutate({ key: adminKey, orderId: o.id })}
                          disabled={markDelivered.isPending}
                          className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-medium disabled:opacity-50"
                        >
                          <CheckCircle size={12} className="inline mr-1" /> Mark Delivered
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Assign rider:</span>
                        <select
                          value={assignPartnerId ?? ''}
                          onChange={(e) => setAssignPartnerId(e.target.value ? parseInt(e.target.value) : null)}
                          className="text-xs rounded-lg border border-neutral-300 px-2 py-1 bg-white"
                        >
                          <option value="">Select rider...</option>
                          {approvedPartners.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.fullName} ({p.vehicleType}) — {p.area}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            if (assignPartnerId) {
                              assignDelivery.mutate({ key: adminKey, orderId: o.id, partnerId: assignPartnerId })
                              setAssignPartnerId(null)
                            }
                          }}
                          disabled={!assignPartnerId || assignDelivery.isPending}
                          className="text-xs px-3 py-1.5 rounded-lg bg-sky-600 text-white font-medium disabled:opacity-50"
                        >
                          {assignDelivery.isPending ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expanded Order Details */}
              {expandedOrder === o?.id && items.length > 0 && (
                <div className="border-t border-neutral-100 p-4 bg-neutral-50">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {items.map((it: any, idx: number) => {
                      const itQty = Number(it?.qty ?? 1)
                      const itPrice = Number(it?.price ?? 0)
                      return (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{itQty} × {it?.name ?? 'Item'}</span>
                          <span className="font-medium">{fmt(itPrice * itQty)}</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between text-sm text-neutral-500 pt-2 border-t border-neutral-200">
                      <span>Subtotal</span>
                      <span>{fmt(safeSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Delivery</span>
                      <span>{fmt(safeDelivery)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Commission</span>
                      <span>{fmt(safeCommission)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-200">
                      <span>Total Paid</span>
                      <span>{fmt(safeTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {ordersList.length === 0 && <p className="text-neutral-500">No orders found.</p>}
      </div>
    </div>
  )
}

// ============================================
// ACCOUNTS (Transparent Books)
// ============================================
// ACCOUNTS — COMMISSION TABLES BY ROLE
// ============================================
function Accounts({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.commissionBreakdown.useQuery({ key: adminKey }, { retry: false })

  if (isLoading) return <p className="text-neutral-500">Loading commission books…</p>
  if (isError) return <QueryError title="Could not load accounts" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load accounts" error="No response from server." onRetry={refetch} />

  const t = data.totals

  const summaryCards = [
    { label: 'Gross Platform Income (Booked)', value: fmt(t.grossPlatformIncomeBooked), color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Gross Platform Income (Realized)', value: fmt(t.grossPlatformIncomeRealized), color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Seller Commission (7%) — Booked', value: fmt(t.commissionBooked), color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Seller Commission (7%) — Realized', value: fmt(t.commissionRealized), color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Rider Platform Fee (10%) — Booked', value: fmt(t.deliveryIncomeBooked), color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Rider Platform Fee (10%) — Realized', value: fmt(t.deliveryIncomeRealized), color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Ad Revenue — Booked', value: fmt(t.adRevenueBooked), color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
    { label: 'Ad Revenue — Realized', value: fmt(t.adRevenueRealized), color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Top Summary */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="font-bold text-lg mb-1">💰 Transparent Books — All Income Streams</h2>
        <p className="text-sm text-neutral-600">
          Commission is <strong>{Math.round(data.rate * 100)}%</strong> on product sales (delivery excluded).
          Rider fee is <strong>10%</strong> on delivery. You have <strong>{data.streams.length}</strong> income streams.
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border border-neutral-200 p-4 ${card.bg}`}>
            <p className="text-xs text-neutral-500">{card.label}</p>
            <p className={`mt-1 font-extrabold text-lg ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Income Streams Overview Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="font-bold text-sm">📊 Income Streams Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Income Stream</th>
                <th className="px-4 py-2.5">Rule</th>
                <th className="px-4 py-2.5 text-right">Booked</th>
                <th className="px-4 py-2.5 text-right">Realized</th>
                <th className="px-4 py-2.5 text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.streams.map((s: any) => (
                <tr key={s.stream} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{s.stream}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{s.rule}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(s.booked)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(s.realized)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{fmt(s.booked - s.realized)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-bold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right">{fmt(t.grossPlatformIncomeBooked)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{fmt(t.grossPlatformIncomeRealized)}</td>
                <td className="px-4 py-3 text-right text-amber-600">{fmt(t.grossPlatformIncomeBooked - t.grossPlatformIncomeRealized)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SELLER COMMISSION TABLE */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-sm">🏪 Seller Commissions (7% of product sales)</h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
            {data.sellers.length} sellers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Seller</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5 text-right">Orders</th>
                <th className="px-4 py-2.5 text-right">Total Sales</th>
                <th className="px-4 py-2.5 text-right">Commission (Booked)</th>
                <th className="px-4 py-2.5 text-right">Commission (Realized)</th>
                <th className="px-4 py-2.5 text-right">Payout Owed</th>
              </tr>
            </thead>
            <tbody>
              {data.sellers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No seller orders yet.</td></tr>
              ) : (
                data.sellers.map((s: any) => (
                  <tr key={s.sellerId} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.shopName}</div>
                      <div className="text-xs text-neutral-400">{s.ownerName}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{s.phone}</td>
                    <td className="px-4 py-3 text-right font-bold">{s.orders}</td>
                    <td className="px-4 py-3 text-right">{fmt(s.totalSales)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(s.commissionBooked)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(s.commissionRealized)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(s.payoutOwed)}</td>
                  </tr>
                ))
              )}
              {data.sellers.length > 0 && (
                <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-bold">
                  <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                  <td className="px-4 py-3 text-right">{data.sellers.reduce((sum: number, s: any) => sum + s.orders, 0)}</td>
                  <td className="px-4 py-3 text-right">{fmt(data.sellers.reduce((sum: number, s: any) => sum + s.totalSales, 0))}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmt(data.sellers.reduce((sum: number, s: any) => sum + s.commissionBooked, 0))}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmt(data.sellers.reduce((sum: number, s: any) => sum + s.commissionRealized, 0))}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmt(data.sellers.reduce((sum: number, s: any) => sum + s.payoutOwed, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIDER / DELIVERY TABLE */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-sm">🚚 Rider / Delivery Platform Fees (10% of delivery)</h3>
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-bold">
            {data.riders.length} riders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Rider</th>
                <th className="px-4 py-2.5">Area</th>
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5 text-right">Orders</th>
                <th className="px-4 py-2.5 text-right">Delivery Fees</th>
                <th className="px-4 py-2.5 text-right">Your 10% (Booked)</th>
                <th className="px-4 py-2.5 text-right">Your 10% (Realized)</th>
                <th className="px-4 py-2.5 text-right">Rider Share (Booked)</th>
                <th className="px-4 py-2.5 text-right">Rider Share (Realized)</th>
              </tr>
            </thead>
            <tbody>
              {data.riders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-400">No rider deliveries yet.</td></tr>
              ) : (
                data.riders.map((r: any) => (
                  <tr key={r.riderId} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{r.fullName}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.area}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs uppercase">{r.vehicleType}</td>
                    <td className="px-4 py-3 text-right font-bold">{r.orders}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.totalDeliveryFees)}</td>
                    <td className="px-4 py-3 text-right font-bold text-sky-700">{fmt(r.platformIncomeBooked)}</td>
                    <td className="px-4 py-3 text-right font-bold text-sky-700">{fmt(r.platformIncomeRealized)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(r.riderShareBooked)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{fmt(r.riderShareRealized)}</td>
                  </tr>
                ))
              )}
              {data.riders.length > 0 && (
                <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-bold">
                  <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                  <td className="px-4 py-3 text-right">{data.riders.reduce((sum: number, r: any) => sum + r.orders, 0)}</td>
                  <td className="px-4 py-3 text-right">{fmt(data.riders.reduce((sum: number, r: any) => sum + r.totalDeliveryFees, 0))}</td>
                  <td className="px-4 py-3 text-right text-sky-700">{fmt(data.riders.reduce((sum: number, r: any) => sum + r.platformIncomeBooked, 0))}</td>
                  <td className="px-4 py-3 text-right text-sky-700">{fmt(data.riders.reduce((sum: number, r: any) => sum + r.platformIncomeRealized, 0))}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmt(data.riders.reduce((sum: number, r: any) => sum + r.riderShareBooked, 0))}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmt(data.riders.reduce((sum: number, r: any) => sum + r.riderShareRealized, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AFFILIATE TABLE */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-sm">🤝 Affiliate Commissions</h3>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
            {data.affiliates.length} affiliates · Not yet active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Channel</th>
                <th className="px-4 py-2.5 text-right">Referrals</th>
                <th className="px-4 py-2.5 text-right">Commission</th>
              </tr>
            </thead>
            <tbody>
              {data.affiliates.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No affiliates registered yet.</td></tr>
              ) : (
                data.affiliates.map((a: any) => (
                  <tr key={a.affiliateId} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.channel}</td>
                    <td className="px-4 py-3 text-right">{a.referrals}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700">
            💡 <strong>Coming soon:</strong> Link affiliates to orders and set a commission rate (e.g., 2-5% per referral).
            Currently registered but not earning.
          </p>
        </div>
      </div>
    </div>
  )
}


// DELIVERY PARTNERS
// ============================================
function DeliveryPartners({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, error, refetch } = trpc.admin.deliveryPartners.useQuery({ key: adminKey, search: search || undefined }, { retry: false })
  const setStatus = trpc.admin.setDeliveryPartnerStatus.useMutation({
    onSuccess: () => { utils.admin.deliveryPartners.invalidate(); utils.admin.auditLog.invalidate() },
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load delivery partners" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load delivery partners" error="No response from server." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Delivery fees (booked)</p><p className="mt-1 font-extrabold text-lg">{fmt(data.ledger.deliveryFeesBooked)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Delivery fees (realized)</p><p className="mt-1 font-extrabold text-lg">{fmt(data.ledger.deliveryFeesRealized)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Platform 10% (booked)</p><p className="mt-1 font-extrabold text-lg text-sky-700">{fmt(data.ledger.platform10Booked)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Platform 10% (realized)</p><p className="mt-1 font-extrabold text-lg text-sky-700">{fmt(data.ledger.platform10Realized)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Partner share (booked)</p><p className="mt-1 font-extrabold text-lg text-orange-600">{fmt(data.ledger.partnerShareBooked)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Partner share (realized)</p><p className="mt-1 font-extrabold text-lg text-orange-600">{fmt(data.ledger.partnerShareRealized)}</p></div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input type="text" placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-sm rounded-lg border border-neutral-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-neutral-500" />
      </div>

      <div className="space-y-3">
        {data.partners.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{p.fullName}</h3>
                  <StatusPill status={p.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-600">{p.phone} · {p.area} · {p.vehicleType.toUpperCase()}</p>
                <p className="mt-0.5 text-xs text-neutral-500">Payout: {p.payoutMethod} → {p.payoutNumber}</p>
                <p className="mt-0.5 text-xs text-neutral-500">Contract: {p.contractAccepted ? 'accepted' : 'not accepted'} · Delivery 10% share: {p.deliveryShareAccepted ? 'accepted' : 'not accepted'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStatus.mutate({ key: adminKey, id: p.id, status: 'approved' as DeliveryStatus })} disabled={setStatus.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50"><Check size={15} /> Approve</button>
                <button onClick={() => setStatus.mutate({ key: adminKey, id: p.id, status: 'rejected' as DeliveryStatus })} disabled={setStatus.isPending} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"><X size={15} /> Reject</button>
                <button onClick={() => setStatus.mutate({ key: adminKey, id: p.id, status: 'pending' as DeliveryStatus })} disabled={setStatus.isPending} className="px-3 py-2 rounded-lg bg-neutral-200 text-neutral-700 text-sm font-semibold disabled:opacity-50">Pending</button>
              </div>
            </div>
          </div>
        ))}
        {data.partners.length === 0 && <p className="text-neutral-500">No delivery partner applications yet.</p>}
      </div>
    </div>
  )
}

// ============================================
// SELLER ADS
// ============================================
function SellerAds({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading, isError, error, refetch } = trpc.admin.adBookings.useQuery({ key: adminKey }, { retry: false })
  const setStatus = trpc.admin.setAdBookingStatus.useMutation({
    onSuccess: () => { utils.admin.adBookings.invalidate(); utils.admin.accounts.invalidate(); utils.admin.auditLog.invalidate() },
  })

  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load seller ad bookings" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load seller ad bookings" error="No response from server." onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Bookings count</p><p className="mt-1 font-extrabold text-lg">{data.totals.count}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Ad revenue (booked)</p><p className="mt-1 font-extrabold text-lg text-fuchsia-700">{fmt(data.totals.booked)}</p></div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4"><p className="text-xs text-neutral-500">Ad revenue (realized)</p><p className="mt-1 font-extrabold text-lg text-fuchsia-700">{fmt(data.totals.realized)}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
            <tr><th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Seller</th><th className="px-4 py-2.5">Phone</th><th className="px-4 py-2.5">Plan</th><th className="px-4 py-2.5">Amount</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Booked</th><th className="px-4 py-2.5">Notes</th></tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-semibold">#{r.id}</td>
                <td className="px-4 py-2.5">{r.sellerName}</td>
                <td className="px-4 py-2.5 text-neutral-500">{r.sellerPhone}</td>
                <td className="px-4 py-2.5 capitalize">{r.planType}</td>
                <td className="px-4 py-2.5 font-semibold text-fuchsia-700">{fmt(r.amount)}</td>
                <td className="px-4 py-2.5">
                  <select value={r.status} onChange={(e) => setStatus.mutate({ key: adminKey, id: r.id, status: e.target.value as AdStatus })} className="text-xs rounded-lg border border-neutral-300 px-2 py-1.5 bg-white">
                    {(['booked', 'paid', 'active', 'completed', 'cancelled'] as const).map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-UG')}</td>
                <td className="px-4 py-2.5 text-neutral-500">{r.notes || '-'}</td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">No ad bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// AUDIT LOG
// ============================================
function AuditLog({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.auditLog.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load audit logs" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load audit logs" error="No response from server." onRetry={refetch} />

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[1040px]">
        <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
          <tr><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">Actor</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Entity</th><th className="px-4 py-2.5">Before</th><th className="px-4 py-2.5">After / Meta</th></tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t border-neutral-100 align-top">
              <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-UG')}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{row.actorTag}</td>
              <td className="px-4 py-2.5 font-semibold">{row.action}</td>
              <td className="px-4 py-2.5 text-neutral-500">{row.entityType} #{row.entityId}</td>
              <td className="px-4 py-2.5"><pre className="text-[10px] whitespace-pre-wrap bg-neutral-50 rounded p-2 max-h-32 overflow-auto">{row.beforeState ?? '-'}</pre></td>
              <td className="px-4 py-2.5"><pre className="text-[10px] whitespace-pre-wrap bg-neutral-50 rounded p-2 max-h-32 overflow-auto">{row.afterState ?? row.meta ?? '-'}</pre></td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No audit entries yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// AFFILIATES
// ============================================
function Affiliates({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.affiliates.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load affiliates" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load affiliates" error="No response from server." onRetry={refetch} />

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
          <tr><th className="px-4 py-2.5">ID</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Phone</th><th className="px-4 py-2.5">Channel</th><th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Joined</th></tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-neutral-100">
              <td className="px-4 py-2.5 font-semibold">#{a.id}</td>
              <td className="px-4 py-2.5">{a.name}</td>
              <td className="px-4 py-2.5 text-neutral-500">{a.phone}</td>
              <td className="px-4 py-2.5">{a.channel}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{a.code}</td>
              <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleString('en-UG')}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No affiliates yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

// ============================================
// STATUS PILL HELPER
// ============================================
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    pending_delivery: 'bg-orange-100 text-orange-700',
    on_the_way: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-neutral-100 text-neutral-700'}`}>{status.replace('_', ' ')}</span>
}
