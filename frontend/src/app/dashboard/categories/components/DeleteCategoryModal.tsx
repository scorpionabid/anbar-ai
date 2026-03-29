"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import type { Category } from "@/types/api";

interface DeleteProps {
  open: boolean;
  onClose: () => void;
  target: Category | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteCategoryModal({
  open,
  onClose,
  target,
  onConfirm,
  isPending,
}: DeleteProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kateqoriyanı Sil"
      description={`"${target?.name}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
      size="sm"
    >
      <div className="space-y-6 pt-4 animate-in fade-in duration-300">
        <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 flex items-start gap-3">
           <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
           <p className="text-xs text-destructive/80 font-medium leading-relaxed uppercase tracking-tighter">
             Xəbərdarlıq: Bu kateqoriya silindikdə, əgər varsa, tabeliyində olan məhsulların kateqoriya bağı kəsilə bilər.
           </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
           <Button variant="outline" onClick={onClose} disabled={isPending} className="h-10 px-6 rounded-xl font-bold">
             Xeyr, Saxla
           </Button>
           <Button 
             variant="destructive" 
             onClick={onConfirm} 
             disabled={isPending}
             className="h-10 px-8 rounded-xl font-black gap-2 shadow-lg shadow-destructive/20"
           >
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
             Bəli, Sil
           </Button>
        </div>
      </div>
    </Modal>
  );
}
