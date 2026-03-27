"use client";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { Search, Bell, Menu, User } from "lucide-react";
import { Input } from "./ui/Input";

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="max-w-md w-full relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search everything..." 
            className="pl-10 h-10 border-none bg-secondary/50 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>
        
        <div className="h-8 w-px bg-border mx-2" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-foreground leading-tight">
              {user?.full_name || "User"}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              {user?.role || "Member"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group cursor-pointer hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
