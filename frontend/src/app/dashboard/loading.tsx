import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 rounded-full bg-secondary/80 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <Loader2 className="h-6 w-6 text-primary absolute animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-wide uppercase opacity-70">
          Səhifə Yüklənir...
        </p>
      </div>
    </div>
  );
}
