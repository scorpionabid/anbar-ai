"use client";

interface SkeletonRowProps {
  /** Sütun sayı (default: 5) */
  cols?: number;
}

/**
 * Cədvəl yüklənmə skeleti.
 * Bütün `page.tsx` fayllarındakı SkeletonRow təkrarını aradan qaldırır.
 *
 * @example
 * {isLoading && <><SkeletonRow cols={7} /><SkeletonRow cols={7} /></>}
 */
export function SkeletonRow({ cols = 5 }: SkeletonRowProps) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 bg-secondary/60 rounded-lg animate-pulse" />
        </td>
      ))}
    </tr>
  );
}
