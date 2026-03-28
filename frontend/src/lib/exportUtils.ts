import { useAuthStore } from "@/stores/authStore";

export async function downloadExport(endpoint: string, filename: string): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Export uğursuz oldu");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
