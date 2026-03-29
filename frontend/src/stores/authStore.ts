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
  last_login: string | null;
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
  logout: () => Promise<void>;
}

// Cookie max-age backend config ilə sinxron — ACCESS_TOKEN_EXPIRE_MINUTES = 30 → 1800s
const COOKIE_MAX_AGE = 1800;

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
          document.cookie = `access_token=${access}; path=/; SameSite=Strict; max-age=${COOKIE_MAX_AGE}`;
        }
      },
      setUser: (user) => set({ user }),
      fetchUser: async () => {
        try {
          const { data } = await apiClient.get("/auth/me");
          set({ user: data });
        } catch (error) {
          console.error("Failed to fetch user:", error);
          await get().logout();
        }
      },
      logout: async () => {
        // Backend-dən refresh token-i revoke et
        const refreshToken = get().refreshToken;
        if (refreshToken) {
          try {
            await apiClient.post("/auth/logout", {
              refresh_token: refreshToken,
            });
          } catch {
            // Logout request uğursuz olsa da, client-side təmizlik davam edir
          }
        }

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
          document.cookie = `access_token=${hydratedState.accessToken}; path=/; SameSite=Strict; max-age=${COOKIE_MAX_AGE}`;
        }
      },
    }
  )
);
