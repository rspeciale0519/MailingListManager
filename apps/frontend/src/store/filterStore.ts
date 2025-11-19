import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContactFilters } from '@/types';

interface SavedFilter {
  id: string;
  name: string;
  filters: ContactFilters;
  pinned: boolean;
  created_at: string;
}

interface FilterState {
  // Current active filters
  currentFilters: ContactFilters;

  // Saved filters
  savedFilters: SavedFilter[];

  // Layout presets (column visibility, order, widths)
  layoutPresets: Record<string, unknown>;

  // Actions
  setCurrentFilters: (filters: ContactFilters) => void;
  resetCurrentFilters: () => void;

  saveFilter: (name: string, filters: ContactFilters, pinned?: boolean) => void;
  deleteFilter: (id: string) => void;
  updateFilter: (id: string, updates: Partial<SavedFilter>) => void;
  loadFilter: (id: string) => void;

  saveLayoutPreset: (name: string, layout: Record<string, unknown>) => void;
  loadLayoutPreset: (name: string) => Record<string, unknown> | null;
  deleteLayoutPreset: (name: string) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      currentFilters: {},
      savedFilters: [],
      layoutPresets: {},

      setCurrentFilters: (filters) => set({ currentFilters: filters }),

      resetCurrentFilters: () => set({ currentFilters: {} }),

      saveFilter: (name, filters, pinned = false) =>
        set((state) => ({
          savedFilters: [
            ...state.savedFilters,
            {
              id: `filter-${Date.now()}`,
              name,
              filters,
              pinned,
              created_at: new Date().toISOString(),
            },
          ],
        })),

      deleteFilter: (id) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        })),

      updateFilter: (id, updates) =>
        set((state) => ({
          savedFilters: state.savedFilters.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      loadFilter: (id) => {
        const filter = get().savedFilters.find((f) => f.id === id);
        if (filter) {
          set({ currentFilters: filter.filters });
        }
      },

      saveLayoutPreset: (name, layout) =>
        set((state) => ({
          layoutPresets: {
            ...state.layoutPresets,
            [name]: layout,
          },
        })),

      loadLayoutPreset: (name) => {
        return get().layoutPresets[name] as Record<string, unknown> || null;
      },

      deleteLayoutPreset: (name) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [name]: _deleted, ...rest } = state.layoutPresets;
          return { layoutPresets: rest };
        }),
    }),
    {
      name: 'filter-storage',
    }
  )
);
