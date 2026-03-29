import { UserRole, Permission, AIProvider } from "@/types/api";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  warehouse_manager: "Anbar Meneceri",
  sales_manager: "Satış Meneceri",
  operator: "Operator",
  vendor: "Vendor",
};

export type RoleBadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const ROLE_BADGE: Record<UserRole, { variant: RoleBadgeVariant; className: string }> = {
  super_admin: { variant: "destructive", className: "" },
  org_admin: { variant: "default", className: "bg-purple-500/15 text-purple-600 border-transparent" },
  warehouse_manager: { variant: "default", className: "bg-blue-500/15 text-blue-600 border-transparent" },
  sales_manager: { variant: "success", className: "" },
  operator: { variant: "secondary", className: "" },
  vendor: { variant: "warning", className: "" },
};

export const ALL_ROLES: UserRole[] = [
  "super_admin",
  "org_admin",
  "warehouse_manager",
  "sales_manager",
  "operator",
  "vendor",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "inventory:read": "Anbar (Baxış)",
  "inventory:write": "Anbar (Dəyişiklik)",
  "inventory:manage": "Anbar (İdarəetmə)",
  "orders:read": "Sifarişlər (Baxış)",
  "orders:write": "Sifarişlər (Yaradın)",
  "orders:manage": "Sifarişləri İdarəetmə",
  "customers:read": "Müştərilər (Baxış)",
  "customers:write": "Müştəri Əlavə Etmə",
  "customers:manage": "Müştəri İdarəetmə",
  "settings:manage": "Ayarları İdarə Etmə",
  "users:manage": "İstifadəçi İdarəetmə",
  "ai:use": "AI Funksiyalar",
  "ai:manage": "AI Parametrlər",
  "channels:manage": "Kanalları İdarə Etmə",
  "reports:view": "Hesabatlara Baxış",
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    "inventory:read", "inventory:write", "inventory:manage",
    "orders:read", "orders:write", "orders:manage",
    "customers:read", "customers:write", "customers:manage",
    "settings:manage", "users:manage", "ai:use", "ai:manage",
    "channels:manage", "reports:view"
  ],
  org_admin: [
    "inventory:read", "inventory:write", "inventory:manage",
    "orders:read", "orders:write", "orders:manage",
    "customers:read", "customers:write", "customers:manage",
    "settings:manage", "users:manage", "ai:use", "ai:manage",
    "channels:manage", "reports:view"
  ],
  warehouse_manager: ["inventory:read", "inventory:write", "inventory:manage", "customers:read", "reports:view"],
  sales_manager: ["orders:read", "orders:write", "orders:manage", "customers:read", "customers:write", "customers:manage", "reports:view"],
  operator: ["inventory:read", "orders:read", "customers:read"],
  vendor: [],
};

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Baku", label: "Bakı (UTC+4)" },
  { value: "Europe/Istanbul", label: "İstanbul (UTC+3)" },
  { value: "Europe/Moscow", label: "Moskva (UTC+3)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
];

export interface AIProviderDef {
  id: AIProvider;
  name: string;
  description: string;
  models: string[];
  color: string;
  badge: string;
}

export const AI_PROVIDERS: AIProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    color: "from-green-500/10 to-emerald-500/10",
    badge: "bg-green-500/10 text-green-600",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude Opus 4.6, Sonnet 4.6",
    models: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    color: "from-orange-500/10 to-amber-500/10",
    badge: "bg-orange-500/10 text-orange-600",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 1.5 Pro, Flash",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
    color: "from-blue-500/10 to-cyan-500/10",
    badge: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Small",
    models: ["mistral-large-latest", "mistral-small-latest"],
    color: "from-purple-500/10 to-violet-500/10",
    badge: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "azure_openai",
    name: "Azure OpenAI",
    description: "Enterprise GPT deployment",
    models: [],
    color: "from-sky-500/10 to-blue-500/10",
    badge: "bg-sky-500/10 text-sky-600",
  },
];
