import { useState } from 'react'
import { trpc } from '../../providers/trpc'
import { Save, RefreshCw, Percent, Truck, CreditCard, Mail, Tag, ShoppingCart, Gift } from 'lucide-react'
import { ORANGE } from '../../lib/site'

export default function SettingsPanel({ adminKey }: { adminKey: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.admin.settings.useQuery({ key: adminKey })
  const update = trpc.admin.updateSettings.useMutation({
    onSuccess: () => utils.admin.settings.invalidate(),
  })

  const [form, setForm] = useState({
    commissionRate: 0.07,
    deliveryFeeBase: 3000,
    deliveryFeePerKm: 500,
    platformName: 'UG Souq',
    platformEmail: 'support@ugsouq.com',
    enableCashOnDelivery: true,
    enableMtnMomo: true,
    enableAirtelMoney: true,
    minOrderAmount: 5000,
    freeDeliveryThreshold: 100000,
  })

  // Sync form when data loads
  if (data && !update.isPending && form.platformName === 'UG Souq' && data.platformName !== 'UG Souq') {
    setForm({
      commissionRate: parseFloat(String(data.commissionRate ?? 0.07)),
      deliveryFeeBase: data.deliveryFeeBase ?? 3000,
      deliveryFeePerKm: data.deliveryFeePerKm ?? 500,
      platformName: data.platformName ?? 'UG Souq',
      platformEmail: data.platformEmail ?? 'support@ugsouq.com',
      enableCashOnDelivery: data.enableCashOnDelivery ?? true,
      enableMtnMomo: data.enableMtnMomo ?? true,
      enableAirtelMoney: data.enableAirtelMoney ?? true,
      minOrderAmount: data.minOrderAmount ?? 5000,
      freeDeliveryThreshold: data.freeDeliveryThreshold ?? 100000,
    })
  }

  const handleSave = () => {
    update.mutate({ key: adminKey, ...form })
  }

  if (isLoading) return <p className="text-neutral-500">Loading settings...</p>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="font-bold text-lg">Platform Settings</h2>
        <p className="text-xs text-neutral-500 mt-1">Configure commission rates, fees, and payment options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commission */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent size={16} className="text-orange-600" />
            <h3 className="font-bold">Commission Rate</h3>
          </div>
          <label className="text-xs text-neutral-500">Percentage taken from each sale (excl. delivery)</label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })}
              className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <span className="text-sm text-neutral-500">= {(form.commissionRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Delivery Fees */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-sky-600" />
            <h3 className="font-bold">Delivery Fees</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500">Base fee (UGX)</label>
              <input
                type="number"
                value={form.deliveryFeeBase}
                onChange={(e) => setForm({ ...form, deliveryFeeBase: parseInt(e.target.value) })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Per km (UGX)</label>
              <input
                type="number"
                value={form.deliveryFeePerKm}
                onChange={(e) => setForm({ ...form, deliveryFeePerKm: parseInt(e.target.value) })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Platform Identity */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-purple-600" />
            <h3 className="font-bold">Platform Identity</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500">Platform Name</label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Support Email</label>
              <input
                type="email"
                value={form.platformEmail}
                onChange={(e) => setForm({ ...form, platformEmail: e.target.value })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-emerald-600" />
            <h3 className="font-bold">Payment Methods</h3>
          </div>
          <div className="space-y-2">
            {[
              { key: 'enableMtnMomo', label: 'MTN Mobile Money' },
              { key: 'enableAirtelMoney', label: 'Airtel Money' },
              { key: 'enableCashOnDelivery', label: 'Cash on Delivery' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Order Thresholds */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={16} className="text-pink-600" />
            <h3 className="font-bold">Order Thresholds</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500">Minimum order (UGX)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: parseInt(e.target.value) })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Free delivery threshold (UGX)</label>
              <input
                type="number"
                value={form.freeDeliveryThreshold}
                onChange={(e) => setForm({ ...form, freeDeliveryThreshold: parseInt(e.target.value) })}
                className="w-full mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-50"
          style={{ background: ORANGE }}
        >
          <Save size={16} />
          {update.isPending ? 'Saving...' : 'Save Settings'}
        </button>
        {update.isSuccess && <span className="text-emerald-600 text-sm font-medium self-center">✓ Saved!</span>}
      </div>
    </div>
  )
}
