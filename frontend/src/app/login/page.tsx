"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, fetchUser, accessToken, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && accessToken && mounted) {
      router.replace("/dashboard");
    }
  }, [_hasHydrated, accessToken, router, mounted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new URLSearchParams({ username: email, password });
      const { data } = await apiClient.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      
      setTokens(data.access_token, data.refresh_token);
      await fetchUser();
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "E-mail və ya şifrə yanlışdır";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Prevent hydration mismatch by not rendering the form until mounted on client
  // Background and shell remain for better UX
  const renderForm = mounted;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Xoş Gəlmisiniz</h1>
          <p className="text-gray-400 mt-2">ANBAR sisteminə daxil olun</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          {renderForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
                <div className="relative group" suppressHydrationWarning>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="nümunə@anbar.az"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-gray-300">Şifrə</label>
                  <button type="button" className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors">
                    Şifrəni unutmusunuz?
                  </button>
                </div>
                <div className="relative group" suppressHydrationWarning>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-white/10 text-white pl-12 pr-12 py-3.5 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Daxil ol
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-8">
            Hesabınız yoxdur?{" "}
            <button className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
              Qeydiyyatdan keçin
            </button>
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-xs">
            © 2026 ANBAR. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </main>
  );
}
