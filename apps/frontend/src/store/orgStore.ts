import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Org, OrgDetails } from '@/types';

interface OrgState {
  currentOrg: Org | null;
  currentOrgDetails: OrgDetails | null;
  orgs: Org[];

  // Actions
  setCurrentOrg: (org: Org) => void;
  setCurrentOrgDetails: (details: OrgDetails) => void;
  setOrgs: (orgs: Org[]) => void;
  clearOrg: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      currentOrgDetails: null,
      orgs: [],

      setCurrentOrg: (org) => set({ currentOrg: org }),

      setCurrentOrgDetails: (details) => set({ currentOrgDetails: details }),

      setOrgs: (orgs) => {
        set({ orgs });
        // Auto-select first org if none selected
        set((state) => ({
          currentOrg: state.currentOrg || orgs[0] || null,
        }));
      },

      clearOrg: () =>
        set({
          currentOrg: null,
          currentOrgDetails: null,
        }),
    }),
    {
      name: 'org-storage',
      partialize: (state) => ({
        currentOrg: state.currentOrg,
        orgs: state.orgs,
      }),
    }
  )
);
