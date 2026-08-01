import { RotateCcw, ShieldCheck, MessageCircle, PackageX } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ORANGE, WA_LINK } from '../lib/site'

export default function Returns() {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900 antialiased">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold flex items-center gap-3"><RotateCcw size={26} style={{ color: ORANGE }} /> Returns & refunds</h1>
        <p className="mt-3 text-neutral-600">Every order on UG Souq is covered by Buyer Protection. If something isn't right, we make it right.</p>

        <div className="mt-8 space-y-4">
          {[
            { icon: ShieldCheck, t: '7-day return window', d: 'Changed your mind or item not as described? Return it within 7 days of delivery for a full refund to your MoMo/Airtel Money.' },
            { icon: PackageX, t: 'Damaged or wrong item', d: 'Report within 48 hours with a photo on WhatsApp. We arrange pickup and refund or replace — your choice.' },
            { icon: RotateCcw, t: 'Food orders', d: 'Food can\'t be returned, but if your order arrives wrong, cold or incomplete, message us within 2 hours for a credit or refund.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-white rounded-2xl border border-neutral-200 p-5 flex gap-4">
              <span className="w-11 h-11 shrink-0 rounded-full grid place-items-center bg-orange-50"><Icon size={20} style={{ color: ORANGE }} /></span>
              <div>
                <h3 className="font-bold text-sm">{t}</h3>
                <p className="text-sm text-neutral-600 mt-1">{d}</p>
              </div>
            </div>
          ))}
        </div>

        <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5 rounded-full" style={{ background: '#16a34a' }}>
          <MessageCircle size={16} /> Start a return on WhatsApp
        </a>
      </div>
      <Footer />
    </div>
  )
}
