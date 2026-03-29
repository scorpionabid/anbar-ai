"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useSettings, useSettingsMutation } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TIMEZONE_OPTIONS } from "./constants";
import type { TenantSettings } from "@/types/api";

type WeightUnitOption = "kg" | "g" | "lb" | "oz";
type DimensionUnitOption = "cm" | "m" | "in" | "ft";
type DateFormatOption = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

interface SirketFormState {
  currency: string;
  timezone: string;
  weight_unit: WeightUnitOption;
  dimension_unit: DimensionUnitOption;
  tax_rate: string;
  low_stock_threshold: string;
  date_format: DateFormatOption;
}

function SkeletonField() {
  return <div className="h-11 bg-secondary/60 rounded-xl animate-pulse" />;
}

export function SirketTab() {
  const { data: settings, isLoading } = useSettings();
  const { mutateAsync, isPending } = useSettingsMutation();

  const [form, setForm] = useState<SirketFormState>({
    currency: "AZN",
    timezone: "Asia/Baku",
    weight_unit: "kg",
    dimension_unit: "cm",
    tax_rate: "18",
    low_stock_threshold: "5",
    date_format: "DD.MM.YYYY",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        currency: settings.currency,
        timezone: settings.timezone,
        weight_unit: settings.weight_unit as WeightUnitOption,
        dimension_unit: settings.dimension_unit as DimensionUnitOption,
        tax_rate: String(settings.tax_rate),
        low_stock_threshold: String(settings.low_stock_threshold),
        date_format: settings.date_format as DateFormatOption,
      });
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const payload: Partial<TenantSettings> = {
        currency: form.currency.toUpperCase(),
        timezone: form.timezone,
        weight_unit: form.weight_unit,
        dimension_unit: form.dimension_unit,
        tax_rate: parseFloat(form.tax_rate),
        low_stock_threshold: parseInt(form.low_stock_threshold, 10),
        date_format: form.date_format,
      };
      await mutateAsync(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Şirkət</h2>
        <p className="text-muted-foreground font-medium mt-1">
          Şirkətə aid sistem parametrlərini idarə edin.
        </p>
      </div>

      <Card glass>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-4 w-32 bg-secondary/60 rounded-lg animate-pulse" />
                  <SkeletonField />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Valyuta (məs. AZN, USD, EUR)
                  </label>
                  <Input
                    value={form.currency}
                    maxLength={3}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))
                    }
                    placeholder="AZN"
                  />
                </div>

                <div>
                  <Select
                    label="Vaxt Zonası"
                    value={form.timezone}
                    onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    label="Çəki Vahidi"
                    value={form.weight_unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, weight_unit: e.target.value as WeightUnitOption }))
                    }
                  >
                    {(["kg", "g", "lb", "oz"] as WeightUnitOption[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    label="Ölçü Vahidi"
                    value={form.dimension_unit}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dimension_unit: e.target.value as DimensionUnitOption,
                      }))
                    }
                  >
                    {(["cm", "m", "in", "ft"] as DimensionUnitOption[]).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    ƏDV Faizi (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.tax_rate}
                    onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                    placeholder="18"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Minimum Stok Xəbərdarlığı
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.low_stock_threshold}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))
                    }
                    placeholder="5"
                  />
                </div>

                <div>
                  <Select
                    label="Tarix Formatı"
                    value={form.date_format}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_format: e.target.value as DateFormatOption,
                      }))
                    }
                  >
                    {(["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as DateFormatOption[]).map(
                      (fmt) => (
                        <option key={fmt} value={fmt}>
                          {fmt}
                        </option>
                      )
                    )}
                  </Select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Parametrlər yadda saxlandı
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saxlanılır..." : "Yadda saxla"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
