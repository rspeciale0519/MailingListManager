import { create } from 'zustand';

interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface Modal {
  id: string;
  type: string;
  props?: Record<string, unknown>;
}

interface UiState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Toasts
  toasts: Toast[];

  // Modals
  modals: Modal[];

  // Loading states
  globalLoading: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  setGlobalLoading: (loading: boolean) => void;
}

let toastCounter = 0;
let modalCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  toasts: [],
  modals: [],
  globalLoading: false,

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Toast actions
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${toastCounter++}`,
          duration: toast.duration || 5000,
        },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modal actions
  openModal: (modal) =>
    set((state) => ({
      modals: [...state.modals, { ...modal, id: `modal-${modalCounter++}` }],
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    })),

  closeAllModals: () => set({ modals: [] }),

  // Loading actions
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));

// Convenience hook for toasts
export const useToast = () => {
  const addToast = useUiStore((state) => state.addToast);

  const toast = {
    success: (description: string, title?: string) =>
      addToast({ title, description, variant: 'success' }),

    error: (description: string, title?: string) =>
      addToast({ title, description, variant: 'destructive' }),

    info: (description: string, title?: string) =>
      addToast({ title, description, variant: 'default' }),
  };

  return toast;
};
