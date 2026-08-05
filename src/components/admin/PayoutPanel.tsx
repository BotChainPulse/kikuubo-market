import { useState } from 'react'
import { trpc } from '../../providers/trpc'
import { fmt } from '../../lib/cart'
import { CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react'

export default function PayoutPanel({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

  const { data: pendingData, isLoading: pendingLoading } = trpc.admin.pendingPayouts.useQuery({ key: adminKey })
  const { data: historyData, isLoading: historyLoading } = trpc.admin.payoutHistory.useQuery({ key: adminKey, limit: 100 })

  const sendPayout = trpc.admin.sendPayout.useMutation({
    onSuccess: () => {
      utils.admin.pendingPayouts.invalidate()
      utils.admin.payoutHistory.invalidate()
      utils.admin.orders.invalidate()
      utils.admin.accounts.invalidate()
      utils.admin.stats.invalidate()
    },
  })

  const pending = pendingData?.pending ?? []
  const history = historyData?.payouts ?? []

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-emerald-600" />
      case 'failed': return <XCircle size={16} className="text-red-600" />
      case 'processing': return <Clock size={16} className="text-amber-500" />
      case 'rolled_back': return <AlertTriangle size={16} className="text-orange-500" />
      default: return <Clock size={16} className="text-neutral-400" />
    }
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      rolled_back: 'Rolled Back',
    }
    return map[status] ?? status
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'pending' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'history' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}
        >
          History ({history.length})
        </button>
      </div>

      {/* Pending Payouts */}
      {activeTab === 'pending' && (
        <>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h2 className="font-bold">Pending Payouts</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Delivered + Paid orders awaiting seller payout. Total pending: {fmt(pending.reduce((s, p) => s + (p.total_owed ?? 0), 0))}
            </p>
          </div>

          {pendingLoading && <p className="text-neutral-500">Loading...</p>}

          {pending.length === 0 && !pendingLoading && (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
              <p className="text-neutral-500">No pending payouts.</p>
              <p className="text-xs text-neutral-400 mt-1">Orders must be "Delivered" and "Paid" to appear here.</p>
            </div>
          )}

          {pending.map((p: any) => {
            const codes = Array.isArray(p.order_codes) ? p.order_codes : []
            const amount = Number(p.total_owed ?? 0)
            const sellerId = Number(p.seller_id)
            const sellerName = String(p.seller_name ?? 'Seller')
            const payoutMethod = String(p.payout_method ?? 'MPS')
            const payoutNumber = String(p.payout_number ?? '')

            return (
              <div key={sellerId} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg">{sellerName}</p>
                    <p className="text-sm text-neutral-600 mt-1">
                      <span className="font-medium">{payoutMethod.toUpperCase()}</span> · {payoutNumber || 'No number'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {codes.length} order(s): <span className="font-mono">{codes.join(', ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-xl">{fmt(amount)}</p>
                    <button
                      disabled={sendPayout.isPending || !payoutNumber || amount <= 0 || codes.length === 0}
                      onClick={() =>
                        sendPayout.mutate({
                          key: adminKey,
                          sellerId,
                          amount,
                          orderCodes: codes,
                          payoutMethod,
                          payoutNumber,
                          sellerName,
                        })
                      }
                      className="mt-2 text-xs font-bold text-white px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendPayout.isPending ? 'Sending...' : 'Release Payout'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Payout History */}
      {activeTab === 'history' && (
        <>
          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Payout History</h2>
              <p className="text-xs text-neutral-500 mt-1">All processed payouts with status tracking.</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-2 rounded-lg hover:bg-neutral-200">
              <Download size={14} /> Export
            </button>
          </div>

          {historyLoading && <p className="text-neutral-500">Loading...</p>}

          {history.length === 0 && !historyLoading && (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
              <p className="text-neutral-500">No payout history yet.</p>
              <p className="text-xs text-neutral-400 mt-1">Payouts will appear here once processed.</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Seller ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p: any) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3">#{p.sellerId}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.payoutMethod?.toUpperCase()}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.payoutNumber}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(p.status)}
                        <span className="text-xs font-medium">{statusLabel(p.status)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-xs">
                      {p.processedAt ? new Date(p.processedAt).toLocaleString('en-UG') : new Date(p.createdAt).toLocaleString('en-UG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
