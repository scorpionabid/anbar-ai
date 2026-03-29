"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Radio, 
  Search, 
  Filter, 
  Download, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Store, 
  ShoppingBag, 
  ShoppingCart, 
  Globe, 
  Tag, 
  Settings, 
  User,
  LayoutGrid
} from "lucide-react";
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from "@/hooks/useChannels";
import type { Channel, ChannelType } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import dynamic from "next/dynamic";
const Modal = dynamic(() => import("@/components/ui/Modal").then(m => m.Modal), { 
  ssr: false,
  loading: () => <p className="p-4 text-sm text-muted-foreground animate-pulse">Modal yüklənir...</p> 
});

// ── Channel type configuration ────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<ChannelType, { label: string; icon: any; color: string }> = {
  manual: { label: "Əl ilə", icon: User, color: "text-blue-400" },
  shopify: { label: "Shopify", icon: Store, color: "text-green-400" },
  woocommerce: { label: "WooCommerce", icon: ShoppingBag, color: "text-purple-400" },
  trendyol: { label: "Trendyol", icon: ShoppingCart, color: "text-orange-400" },
  amazon: { label: "Amazon", icon: Globe, color: "text-yellow-400" },
  ebay: { label: "eBay", icon: Tag, color: "text-red-400" },
  custom: { label: "Digər", icon: Settings, color: "text-gray-400" },
  store: { label: "Mağaza", icon: Store, color: "text-cyan-400" },
  marketplace: { label: "Marketplace", icon: ShoppingBag, color: "text-indigo-400" },
  wholesale: { label: "Topdan", icon: Globe, color: "text-teal-400" },
  api: { label: "API", icon: Settings, color: "text-slate-400" },
};

const CHANNEL_TYPE_OPTIONS: { value: ChannelType; label: string }[] = Object.entries(CHANNEL_CONFIG).map(
  ([key, cfg]) => ({ value: key as ChannelType, label: cfg.label })
);

// ── Form type ─────────────────────────────────────────────────────────────────

interface ChannelForm {
  name: string;
  channel_type: ChannelType;
  is_active: boolean;
}

const emptyForm: ChannelForm = {
  name: "",
  channel_type: "manual",
  is_active: true,
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const { data: channels, isLoading, isError } = useChannels({
    search: search || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Channel | null>(null);
  const [form, setForm] = useState<ChannelForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    if (!channels) return { total: 0, active: 0, inactive: 0 };
    return {
      total: channels.length,
      active: channels.filter((c) => c.is_active).length,
      inactive: channels.filter((c) => !c.is_active).length,
    };
  }, [channels]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(channel: Channel) {
    setEditTarget(channel);
    setForm({
      name: channel.name,
      channel_type: channel.channel_type,
      is_active: channel.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Kanal adı mütləqdir.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      channel_type: form.channel_type,
      is_active: form.is_active,
    };

    try {
      if (editTarget) {
        await updateChannel.mutateAsync({ id: editTarget.id, payload });
      } else {
        await createChannel.mutateAsync(payload);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteChannel.mutateAsync(id);
      setDeletingId(null);
    } catch {
      // handled by mutation
    }
  }

  const exportCSV = () => {
    if (!channels?.length) return;
    const headers = ["ID", "Ad", "Tip", "Status", "Yaradılma Tarixi"];
    const rows = channels.map((c) => [
      c.id,
      c.name,
      CHANNEL_CONFIG[c.channel_type].label,
      c.is_active ? "Aktiv" : "Deaktiv",
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const content = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `satish-kanallari-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPending = createChannel.isPending || updateChannel.isPending;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Radio className="text-blue-500 animate-pulse" size={36} />
            Satış Kanalları
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            Müxtəlif platformalardakı satış kanallarınızı idarə edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={exportCSV} variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
            <Download size={18} />
            Eksport
          </Button>
          <Button onClick={openCreate} className="gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20">
            <Plus size={18} />
            Yeni Kanal
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <LayoutGrid size={64} />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ümumi Kanallar</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.total}</h3>
            <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
              <Activity size={14} className="mr-1" /> Aktiv qoşulmalar
            </div>
          </CardContent>
        </Card>

        <Card glass className="relative overflow-hidden group border-green-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} className="text-green-500" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Aktiv</p>
            <h3 className="text-3xl font-bold text-green-500 mt-1">{stats.active}</h3>
            <div className="mt-4 flex items-center text-xs text-green-400/80">
              Mağazalar fəaliyyətdədir
            </div>
          </CardContent>
        </Card>

        <Card glass className="relative overflow-hidden group border-red-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle size={64} className="text-red-500" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Deaktiv</p>
            <h3 className="text-3xl font-bold text-red-500 mt-1">{stats.inactive}</h3>
            <div className="mt-4 flex items-center text-xs text-red-400/80">
              Gözləmədə olan kanallar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <Card glass className="p-4 bg-white/[0.02] border-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input
              placeholder="Kanal adına görə axtar..."
              className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={18} />
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "all" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Hamısı
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "active" ? "bg-green-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Aktiv
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "inactive" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Deaktiv
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Channel list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-20 text-center">
          <p className="text-red-500 bg-red-500/10 inline-block px-6 py-3 rounded-2xl border border-red-500/20">
            Kanallar yüklənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.
          </p>
        </div>
      ) : channels?.length === 0 ? (
        <div className="py-24 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
          <Radio size={48} className="mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white">Kanal tapılmadı</h3>
          <p className="text-gray-500 mt-2">Axtarış kriteriyalarına uyğun kanal mövcud deyil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels?.map((channel) => {
            const cfg = CHANNEL_CONFIG[channel.channel_type] || CHANNEL_CONFIG.custom;
            const Icon = cfg.icon;
            
            return (
              <Card 
                key={channel.id} 
                glass 
                className={`group p-6 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden ${
                  !channel.is_active && "opacity-75 grayscale-[0.5]"
                }`}
              >
                {/* Background light effect */}
                <div className={`absolute -right-4 -top-4 w-16 h-16 blur-2xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity bg-current ${cfg.color}`} />
                
                <div className="flex flex-col h-full gap-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${cfg.color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(channel)}
                        className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeletingId(channel.id)}
                        className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {channel.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500 font-medium">{cfg.label}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-700" />
                      <Badge 
                        variant={channel.is_active ? "success" : "secondary"} 
                        className="text-[10px] px-2 py-0"
                      >
                        {channel.is_active ? "Aktiv" : "Deaktiv"}
                      </Badge>
                    </div>
                  </div>

                  {deletingId === channel.id && (
                    <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
                      <Trash2 className="text-red-500 mb-2" size={32} />
                      <p className="text-sm text-white font-medium mb-4">Bu kanalı silmək istəyirsiniz?</p>
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="destructive" 
                          className="flex-1" 
                          onClick={() => handleDelete(channel.id)}
                          disabled={deleteChannel.isPending}
                        >
                          Bəli
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          onClick={() => setDeletingId(null)}
                        >
                          Xeyr
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Kanalı Düzəlt" : "Yeni Kanal Yaradın"}
        description={
            editTarget
              ? "Mövcud satış kanalının məlumatlarını yeniləyin."
              : "Sisteminə yeni satış kanalı əlavə edərək sifarişlərinizi mərkəzləşdirin."
          }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 ml-1">Kanal Adı</label>
              <Input
                placeholder="Məsələn: Əsas Shopify Mağazası"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:border-blue-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 ml-1">Kanal Tipi</label>
              <Select
                value={form.channel_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    channel_type: e.target.value as ChannelType,
                  }))
                }
                className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:border-blue-500/50 appearance-none"
              >
                {CHANNEL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900">
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
            <input
              type="checkbox"
              id="chan-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-5 w-5 rounded-lg border-white/10 bg-black/20 accent-blue-600 cursor-pointer"
            />
            <div className="flex flex-col">
              <label htmlFor="chan-is-active" className="text-sm font-bold text-white cursor-pointer">
                Kanalı aktivləşdir
              </label>
              <span className="text-xs text-gray-500">Aktiv kanallar üzərindən sifariş qəbul edilə bilər</span>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-in shake duration-300">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pb-2 pt-4 border-t border-white/5">
            <Button type="button" variant="outline" onClick={closeModal} className="h-12 px-6 rounded-xl border-white/10 hover:bg-white/5">
              Ləğv et
            </Button>
            <Button 
                type="submit" 
                disabled={isPending}
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 min-w-[120px]"
            >
              {isPending ? "Saxlanılır..." : editTarget ? "Yenilə" : "Kanalı Yarat"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
