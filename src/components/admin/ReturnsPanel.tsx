import { useState } from 'react'
import { trpc } from '../../providers/trpc'
import { fmt } from '../../lib/cart'
import { AlertTriangle, CheckCircle, XCircle, Truck, RotateCcw, MessageSquare, Plus } from 'lucide-react'

export default function ReturnsPanel({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ orderId: 0, orderCode: '', customerName: '', customerPhone: '', reason: '', refundAmount: 0 })

  const { data, isLoading } = trpc.admin.returns.useQuery({ key: adminKey, status: filter === 'all' ? undefined : filter })
  const createReturn = trpc.admin.createReturn.useMutation({
    onSuccess: () => { utils.admin.returns.invalidate(); setShowForm(false); setForm({ orderId: 0, orderCode: '', customerName: '', customerPhone: '', reason: '', refundAmount: 0 }) },
  })
  const updateStatus = trpc.admin.updateReturnStatus.useMutation({
    onSuccess: () => utils.admin.returns.invalidate(),
  })

  const returns = data ?? []
  const statusColors: Record<string, string> = {
    requested: 'bg-amber-100 text-amber-700',
    approved: 'bg-sky-100 text-sky-700',
    rejected: 'bg-red-100 text-red-700',
    picked_up: 'bg-purple-100 text-purple-700',
    refunded: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-neutral-100 text-neutral-700',
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Returns & Disputes</h2>
          <p className="text-xs text-neutral-500 mt-1">Manage return requests and refunds.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold"
        >
          <Plus size={14} /> New Return
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'requested', 'approved', 'picked_up', 'refunded', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === s ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* New Return Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
          <h3 className="font-bold text-sm">Create Return Request</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Order ID" type="number" value={form.orderId || ''} onChange={(e) => setForm({ ...form, orderId: parseInt(e.target.value) })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            <input placeholder="Order Code" value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            <input placeholder="Customer Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            <input placeholder="Refund Amount (UGX)" type="number" value={form.refundAmount || ''} onChange={(e) => setForm({ ...form, refundAmount: parseInt(e.target.value) })} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          </div>
          <textarea placeholder="Reason for return..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" rows={3} />
          <button
            onClick={() => createReturn.mutate({ key: adminKey, ...form })}
            disabled={createReturn.isPending || !form.orderCode || !form.reason}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
          >
            {createReturn.isPending ? 'Creating...' : 'Create Return'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-neutral-500">Loading returns...</p>}

      {returns.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-neutral-500">No return requests.</p>
        </div>
      )}

      <div className="space-y-3">
        {returns.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold">{r.orderCode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] ?? 'bg-neutral-100'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">{r.customerName} · {r.customerPhone}</p>
                <p className="text-xs text-neutral-500 mt-1">{r.reason}</p>
                {r.refundAmount > 0 && <p className="text-sm font-bold text-emerald-600 mt-1">Refund: {fmt(r.refundAmount)}</p>}
                {r.adminNotes && <p className="text-xs text-neutral-400 mt-1 italic">Admin: {r.adminNotes}</p>}
              </div>
              <div className="flex gap-2">
                {r.status === 'requested' && (
                  <>
                    <button onClick={() => updateStatus.mutate({ key: adminKey, id: r.id, status: 'approved' })} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold">
                      <CheckCircle size={12} className="inline mr-1" /> Approve
                    </button>
                    <button onClick={() => updateStatus.mutate({ key: adminKey, id: r.id, status: 'rejected' })} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold">
                      <XCircle size={12} className="inline mr-1" /> Reject
                    </button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button onClick={() => updateStatus.mutate({ key: adminKey, id: r.id, status: 'picked_up' })} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold">
                    <Truck size={12} className="inline mr-1" /> Picked Up
                  </button>
                )}
                {r.status === 'picked_up' && (
                  <button onClick={() => updateStatus.mutate({ key: adminKey, id: r.id, status: 'refunded' })} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                    <RotateCcw size={12} className="inline mr-1" /> Refund
                  </button>
                )}
                <button
                  onClick={() => {
                    const note = prompt('Add admin note:')
                    if (note) updateStatus.mutate({ key: adminKey, id: r.id, status: r.status, adminNotes: note })
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-200 text-neutral-700 text-xs font-bold"
                >
                  <MessageSquare size={12} className="inline mr-1" /> Note
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
