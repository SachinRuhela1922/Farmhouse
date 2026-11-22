import {
  Waves, Trees, UtensilsCrossed, ShieldCheck, Sparkles, HeartHandshake, BadgeCheck, CalendarCheck, Flame, Sprout,
  Cake, PartyPopper, Users, Briefcase, Camera, Dice5, Wifi, AirVent, Car, Tv, CookingPot, Flower2, Zap, UserRound,
  Music, ShowerHead, PawPrint, Coffee, Armchair, Cctv, Star, Leaf, Sun, Mountain, Bike, Gift, Wine, Check,
} from 'lucide-react'

/** Curated icon registry so CMS content can reference icons by name without bundling all of lucide. */
export const ICONS = {
  Waves, Trees, UtensilsCrossed, ShieldCheck, Sparkles, HeartHandshake, BadgeCheck, CalendarCheck, Flame, Sprout,
  Cake, PartyPopper, Users, Briefcase, Camera, Dice5, Wifi, AirVent, Car, Tv, CookingPot, Flower2, Zap, UserRound,
  Music, ShowerHead, PawPrint, Coffee, Armchair, Cctv, Star, Leaf, Sun, Mountain, Bike, Gift, Wine, Check,
}

export const AMENITY_ICON = {
  'Private pool': 'Waves', 'Wi-Fi': 'Wifi', 'Air conditioning': 'AirVent', Parking: 'Car', 'Smart TV': 'Tv',
  Kitchen: 'CookingPot', 'BBQ grill': 'Flame', Garden: 'Flower2', 'Power backup': 'Zap', Caretaker: 'UserRound',
  'Bonfire area': 'Flame', 'Music system': 'Music', 'Hot water': 'ShowerHead', 'Pet friendly': 'PawPrint',
  Breakfast: 'Coffee', 'Indoor games': 'Dice5', 'Outdoor seating': 'Armchair', CCTV: 'Cctv', Lawn: 'Trees',
}

export function Icon({ name, fallback = 'Leaf', ...props }) {
  const C = ICONS[name] || ICONS[fallback]
  return <C {...props} />
}
