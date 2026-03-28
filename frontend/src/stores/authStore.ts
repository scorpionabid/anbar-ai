import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  permissions: string[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),
      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);
          // Middleware cookie oxuduğu üçün cookie-yə də yazırıq (SameSite=Strict)
          document.cookie = `access_token=${access}; path=/; SameSite=Strict; max-age=1800`;
        }
      },
      setUser: (user) => set({ user }),
      fetchUser: async () => {
        try {
          const { data } = await apiClient.get("/auth/me");
          set({ user: data });
        } catch (error) {
          console.error("Failed to fetch user:", error);
          get().logout();
        }
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          document.cookie = "access_token=; path=/; max-age=0";
        }
      },
    }),
    {
      name: "anbar-auth",
      partialize: (state: AuthState) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (hydratedState) => {
        if (!hydratedState) return;
        hydratedState.setHasHydrated(true);
        // localStorage-dan yüklənən token varsa cookie-ni bərpa et (middleware üçün)
        if (hydratedState.accessToken && typeof window !== "undefined") {
          document.cookie = `access_token=${hydratedState.accessToken}; path=/; SameSite=Strict; max-age=1800`;
        }
      },
    }
  )
);
