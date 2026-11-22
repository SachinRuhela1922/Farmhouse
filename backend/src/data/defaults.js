import { IMG, unsplash } from './images.js'

/**
 * Fallback site settings. The live values come from Firestore `siteSettings/main`
 * (editable in Admin → Website Content / Settings). These defaults are used until
 * an admin saves settings, and as the starter content for "Install starter content".
 */
export const DEFAULT_SETTINGS = {
  businessName: 'Willowmere Farmhouse',
  tagline: 'A private countryside retreat',
  logoUrl: '',
  announcement: { enabled: true, text: 'Monsoon escapes are open — book 3 nights and enjoy a complimentary farm breakfast.', link: '/booking' },
  hero: {
    eyebrow: 'Private farmhouse · Pool villas · Garden dining',
    heading: 'Slow mornings, golden fields, and a home that is entirely yours.',
    subtitle: 'Twelve acres of orchards and lawns, a sunlit pool and handcrafted villas, an hour from the city.',
    images: [{ url: unsplash(IMG.poolGarden, 2400) }, { url: unsplash(IMG.field, 2400) }],
    videoUrl: '',
  },
  about: {
    heading: 'A farmhouse shaped by the land around it',
    body: 'Willowmere began as a family orchard. Today it is a quiet, private retreat where long lunches stretch into bonfire evenings, children run barefoot across the lawns, and every stay is hosted with genuine warmth.',
    story: 'What started in 1998 as a mango and guava orchard slowly became the place our family gathered every weekend. In 2019 we restored the old farmhouse with local stone, reclaimed teak and wide verandahs — and opened its doors to guests who wanted the same feeling: unhurried time together, far from the city, without giving up comfort.',
    mission: 'To offer unhurried, private stays rooted in nature, local food and heartfelt hospitality.',
    vision: 'To be the most-loved countryside retreat for families and friends who value time together.',
    surroundings: 'The estate is bordered by mango orchards and seasonal streams. Mornings bring peacocks and birdsong; evenings bring wide skies and starlight. A short drive takes you to lakeside trails, heritage temples and organic farms.',
    hospitality: 'A resident caretaker and chef look after every stay — from home-style breakfasts to bonfire dinners — while giving you all the privacy of your own home.',
    image: unsplash(IMG.houseTrees, 1600),
    stats: [
      { value: '12', label: 'Acres of orchard' },
      { value: '4', label: 'Private villas' },
      { value: '2.4k+', label: 'Happy guests' },
      { value: '4.9', label: 'Average rating' },
    ],
  },
  highlights: [
    { icon: 'Waves', title: 'Sunlit pool', text: 'A 40-ft pool set among frangipani and lawn loungers.' },
    { icon: 'Trees', title: '12-acre estate', text: 'Orchards, walking paths and wide open lawns.' },
    { icon: 'UtensilsCrossed', title: 'Farm-to-table', text: 'Home-style meals from our resident chef.' },
    { icon: 'ShieldCheck', title: 'Entirely private', text: 'The estate is reserved only for your group.' },
  ],
  whyChooseUs: [
    { icon: 'Sparkles', title: 'Thoughtfully restored', text: 'Local stone, reclaimed teak and linen — designed for slow living.' },
    { icon: 'HeartHandshake', title: 'Warm, discreet hosting', text: 'A caretaker on call, never in the way.' },
    { icon: 'BadgeCheck', title: 'Transparent pricing', text: 'All taxes and charges shown before you book. No surprises.' },
    { icon: 'CalendarCheck', title: 'Flexible celebrations', text: 'Birthdays, reunions and offsites — we help plan every detail.' },
  ],
  team: [
    { name: 'Ananya Rao', role: 'Founder & Host', image: '' },
    { name: 'Ravi Kumar', role: 'Estate Manager', image: '' },
    { name: 'Meera Pillai', role: 'Head Chef', image: '' },
  ],
  videoShowcase: {
    title: 'A day at Willowmere',
    subtitle: 'From the first cup of filter coffee to the last ember of the bonfire.',
    videoUrl: '',
    posterUrl: unsplash(IMG.resortPool3, 2000),
  },
  contact: {
    phone: '+91 98765 43210',
    email: 'stay@willowmere.example',
    whatsapp: '919876543210',
    address: 'Willowmere Farmhouse, Survey No. 42, Orchard Road, Near Lake View, Bengaluru Rural, Karnataka 562123',
    mapQuery: 'Bengaluru Rural, Karnataka',
    businessHours: [
      { day: 'Monday – Friday', hours: '9:00 AM – 8:00 PM' },
      { day: 'Saturday – Sunday', hours: '8:00 AM – 9:00 PM' },
    ],
  },
  socialLinks: { instagram: 'https://instagram.com', facebook: 'https://facebook.com', youtube: 'https://youtube.com', twitter: '' },
  instagram: {
    handle: '@willowmere.farmhouse',
    images: [IMG.poolGarden, IMG.tableSetting, IMG.bedroom, IMG.bonfire, IMG.gardenPavilion, IMG.living].map((id) => unsplash(id, 600)),
  },
  footer: {
    text: 'A private farmhouse retreat for families, friends and celebrations — an hour from the city, a world away.',
    copyright: 'Willowmere Farmhouse. All rights reserved.',
  },
  pricingHighlights: [
    { title: 'Weekday escape', price: 'From ₹14,500', note: 'per night, Mon–Thu', features: ['Up to 8 guests', 'Breakfast included', 'Pool & lawn access'] },
    { title: 'Weekend retreat', price: 'From ₹18,500', note: 'per night, Fri–Sun', features: ['Up to 12 guests', 'Bonfire evening', 'Chef on call'], featured: true },
    { title: 'Celebrations', price: 'Custom', note: 'birthdays & events', features: ['Décor & catering', 'Up to 60 day guests', 'Dedicated planner'] },
  ],
  bookingSettings: {
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    minNights: 1,
    maxNights: 14,
    maxAdvanceDays: 365,
    checkInTime: '1:00 PM',
    checkOutTime: '11:00 AM',
    advancePaymentPercent: 30,
    requireVerifiedEmail: true,
    cancellationPolicy: 'Free cancellation up to 7 days before check-in. Within 7 days, the advance is non-refundable.',
    services: [
      { id: 'breakfast', name: 'Farm breakfast', price: 450, unit: 'per_guest_night' },
      { id: 'bonfire', name: 'Bonfire & barbecue evening', price: 3500, unit: 'per_booking' },
      { id: 'decor', name: 'Celebration décor', price: 6000, unit: 'per_booking' },
      { id: 'pickup', name: 'Airport / city pickup', price: 2500, unit: 'per_booking' },
    ],
  },
  taxSettings: { taxLabel: 'GST', taxPercent: 12, serviceChargePercent: 5, cleaningFee: 1000 },
  galleryCategories: ['Exterior', 'Rooms', 'Pool', 'Dining', 'Events', 'Nature'],
}

export const STARTER_ACCOMMODATIONS = [
  {
    name: 'The Whole Farmhouse',
    slug: 'the-whole-farmhouse',
    shortDescription: 'The entire estate, privately yours — four bedrooms, pool, lawns and the orchard.',
    description: 'Reserve all of Willowmere for your group. The restored main house opens onto a wide verandah, a 40-ft pool and two acres of lawn. Four ensuite bedrooms, a farmhouse kitchen and a resident chef make it ideal for family reunions and celebrations.',
    pricePerNight: 18500, weekendPrice: 22500, capacity: 12, bedrooms: 4, bathrooms: 4,
    amenities: ['Private pool', 'Wi-Fi', 'Air conditioning', 'Parking', 'Kitchen', 'BBQ grill', 'Garden', 'Power backup', 'Caretaker', 'Bonfire area', 'Music system'],
    images: [IMG.poolGarden, IMG.living2, IMG.bedroom, IMG.tableSetting].map((id) => ({ url: unsplash(id, 1800) })),
    displayOrder: 0, isActive: true,
  },
  {
    name: 'Orchard Pool Villa',
    slug: 'orchard-pool-villa',
    shortDescription: 'A two-bedroom villa with a plunge pool, tucked into the mango orchard.',
    description: 'Glass doors fold open from the bedrooms to a private plunge pool and sun deck. Hand-loomed linens, a reading nook and an outdoor rain shower make this our most romantic stay.',
    pricePerNight: 12500, weekendPrice: 14500, capacity: 5, bedrooms: 2, bathrooms: 2,
    amenities: ['Private pool', 'Wi-Fi', 'Air conditioning', 'Smart TV', 'Hot water', 'Breakfast', 'Outdoor seating'],
    images: [IMG.poolVilla, IMG.bedroom2, IMG.living].map((id) => ({ url: unsplash(id, 1800) })),
    displayOrder: 1, isActive: true,
  },
  {
    name: 'Garden Cottage',
    slug: 'garden-cottage',
    shortDescription: 'A cosy stone cottage beside the kitchen garden — perfect for couples.',
    description: 'Thick stone walls keep the cottage cool in summer and snug in the monsoon. Wake up to the kitchen garden, pick your own herbs and enjoy breakfast on the porch.',
    pricePerNight: 6500, weekendPrice: 7500, capacity: 3, bedrooms: 1, bathrooms: 1,
    amenities: ['Wi-Fi', 'Air conditioning', 'Garden', 'Hot water', 'Breakfast', 'Pet friendly'],
    images: [IMG.cottage, IMG.bedroom3, IMG.gardening].map((id) => ({ url: unsplash(id, 1800) })),
    displayOrder: 2, isActive: true,
  },
  {
    name: 'Lakeside Lodge',
    slug: 'lakeside-lodge',
    shortDescription: 'Timber lodge with a fireplace and three bedrooms for larger families.',
    description: 'A timber-framed lodge with vaulted ceilings, a stone fireplace and a long dining table for twelve. Bunk room for the children, a games corner and a wide deck overlooking the orchard.',
    pricePerNight: 14500, weekendPrice: 16500, capacity: 8, bedrooms: 3, bathrooms: 3,
    amenities: ['Wi-Fi', 'Air conditioning', 'Kitchen', 'Indoor games', 'Parking', 'Bonfire area', 'Lawn'],
    images: [IMG.lodge, IMG.bedroom4, IMG.living3].map((id) => ({ url: unsplash(id, 1800) })),
    displayOrder: 3, isActive: true,
  },
]

const exp = (title, description, img, price, icon, category, order) => ({
  title, description, image: unsplash(img, 1400), price, icon, category, displayOrder: order, isActive: true,
})
export const STARTER_EXPERIENCES = [
  exp('Swimming pool', 'A sunlit 40-ft pool with loungers, shaded cabanas and a shallow end for children.', IMG.resortPool, 0, 'Waves', 'Leisure', 0),
  exp('Outdoor dining', 'Long-table lunches under the mango trees, cooked by our chef with produce from the farm.', IMG.dining, 1200, 'UtensilsCrossed', 'Dining', 1),
  exp('Bonfire evenings', 'Stories, music and barbecue around a crackling bonfire under open skies.', IMG.bonfire, 3500, 'Flame', 'Leisure', 2),
  exp('Kitchen garden', 'Walk the organic kitchen garden, pick herbs and learn from our gardener.', IMG.gardening, 0, 'Sprout', 'Nature', 3),
  exp('Birthday celebrations', 'Décor, cake, music and a menu built around your celebration.', IMG.balloons, 6000, 'Cake', 'Celebrations', 4),
  exp('Private parties', 'Host up to 60 day guests on the lawns with lighting, sound and catering.', IMG.party, 25000, 'PartyPopper', 'Celebrations', 5),
  exp('Family gatherings', 'Reunions and milestone anniversaries with space for every generation.', IMG.tableSetting, 0, 'Users', 'Celebrations', 6),
  exp('Corporate offsites', 'Wi-Fi, projector, breakout lawns and team activities for up to 30 people.', IMG.eventTable, 1500, 'Briefcase', 'Corporate', 7),
  exp('Photography shoots', 'Pre-wedding, maternity and brand shoots across the pavilion, pool and orchard.', IMG.gardenPavilion, 8000, 'Camera', 'Events', 8),
  exp('Indoor & outdoor games', 'Badminton, cricket, carrom, board games and a children’s play corner.', IMG.living2, 0, 'Dice5', 'Leisure', 9),
]

export const STARTER_GALLERY = [
  [IMG.poolGarden, 'Pool', 'The pool at golden hour'],
  [IMG.houseTrees, 'Exterior', 'Morning light on the farmhouse'],
  [IMG.bedroom, 'Rooms', 'Master bedroom'],
  [IMG.tableSetting, 'Dining', 'Garden lunch table'],
  [IMG.field, 'Nature', 'Fields at sunset'],
  [IMG.living2, 'Rooms', 'The living room'],
  [IMG.bonfire, 'Events', 'Bonfire evening'],
  [IMG.poolVilla, 'Pool', 'Orchard pool villa'],
  [IMG.gardenPavilion, 'Events', 'The garden pavilion'],
  [IMG.lodge, 'Exterior', 'Lakeside lodge'],
  [IMG.dining, 'Dining', 'Chef’s tasting menu'],
  [IMG.forestStars, 'Nature', 'Starlit nights'],
].map(([id, category, title], i) => ({ type: 'image', imageUrl: unsplash(id, 1600), category, title, displayOrder: i, isActive: true }))

export const STARTER_TESTIMONIALS = [
  { guestName: 'Priya & Arjun', location: 'Bengaluru', review: 'We celebrated my parents’ 40th anniversary here. The team handled every detail — the bonfire dinner was unforgettable.', rating: 5, isPublished: true, displayOrder: 0 },
  { guestName: 'Rahul Menon', location: 'Chennai', review: 'Beautifully restored, spotless and genuinely private. The kids didn’t want to leave the pool.', rating: 5, isPublished: true, displayOrder: 1 },
  { guestName: 'Sneha Kapoor', location: 'Mumbai', review: 'The food alone is worth the trip. Breakfasts on the verandah were the highlight of our weekend.', rating: 5, isPublished: true, displayOrder: 2 },
  { guestName: 'Team Brightloop', location: 'Corporate offsite', review: 'Perfect for our 20-person offsite — fast Wi-Fi, great spaces to work, and evenings by the fire.', rating: 4, isPublished: true, displayOrder: 3 },
]

export const STARTER_FAQS = [
  ['What are the check-in and check-out times?', 'Check-in is from 1:00 PM and check-out is by 11:00 AM. Early check-in or late check-out can be arranged on request, subject to availability.'],
  ['Is the property entirely private?', 'Yes. When you book The Whole Farmhouse, the estate is reserved exclusively for your group. Individual villas share the grounds with at most three other private units.'],
  ['Are meals included?', 'Breakfast can be added at checkout. Lunch and dinner are prepared by our resident chef on request and billed separately.'],
  ['Can we host a party or celebration?', 'Absolutely. Birthdays, anniversaries and private parties are welcome. Please mention the details in your booking so we can plan décor, music and catering.'],
  ['Are pets allowed?', 'Well-behaved pets are welcome in the Garden Cottage. Please let us know in advance.'],
  ['What is the cancellation policy?', 'Free cancellation up to 7 days before check-in. Within 7 days of arrival, the advance payment is non-refundable.'],
  ['How do I pay?', 'You can pay an advance or the full amount securely online once your booking is confirmed. We accept UPI, cards and net banking.'],
].map(([question, answer], i) => ({ question, answer, displayOrder: i, isActive: true }))
