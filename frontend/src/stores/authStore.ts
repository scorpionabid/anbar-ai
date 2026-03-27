import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
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
        }
      },
    }),
    {
      name: "anbar-auth",
      onRehydrateStorage: () => (state: AuthState | undefined) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
