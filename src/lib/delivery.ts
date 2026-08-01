// Delivery zones & fees (UGX). Kampala is cheaper/faster; upcountry costs more and takes longer.
export type DeliveryZone = {
  id: string
  label: string
  areas: string[]
  pickupFee: number
  doorFee: number
  pickupEta: string
  doorEta: string
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'kampala',
    label: 'Kampala Region',
    areas: ['Central Business District', 'Nakasero', 'Kololo', 'Makindye', 'Rubaga', 'Kawempe', 'Ntinda', 'Bugolobi', 'Kira', 'Nansana'],
    pickupFee: 2900,
    doorFee: 4600,
    pickupEta: 'Ready for pickup today – tomorrow',
    doorEta: 'Delivered today – tomorrow',
  },
  {
    id: 'upcountry',
    label: 'Outside Kampala',
    areas: ['Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Mbale', 'Masaka', 'Lira', 'Arua', 'Fort Portal', 'Soroti', 'Hoima', 'Kabale'],
    pickupFee: 5000,
    doorFee: 9000,
    pickupEta: 'Ready for pickup in 1–3 business days',
    doorEta: 'Delivered in 1–3 business days',
  },
]

export const RETURN_POLICY = 'Free return within 7 days for eligible items — unused and in original packaging. Refund via mobile money within 48 hours of approval.'

export const PICKUP_STATIONS: Record<string, string> = {
  kampala: 'UG Souq Pickup Point — Kampala Road, Central Business District',
  upcountry: 'Nearest UG Souq partner agent in your town',
}
