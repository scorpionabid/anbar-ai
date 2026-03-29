"use client";

import { Pencil, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

interface CategoryRowProps {
  category: Category;
  getParentName: (id: string | null) => string;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}

export function CategoryRow({
  category,
  getParentName,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  const isChild = !!category.parent_id;

  return (
    <tr className="border-b border-border/30 hover:bg-secondary/30 transition-all group/row">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {isChild && (
            <div className="flex items-center">
               <div className="w-4 h-4 border-l-2 border-b-2 border-primary/30 rounded-bl-lg ml-2 mb-2 shadow-[inset_-1px_-1px_0_rgba(var(--primary),0.05)]" />
            </div>
          )}
          <div className={cn(
            "flex items-center gap-2",
            isChild ? "text-sm font-medium text-foreground/80" : "text-sm font-bold text-foreground"
          )}>
            {!isChild && <Tag className="h-3.5 w-3.5 text-primary opacity-50" />}
            {category.name}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase opacity-70 tracking-tight">
        {getParentName(category.parent_id)}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground/80 max-w-[300px] truncate italic">
        {category.description ?? "Açıqlama yoxdur"}
      </td>
      <td className="px-6 py-4">
        <Badge variant={category.is_active ? "success" : "secondary"} className="h-5 px-1.5 text-[10px] items-center">
          {category.is_active ? "Aktiv" : "Deaktiv"}
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover/row:opacity-100 transition-all transform group-hover/row:translate-x-0 sm:translate-x-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(category)}
            aria-label="Düzəlt"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-xl"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(category)}
            aria-label="Sil"
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
