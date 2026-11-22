/** Build an optimized Unsplash URL (used for starter content only; admin uploads replace these). */
export const unsplash = (id, w = 1600, q = 75) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`

/** Return a resized variant for Unsplash URLs; pass-through for Firebase Storage URLs. */
export function sized(url, w = 1200) {
  if (!url) return url
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url)
      u.searchParams.set('w', String(w))
      u.searchParams.set('auto', 'format')
      return u.toString()
    } catch {
      return url
    }
  }
  return url
}

export function srcSet(url, widths = [480, 800, 1200, 1800]) {
  if (!url?.includes('images.unsplash.com')) return undefined
  return widths.map((w) => `${sized(url, w)} ${w}w`).join(', ')
}

export const IMG = {
  field: 'photo-1500382017468-9049fed747ef',
  poolGarden: 'photo-1576013551627-0cc20b96c2a7',
  poolVilla: 'photo-1582268611958-ebfd161ef9cf',
  houseTrees: 'photo-1449844908441-8829872d2607',
  cottage: 'photo-1518780664697-55e3ad937233',
  lodge: 'photo-1510798831971-661eb04b3739',
  housePool: 'photo-1564013799919-ab600027ffc6',
  houseDusk: 'photo-1600585154340-be6161a56a0c',
  resortPool: 'photo-1571896349842-33c89424de2d',
  resortPool2: 'photo-1566073771259-6a8506099945',
  resortPool3: 'photo-1540541338287-41700207dee6',
  bedroom: 'photo-1505693416388-ac5ce068fe85',
  bedroom2: 'photo-1590490360182-c33d57733427',
  bedroom3: 'photo-1611892440504-42a792e24d32',
  bedroom4: 'photo-1507089947368-19c1da9775ae',
  living: 'photo-1586023492125-27b2c045efd7',
  living2: 'photo-1600210492486-724fe5c67fb0',
  living3: 'photo-1600607687939-ce8a6c25118c',
  interior: 'photo-1560448204-e02f11c3d0e2',
  dining: 'photo-1414235077428-338989a2e8c0',
  tableSetting: 'photo-1511795409834-ef04bbd61622',
  restaurant: 'photo-1517248135467-4c7edcad34c4',
  bonfire: 'photo-1475483768296-6163e08872a1',
  gardening: 'photo-1416879595882-3373a0480b5b',
  gardenPavilion: 'photo-1523438885200-e635ba2c371e',
  eventTable: 'photo-1464366400600-7168b8af9bc3',
  balloons: 'photo-1530103862676-de8c9debad1d',
  party: 'photo-1517457373958-b7bdd4587205',
  forestStars: 'photo-1470246973918-29a93221c455',
}
