export type PackageCategory = 'adventure' | 'relax' | 'culture';

export type ServiceLevel = 'standard' | 'premium';

export interface TravelPackage {
  id: string;
  name: string;
  destination: string;
  durationDays: number;
  price: number;
  description: string;
  highlights: string[];
  category: PackageCategory;
  serviceLevel: ServiceLevel;
  rating: number;
  slotsAvailable: number;
  image: string;
}
