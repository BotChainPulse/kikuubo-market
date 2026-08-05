import { useState } from 'react'
import { Link } from 'react-router'
import { ShieldCheck, Store, Package, Users, LayoutDashboard, LogOut, Check, X, ChevronDown, ClipboardList, Wallet, Download, Banknote, Bike, Megaphone, ScrollText } from 'lucide-react'
import { trpc } from '../providers/trpc'
import { fmt } from '../lib/cart'
import { paymentLabel } from '../lib/payStatus'
import { ORANGE } from '../lib/site'
import PayoutPanel from '../components/admin/PayoutPanel'

const KEY_STORAGE = 'ugsouq_admin_key'
const ORDER_STATUSES = ['placed', 'confirmed', 'pending_delivery', 'on_the_way', 'delivered', 'cancelled'] as const
const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed', confirmed: 'Confirmed', pending_delivery: 'Pending delivery', on_the_way: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
}
type Tab = 'overview' | 'sellers' | 'listings' | 'orders' | 'accounts' | 'affiliates' | 'payouts' | 'delivery' | 'ads' | 'audit'
type DeliveryStatus = 'pending' | 'approved' | 'rejected'
type AdStatus = 'booked' | 'paid' | 'active' | 'completed' | 'cancelled'

function QueryError({ title, error, onRetry }: { title: string; error: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="font-bold text-red-700">{title}</p>
      <p className="mt-1 text-sm text-red-700">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-bold text-white px-3 py-2 rounded-lg"
          style={{ background: ORANGE }}
        >
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
        <form
          onSubmit={(e) => { e.preventDefault(); login.mutate({ key: input.trim() }) }}
          className="w-full max-w-sm bg-white rounded-2xl p-8"
        >
          <div className="w-12 h-12 rounded-xl grid place-items-center text-white mx-auto" style={{ background: ORANGE }}>
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-center">UG Souq Admin</h1>
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
    <div className="min-h-screen bg-neutral-100 overflow-x-clip">
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold">
            <img src="/logo-mark.png" alt="UG Souq logo" className="w-8 h-8 rounded-lg object-cover bg-white" />
            UG Souq Admin
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
        <div className="mx-auto max-w-7xl px-4 flex gap-1 text-sm overflow-x-auto whitespace-nowrap no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
          {([
            ['overview', LayoutDashboard, 'Overview'],
            ['sellers', Store, 'Sellers'],
            ['listings', ClipboardList, 'Listings'],
            ['orders', Package, 'Orders'],
            ['accounts', Wallet, 'Accounts'],
            ['payouts', Banknote, 'Payouts'],
            ['delivery', Bike, 'Delivery'],
            ['ads', Megaphone, 'Seller Ads'],
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
        {tab === 'ads' && <SellerAds adminKey={key} />}
        {tab === 'audit' && <AuditLog adminKey={key} />}
      </main>
    </div>
  )
}

function DeliveryPartners({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading, isError, error, refetch } = trpc.admin.deliveryPartners.useQuery({ key: adminKey }, { retry: false })
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

      <div className="space-y-3">
        {data.partners.map((p) => (
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

function SellerAds({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading, isError, error, refetch } = trpc.admin.adBookings.useQuery({ key: adminKey }, { retry: false })
  const setStatus = trpc.admin.setAdBookingStatus.useMutation({
    onSuccess: () => {
      utils.admin.adBookings.invalidate()
      utils.admin.accounts.invalidate()
      utils.admin.auditLog.invalidate()
    },
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
            <tr>
              <th className="px-4 py-2.5">ID</th>
              <th className="px-4 py-2.5">Seller</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Amount</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Booked</th>
              <th className="px-4 py-2.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-semibold">#{r.id}</td>
                <td className="px-4 py-2.5">{r.sellerName}</td>
                <td className="px-4 py-2.5 text-neutral-500">{r.sellerPhone}</td>
                <td className="px-4 py-2.5 capitalize">{r.planType}</td>
                <td className="px-4 py-2.5 font-semibold text-fuchsia-700">{fmt(r.amount)}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={r.status}
                    onChange={(e) => setStatus.mutate({ key: adminKey, id: r.id, status: e.target.value as AdStatus })}
                    className="text-xs rounded-lg border border-neutral-300 px-2 py-1.5 bg-white"
                  >
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

function AuditLog({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.auditLog.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load audit logs" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load audit logs" error="No response from server." onRetry={refetch} />

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[1040px]">
        <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
          <tr>
            <th className="px-4 py-2.5">Time</th>
            <th className="px-4 py-2.5">Actor</th>
            <th className="px-4 py-2.5">Action</th>
            <th className="px-4 py-2.5">Entity</th>
            <th className="px-4 py-2.5">Before</th>
            <th className="px-4 py-2.5">After / Meta</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t border-neutral-100 align-top">
              <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-UG')}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{row.actorTag}</td>
              <td className="px-4 py-2.5 font-semibold">{row.action}</td>
              <td className="px-4 py-2.5 text-neutral-500">{row.entityType} #{row.entityId}</td>
              <td className="px-4 py-2.5">
                <pre className="text-[10px] whitespace-pre-wrap bg-neutral-50 rounded p-2 max-h-32 overflow-auto">{row.beforeState ?? '-'}</pre>
              </td>
              <td className="px-4 py-2.5">
                <pre className="text-[10px] whitespace-pre-wrap bg-neutral-50 rounded p-2 max-h-32 overflow-auto">{row.afterState ?? row.meta ?? '-'}</pre>
              </td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No audit entries yet.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Overview({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.stats.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load overview" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load overview" error="No response from server." onRetry={refetch} />
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
  const { data, isLoading, isError, error, refetch } = trpc.admin.sellers.useQuery({ key: adminKey }, { retry: false })
  const setStatus = trpc.admin.setSellerStatus.useMutation({
    onSuccess: () => { utils.admin.sellers.invalidate(); utils.admin.stats.invalidate() },
  })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load sellers" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load sellers" error="No response from server." onRetry={refetch} />
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
              <p className="mt-0.5 text-xs text-neutral-500">
                Contracts: seller {s.sellerContractAccepted ? 'accepted' : 'not accepted'} · commission {s.commissionTermsAccepted ? 'accepted' : 'not accepted'}
              </p>
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
  const { data, isLoading, isError, error, refetch } = trpc.admin.listings.useQuery({ key: adminKey }, { retry: false })
  const setStatus = trpc.admin.setListingStatus.useMutation({
    onSuccess: () => { utils.admin.listings.invalidate(); utils.admin.stats.invalidate() },
  })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load listings" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load listings" error="No response from server." onRetry={refetch} />
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
    pending_delivery: 'bg-fuchsia-100 text-fuchsia-700',
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
  const { data, isLoading, isError, error, refetch } = trpc.admin.orders.useQuery({ key: adminKey }, { retry: false })
  const setStatus = trpc.admin.setOrderStatus.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.stats.invalidate() },
  })
  const setPayment = trpc.admin.setPaymentStatus.useMutation({
    onSuccess: () => { utils.admin.orders.invalidate(); utils.admin.stats.invalidate() },
  })
  const [openId, setOpenId] = useState<number | null>(null)
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load orders" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load orders" error="No response from server." onRetry={refetch} />
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
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${paymentLabel(o).cls}`}>{paymentLabel(o).text}</span>
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
          {openId === o.id && o.paymentMethod !== 'cash' && (
            <div className="mt-3 border-t border-neutral-100 pt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-neutral-500">Payment ({o.paymentMethod.replace('_', ' ')}): </span>
                <b>{paymentLabel(o).text}</b>
                {o.paymentRef && <span className="ml-2 font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded">Ref: {o.paymentRef}</span>}
              </div>
              {o.paymentStatus !== 'paid' ? (
                <button
                  onClick={() => setPayment.mutate({ key: adminKey, id: o.id, status: 'paid' })}
                  disabled={setPayment.isPending}
                  className="text-xs font-bold text-white px-4 py-2 rounded-full bg-green-600 disabled:opacity-40">
                  ✓ Mark paid
                </button>
              ) : (
                <button
                  onClick={() => setPayment.mutate({ key: adminKey, id: o.id, status: 'unpaid' })}
                  className="text-xs font-semibold text-neutral-500 hover:text-red-600">
                  Undo paid
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Accounts({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.accounts.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load accounts" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load accounts" error="No response from server." onRetry={refetch} />
  const t = data.totals

  const paidEntries = data.entries.filter((e) => e.paymentStatus === 'paid' && e.status !== 'cancelled')
  const commissionByDay = paidEntries.reduce<Record<string, number>>((acc, e) => {
    const day = new Date(e.date).toISOString().slice(0, 10)
    acc[day] = (acc[day] ?? 0) + e.commission
    return acc
  }, {})
  const commissionByMonth = paidEntries.reduce<Record<string, number>>((acc, e) => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + e.commission
    return acc
  }, {})
  const dailyRows = Object.entries(commissionByDay).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  const monthlyRows = Object.entries(commissionByMonth).sort((a, b) => (a[0] < b[0] ? 1 : -1))

  const exportCsv = () => {
    const header = ['Order code', 'Date', 'Customer', 'Payment method', 'Payment status', 'Order status', 'Sale subtotal', 'Delivery fee', 'UG Souq commission', 'Seller payout', 'Order total']
    const lines = data.entries.map((e) => [
      e.code,
      new Date(e.date).toLocaleString('en-UG'),
      e.customer,
      e.paymentMethod,
      e.paymentStatus,
      e.status,
      e.subtotal,
      e.deliveryFee,
      e.commission,
      e.sellerPayout,
      e.total,
    ])
    const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ugsouq-accounts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const cards: [string, number, string?][] = [
    ['Product sales', t.sales],
    ['Commission (booked)', t.commissionBooked ?? t.commissionEarned, 'text-emerald-700'],
    ['Commission (realized)', t.commissionRealized ?? 0, 'text-emerald-700'],
    ['Delivery fees collected', t.deliveryFees],
    ['Delivery income 10% (booked)', t.deliveryIncome10pctBooked ?? 0, 'text-sky-700'],
    ['Delivery income 10% (realized)', t.deliveryIncome10pctRealized ?? 0, 'text-sky-700'],
    ['Seller ad revenue (booked)', t.adRevenueBooked ?? 0, 'text-fuchsia-700'],
    ['Seller ad revenue (realized)', t.adRevenueRealized ?? 0, 'text-fuchsia-700'],
    ['Gross platform income (booked)', t.grossPlatformIncomeBooked ?? 0, 'text-emerald-700'],
    ['Gross platform income (realized)', t.grossPlatformIncomeRealized ?? 0, 'text-emerald-700'],
    ['Seller payouts owed', t.sellerPayoutsOwed, 'text-orange-600'],
    ['Received from buyers', t.receivedFromBuyers, 'text-emerald-700'],
    ['Awaiting buyer payment', t.awaitingBuyerPayment, 'text-red-600'],
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-neutral-600">
          Transparent books — commission is <b>{(data.rate * 100).toFixed(0)}%</b> of each sale (delivery fees are not commissioned). {t.orders} active orders.
        </p>
        <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(([label, value, cls]) => (
          <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-[11px] font-semibold text-neutral-500 leading-tight">{label}</p>
            <p className={`mt-1.5 font-extrabold text-sm sm:text-base ${cls ?? ''}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="font-bold text-sm">Income Streams Audit View</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Booked vs realized values reduce loopholes and make reconciliation transparent.</p>
        </div>
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Stream</th>
              <th className="px-4 py-2.5">Rule</th>
              <th className="px-4 py-2.5 text-emerald-700">Booked</th>
              <th className="px-4 py-2.5 text-emerald-700">Realized</th>
            </tr>
          </thead>
          <tbody>
            {(data.incomeStreams ?? []).map((s, i) => (
              <tr key={`${s.stream}-${i}`} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-semibold">{s.stream}</td>
                <td className="px-4 py-2.5 text-neutral-500">{s.rule}</td>
                <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(s.booked)}</td>
                <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(s.realized)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h3 className="font-bold text-sm">Commission Income by Day</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Only paid orders are counted as real income.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2">Day</th>
                <th className="px-4 py-2 text-emerald-700">Commission</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map(([day, amount]) => (
                <tr key={day} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5">{day}</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(amount)}</td>
                </tr>
              ))}
              {dailyRows.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-400">No paid commission income yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h3 className="font-bold text-sm">Commission Income by Month</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Useful for weekly/monthly finance reconciliation.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2">Month</th>
                <th className="px-4 py-2 text-emerald-700">Commission</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map(([month, amount]) => (
                <tr key={month} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5">{month}</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(amount)}</td>
                </tr>
              ))}
              {monthlyRows.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-neutral-400">No paid commission income yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Sale</th>
              <th className="px-4 py-2.5">Delivery</th>
              <th className="px-4 py-2.5 text-emerald-700">Commission</th>
              <th className="px-4 py-2.5 text-orange-600">Seller payout</th>
              <th className="px-4 py-2.5">Payment</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr key={e.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-bold">{e.code}</td>
                <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">{new Date(e.date).toLocaleDateString('en-UG')}</td>
                <td className="px-4 py-2.5">{e.customer}</td>
                <td className="px-4 py-2.5">{fmt(e.subtotal)}</td>
                <td className="px-4 py-2.5">{fmt(e.deliveryFee)}</td>
                <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(e.commission)}</td>
                <td className="px-4 py-2.5 font-semibold text-orange-600">{fmt(e.sellerPayout)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : e.paymentStatus === 'pending_confirmation' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {e.paymentStatus === 'paid' ? 'Paid' : e.paymentStatus === 'pending_confirmation' ? 'Confirming' : e.paymentMethod === 'cash' ? 'Cash' : 'Unpaid'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-500">{e.status}</td>
              </tr>
            ))}
            {data.entries.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-400">No orders yet — the ledger fills as orders come in.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Affiliates({ adminKey }: { adminKey: string }) {
  const { data, isLoading, isError, error, refetch } = trpc.admin.affiliates.useQuery({ key: adminKey }, { retry: false })
  if (isLoading) return <p className="text-neutral-500">Loading…</p>
  if (isError) return <QueryError title="Could not load affiliates" error={error.message} onRetry={refetch} />
  if (!data) return <QueryError title="Could not load affiliates" error="No response from server." onRetry={refetch} />
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
