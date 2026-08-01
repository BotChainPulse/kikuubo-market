import { ShieldCheck, Lock, IdCard, Trash2, Eye, FileText, MessageCircle } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ORANGE, WA_LINK } from '../lib/site'

const sections = [
  {
    icon: FileText, t: 'What we collect',
    items: [
      ['Buyers', 'Name, phone number, delivery address, and order history — only what is needed to deliver your order.'],
      ['Sellers', 'Shop details, National ID/passport number and photo (for verification only), business location, TIN (companies), and payout mobile-money number.'],
      ['Affiliates', 'Name, WhatsApp number, promotion channel, and your affiliate code performance.'],
    ],
  },
  {
    icon: IdCard, t: 'How seller ID documents are protected',
    items: [
      ['Purpose-limited', 'ID photos are used only for identity verification and are never shown to buyers or other sellers.'],
      ['Access-restricted', 'Only the verification team can view ID documents. After a decision is made, documents are retained only as long as the law requires.'],
      ['No resale', 'We never sell or share your personal data with advertisers.'],
    ],
  },
  {
    icon: Eye, t: 'Your rights (Data Protection and Privacy Act, 2019)',
    items: [
      ['Access', 'You may ask for a copy of the personal data we hold about you at any time.'],
      ['Correction', 'You can ask us to correct inaccurate details (e.g. a changed phone number or address).'],
      ['Deletion', 'You can request deletion of your account and personal data, subject to records we must keep by law (e.g. tax records).'],
      ['Objection', 'You can opt out of marketing messages at any time.'],
    ],
  },
  {
    icon: Lock, t: 'Security measures',
    items: [
      ['Encryption in transit', 'All data between your device and Kikuubo is encrypted (HTTPS/TLS).'],
      ['Least-privilege storage', 'Sensitive fields (ID numbers, payout numbers) are stored separately from public shop data.'],
      ['Payment safety', 'Mobile-money payments are processed through the official MTN MoMo / Airtel Money channels — we never see or store your PIN.'],
    ],
  },
]

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900 antialiased">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
          <ShieldCheck size={16} /> Privacy & data protection
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">How Kikuubo protects your data</h1>
        <p className="mt-3 text-neutral-600">
          We operate in line with Uganda's <b>Data Protection and Privacy Act, 2019</b>. This page explains — in plain language — what we collect, why, and the control you have over it.
        </p>

        <div className="mt-10 space-y-6">
          {sections.map(({ icon: Icon, t, items }) => (
            <div key={t} className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-extrabold flex items-center gap-2"><Icon size={18} style={{ color: ORANGE }} /> {t}</h2>
              <div className="mt-4 space-y-3">
                {items.map(([k, d]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="font-bold shrink-0 w-36 text-neutral-800">{k}</span>
                    <span className="text-neutral-600">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-neutral-900 text-white rounded-2xl p-6">
          <h2 className="font-extrabold flex items-center gap-2"><Trash2 size={18} style={{ color: ORANGE }} /> Request access or deletion</h2>
          <p className="text-sm text-neutral-300 mt-2">
            To get a copy of your data, correct it, or delete your account, message us on WhatsApp with the phone number you registered with. We respond within 7 days, as required by law.
          </p>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-full" style={{ background: '#16a34a' }}>
            <MessageCircle size={16} /> Contact data protection on WhatsApp
          </a>
        </div>

        <p className="mt-6 text-xs text-neutral-400">Last updated: August 2026 · Kikuubo Market Ltd, Kampala, Uganda</p>
      </div>
      <Footer />
    </div>
  )
}
