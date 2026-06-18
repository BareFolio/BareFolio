/* Industry taxonomy for BareFolio's Company/Brand onboarding.
   A company picks the single industry it operates in. `SUGGESTED_INDUSTRIES`
   are surfaced as pills before the user searches; the full `INDUSTRIES` list
   backs the search box.

   The list leans toward sectors that routinely commission creative work —
   graphic design, photography, architecture, interior design, filmmaking and
   adjacent design fields — while staying broad enough to cover most companies.

   English names — the platform UI is English. Keep every name unique so it can
   be used directly as a React key. */

export const INDUSTRIES: string[] = [
  'Tech',
  'Software & SaaS',
  'Artificial Intelligence',
  'Gaming',
  'Fashion',
  'Apparel & Footwear',
  'Luxury Goods',
  'Jewelry & Watches',
  'Beauty',
  'Cosmetics & Skincare',
  'Health & Wellness',
  'Fitness',
  'Sports',
  'Finance',
  'Banking',
  'Insurance',
  'Real Estate',
  'Architecture & Construction',
  'Interior Design & Furniture',
  'Home & Decor',
  'Retail',
  'E-commerce',
  'Consumer Goods',
  'Food & Beverage',
  'Restaurants & Hospitality',
  'Travel & Tourism',
  'Hotels & Resorts',
  'Automotive',
  'Aviation & Aerospace',
  'Education',
  'Publishing & Media',
  'Film & Television',
  'Music & Audio',
  'Advertising & Marketing',
  'Entertainment',
  'Events & Experiences',
  'Arts & Culture',
  'Museums & Galleries',
  'Photography & Imaging',
  'Sustainability',
  'Energy & Environment',
  'Agriculture',
  'Restoration',
  'Manufacturing',
  'Logistics & Transportation',
  'Telecommunications',
  'Nonprofit & NGO',
  'Government & Public Sector',
  'Legal & Professional Services',
  'Pharmaceutical & Biotech',
  'Healthcare & Medical',
  'Childcare & Family',
  'Pets & Animals',
];

/* Curated set shown as pills before the user searches — mirrors the Figma
   suggestion order. */
export const SUGGESTED_INDUSTRIES: string[] = [
  'Tech',
  'Fashion',
  'Sports',
  'Health & Wellness',
  'Finance',
  'Education',
  'Sustainability',
  'Restoration',
  'Beauty',
  'Retail',
  'Food & Beverage',
  'Entertainment',
];
