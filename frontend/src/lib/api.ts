import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh state — eyni anda birdən çox refresh sorğusunu önləyir
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

function clearAuthAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("anbar-auth");
  window.location.href = "/login";
}

// 401 → refresh cəhdi → retry; uğursuzsa logout
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      original._retry ||
      typeof window === "undefined"
    ) {
      return Promise.reject(error);
    }

    // /auth/refresh endpoint-i özü 401 verərsə → sonsuz loop olmur
    if (original.url?.includes("/auth/refresh")) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Başqa bir refresh gedir — növbəyə gir
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      const { data } = await apiClient.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const newToken: string = data.access_token;

      localStorage.setItem("access_token", newToken);
      document.cookie = `access_token=${newToken}; path=/; SameSite=Strict; max-age=1800`;

      // Zustand store-u da yenilə (əgər mövcuddursa)
      const raw = localStorage.getItem("anbar-auth");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          parsed.state.accessToken = newToken;
          localStorage.setItem("anbar-auth", JSON.stringify(parsed));
        } catch {
          // parse xətasına baxma
        }
      }

      flushQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
