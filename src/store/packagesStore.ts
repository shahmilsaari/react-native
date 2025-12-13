import { create } from 'zustand';

import { packages as seedPackages } from '@/data/packages';
import { TravelPackage } from '@/types';

type PackagesState = {
  packages: TravelPackage[];
  featuredId?: string;
  refreshPackages: () => Promise<void>;
};

export const usePackagesStore = create<PackagesState>((set) => ({
  packages: seedPackages,
  featuredId: seedPackages[0]?.id,
  refreshPackages: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ packages: seedPackages });
  }
}));
