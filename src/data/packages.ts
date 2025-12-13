import { TravelPackage } from '@/types';

export const packages: TravelPackage[] = [
  {
    id: 'pkg-rome-culture',
    name: 'Rome Culture Quest',
    destination: 'Rome, Italy',
    durationDays: 5,
    price: 1299,
    description:
      'Experience the timeless art, architecture, and culinary scenes of Rome with curated walking tours and chef led classes.',
    highlights: [
      'Guided visit of the Vatican Museums before opening hours',
      'Hands-on pasta workshop with a Michelin-star chef',
      'Sunset rooftop aperitivo overlooking the Colosseum'
    ],
    category: 'culture',
    serviceLevel: 'premium',
    rating: 4.9,
    slotsAvailable: 6,
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=60'
  },
  {
    id: 'pkg-bali-retreat',
    name: 'Bali Wellness Retreat',
    destination: 'Ubud, Bali',
    durationDays: 7,
    price: 1590,
    description:
      'Mindful escape surrounded by verdant rice fields, daily spa rituals, and chef-crafted plant-based menus.',
    highlights: [
      'Morning yoga and meditation with local gurus',
      'Private waterfall trek and purification ritual',
      'Unlimited spa access with bespoke treatments'
    ],
    category: 'relax',
    serviceLevel: 'premium',
    rating: 4.8,
    slotsAvailable: 10,
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=60'
  },
  {
    id: 'pkg-patagonia-expedition',
    name: 'Patagonia Expedition',
    destination: 'El Chaltén, Argentina',
    durationDays: 8,
    price: 2199,
    description:
      'Traverse glaciers, azure lakes, and granite towers with certified mountain guides and sustainable camps.',
    highlights: [
      'Glacier trekking with crampon training',
      'Helicopter overview of Fitz Roy massif',
      'Chef-prepared camp meals with local Patagonian flavors'
    ],
    category: 'adventure',
    serviceLevel: 'standard',
    rating: 4.7,
    slotsAvailable: 4,
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=600&q=60'
  }
];
