/**
 * authStore Zustand store unit testləri.
 *
 * Test strukturu:
 *   - İlkin state boş olmalıdır (null token, null user)
 *   - setTokens accessToken və refreshToken-u saxlayır
 *   - logout state-i sıfırlayır
 *   - setUser user-i state-ə yazır
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/stores/authStore";

// localStorage-i mock edirik (jsdom bunu avtomatik edir, amma sıfırlamaq lazımdır)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useAuthStore", () => {
  beforeEach(() => {
    // Hər testdən əvvəl store-u sıfırlayırıq
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
    });
    localStorageMock.clear();
  });

  it("ilkin state-də token və user null olmalıdır", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setTokens access və refresh token-ları saxlayır", () => {
    const { setTokens } = useAuthStore.getState();
    setTokens("access-abc", "refresh-xyz");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-abc");
    expect(state.refreshToken).toBe("refresh-xyz");
    // localStorage-ə də yazılmalıdır
    expect(localStorageMock.getItem("access_token")).toBe("access-abc");
  });

  it("setUser user state-ini yeniləyir", () => {
    const { setUser } = useAuthStore.getState();
    const mockUser = {
      id: "u-1",
      email: "test@test.az",
      full_name: "Test User",
      role: "org_admin",
      tenant_id: "t-1",
    };
    setUser(mockUser);

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("logout state-i sıfırlayır və localStorage-dən siliir", () => {
    const { setTokens, logout } = useAuthStore.getState();
    setTokens("access-abc", "refresh-xyz");
    expect(localStorageMock.getItem("access_token")).toBe("access-abc");

    logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorageMock.getItem("access_token")).toBeNull();
  });

  it("setHasHydrated _hasHydrated-i yeniləyir", () => {
    const { setHasHydrated } = useAuthStore.getState();
    expect(useAuthStore.getState()._hasHydrated).toBe(false);
    setHasHydrated(true);
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
  });
});
