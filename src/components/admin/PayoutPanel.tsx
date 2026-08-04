import { trpc } from '../../providers/trpc'
import { fmt } from '../../lib/cart'

export default function PayoutPanel({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.admin.pendingPayouts.useQuery({ key: adminKey })
  const { data: history } = trpc.admin.payoutHistory.useQuery({ key: adminKey })

  const sendPayout = trpc.admin.sendPayout.useMutation({
    onSuccess: () => {
      utils.admin.pendingPayouts.invalidate()
      utils.admin.payoutHistory.invalidate()
      utils.admin.orders.invalidate()
      utils.admin.accounts.invalidate()
    },
  })

  if (isLoading) return <p className="text-neutral-500">Loading...</p>

  const pending = data?.pending ?? []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="font-bold">Pending Payouts</h2>
        <p className="text-xs text-neutral-500 mt-1">Delivered and paid orders waiting for seller payout.</p>
      </div>

      {pending.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 text-sm text-neutral-500">
          No pending payouts.
        </div>
      )}

      {pending.map((p: any) => {
        const codes =
          Array.isArray(p.order_codes_list)
            ? p.order_codes_list
            : String(p.order_codes ?? '')
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)

        const amount = Number(p.total_owed ?? 0)
        const sellerId = Number(p.seller_id)
        const sellerName = String(p.seller_name ?? 'Seller')
        const payoutMethod = String(p.payout_method ?? 'MPS')
        const payoutNumber = String(p.payout_number ?? '')

        return (
          <div key={sellerId} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{sellerName}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {payoutMethod || 'No payout method'} · {payoutNumber || 'No payout number'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {codes.length} order(s): {codes.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-extrabold">{fmt(amount)}</p>
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
                  className="mt-2 text-xs font-bold text-white px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                >
                  Send payout
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="font-bold">Payout History</h3>
        <p className="text-xs text-neutral-500 mt-1">Currently empty by design.</p>
        <pre className="mt-2 text-xs bg-neutral-50 rounded p-2 overflow-auto">{JSON.stringify(history?.payouts ?? [], null, 2)}</pre>
      </div>
    </div>
  )
}
