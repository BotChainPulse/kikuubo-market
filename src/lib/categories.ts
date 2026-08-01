// Single source of truth for categories — used by buyers (browse) and sellers (listing form)
export const CATEGORIES = [
  { slug: 'phones', name: 'Phones & Accessories' },
  { slug: 'electronics', name: 'Electronics & TVs' },
  { slug: 'refurbished', name: 'Refurbished Tech' },
  { slug: 'appliances', name: 'Appliances' },
  { slug: 'home', name: 'Home & Kitchen' },
  { slug: 'furniture', name: 'Furniture' },
  { slug: 'mens-fashion', name: "Men's Fashion" },
  { slug: 'womens-fashion', name: "Women's Fashion" },
  { slug: 'shoes', name: 'Shoes & Sneakers' },
  { slug: 'beauty', name: 'Beauty & Health' },
  { slug: 'agriculture', name: 'Farm Produce (Fruits & Vegetables)' },
  { slug: 'solar', name: 'Smart Home & Solar' },
  { slug: 'tools', name: 'Tools & Improvement' },
  { slug: 'office', name: 'Office & School' },
  { slug: 'sports', name: 'Sports & Outdoors' },
  { slug: 'baby', name: 'Baby & Maternity' },
  { slug: 'toys', name: 'Toys & Games' },
  { slug: 'pets', name: 'Pet Supplies' },
  { slug: 'grocery', name: 'Food & Grocery' },
  { slug: 'boda-auto', name: 'Automotive & Boda' },
  { slug: 'books', name: 'Books & Media' },
  { slug: 'other', name: 'Other' },
] as const

export type CategorySlug = (typeof CATEGORIES)[number]['slug']

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug
}
