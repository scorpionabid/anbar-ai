"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import type { PaymentMethod, PaymentState } from "@/types/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// ── Labels & badges ───────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Nağd",
  bank_transfer: "Bank köçürməsi",
  card: "Kart",
  online: "Onlayn",
  marketplace: "Marketplace",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  pending: "Gözlənilir",
  completed: "Tamamlandı",
  failed: "Uğursuz",
  refunded: "Geri qaytarıldı",
};

function paymentStateBadge(state: PaymentState): BadgeVariant {
  switch (state) {
    case "pending": return "warning";
    case "completed": return "success";
    case "failed": return "destructive";
    case "refunded": return "secondary";
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

import { SkeletonRow } from "@/components/ui/SkeletonRow";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPageWrapper() {
  return (
    <ProtectedRoute permission="orders:read">
      <PaymentsPageContent />
    </ProtectedRoute>
  );
}

function PaymentsPageContent() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePayments(page, 20);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Ödənişlər
        </h1>
        <p className="text-muted-foreground font-medium mt-1">
          {isLoading ? "Yüklənir..." : `${data?.total ?? 0} ödəniş mövcuddur`}
        </p>
      </div>

      {/* Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "Sifariş №",
                    "Ödəniş üsulu",
                    "Status",
                    "Məbləğ",
                    "Tarix",
                    "Qeyd",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                )}
                {isError && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-destructive"
                    >
                      Ödənişlər yüklənərkən xəta baş verdi.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Hələ heç bir ödəniş qeydə alınmayıb.
                    </td>
                  </tr>
                )}
                {(data?.data ?? []).map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-primary">
                      {payment.order?.order_number ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {PAYMENT_METHOD_LABELS[payment.payment_method]}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={paymentStateBadge(payment.state)}>
                        {PAYMENT_STATE_LABELS[payment.state]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {payment.amount.toLocaleString("az-AZ", {
                        style: "currency",
                        currency: payment.currency || "AZN",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("az-AZ")
                        : new Date(payment.created_at).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {payment.notes ?? payment.reference ?? (
                        <span className="opacity-40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Səhifə {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Növbəti
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
