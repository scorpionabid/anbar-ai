import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS class birləşdirmə köməkçisi.
 * clsx + twMerge kombinasiyası ilə konflikt yaradan sinifləri
 * düzgün şəkildə birləşdirir.
 *
 * @example
 * cn("text-sm font-bold", isActive && "text-primary")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
