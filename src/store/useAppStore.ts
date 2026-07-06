import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface AppState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Toast System
  toasts: ToastMessage[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      isSidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

      // Toast implementation
      toasts: [],
      addToast: (message, type = "success") => {
        const id = Math.random().toString(36).slice(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, type, message }],
        }));
        // Auto-remove after 4 seconds
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 4000);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "app-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({
        theme: state.theme,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }), // only persist theme and sidebar collapse state
    },
  ),
);
