"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Radio } from "lucide-react";
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
import { Modal } from "@/components/ui/Modal";

// ── Channel type labels ───────────────────────────────────────────────────────

const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  manual: "Əl ilə",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  trendyol: "Trendyol",
  amazon: "Amazon",
  ebay: "eBay",
  custom: "Digər",
};

const CHANNEL_TYPE_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: "manual", label: "Əl ilə" },
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "trendyol", label: "Trendyol" },
  { value: "amazon", label: "Amazon" },
  { value: "ebay", label: "eBay" },
  { value: "custom", label: "Digər" },
];

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

// ── Channel card ──────────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: Channel;
  onEdit: (channel: Channel) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  deletePending: boolean;
}

function ChannelCard({
  channel,
  onEdit,
  onDelete,
  deletingId,
  setDeletingId,
  deletePending,
}: ChannelCardProps) {
  return (
    <Card glass className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{channel.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline">
              {CHANNEL_TYPE_LABELS[channel.channel_type]}
            </Badge>
            <Badge variant={channel.is_active ? "success" : "secondary"}>
              {channel.is_active ? "Aktiv" : "Deaktiv"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(channel)}
            aria-label="Düzəlt"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeletingId(channel.id)}
            aria-label="Sil"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {deletingId === channel.id && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground flex-1">
            Bu kanalı silmək istədiyinizə əminsiniz?
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(channel.id)}
            disabled={deletePending}
          >
            Bəli
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeletingId(null)}
          >
            Xeyr
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const { data: channels, isLoading, isError } = useChannels();

  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Channel | null>(null);
  const [form, setForm] = useState<ChannelForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleSubmit(e: { preventDefault: () => void }) {
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
      // silently fail
    }
  }

  const isPending = createChannel.isPending || updateChannel.isPending;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Satış Kanalları
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isLoading
              ? "Yüklənir..."
              : `${channels?.length ?? 0} kanal mövcuddur`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kanal
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} glass className="p-5 space-y-3">
              <div className="h-5 bg-secondary/60 rounded-lg animate-pulse w-2/3" />
              <div className="h-4 bg-secondary/60 rounded-lg animate-pulse w-1/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card glass>
          <CardContent className="py-12 text-center text-sm text-destructive">
            Kanallar yüklənərkən xəta baş verdi.
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !isError && (channels ?? []).length === 0 && (
        <Card glass>
          <CardContent className="py-16 text-center">
            <Radio className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              Hələ heç bir satış kanalı əlavə edilməyib.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Channel grid */}
      {!isLoading && !isError && (channels ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(channels ?? []).map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
              setDeletingId={setDeletingId}
              deletePending={deleteChannel.isPending}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Kanalı Düzəlt" : "Yeni Kanal"}
        description={
          editTarget
            ? "Kanal məlumatlarını yeniləyin."
            : "Yeni satış kanalı yaradın."
        }
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Kanal adı <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Məsələn: Əsas mağaza"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Kanal tipi
            </label>
            <Select
              value={form.channel_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  channel_type: e.target.value as ChannelType,
                }))
              }
            >
              {CHANNEL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="chan-is-active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label
              htmlFor="chan-is-active"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Aktiv
            </label>
          </div>

          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saxlanılır..." : editTarget ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
