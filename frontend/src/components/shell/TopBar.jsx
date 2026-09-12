import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Trash2, Mail, Phone, BadgeCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient, { invalidateCache } from "@/lib/api";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const { chef, chefUUID, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const initials = `${chef?.firstName?.[0] || ""}${chef?.lastName?.[0] || ""}`;

  const loadNotifs = async () => {
    if (!chefUUID) return;
    try {
      const res = await apiClient.get(`/notifications/${chefUUID}`);
      setNotifications(res.data);
    } catch {}
  };

  useEffect(() => {
    loadNotifs();
    const id = setInterval(loadNotifs, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chefUUID]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleOpen = async (open) => {
    setNotifOpen(open);
    if (open && unread > 0) {
      try { await apiClient.post(`/notifications/${chefUUID}/read`); setTimeout(loadNotifs, 400); } catch {}
    }
  };

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (diff < 1) return "just now";
    if (diff < 60) return `${Math.floor(diff)} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} d ago`;
  };

  return (
    <header className="h-16 sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center px-4 lg:px-6" data-testid="topbar">
      <Logo size={38} />

      <div className="ml-auto flex items-center gap-3 lg:gap-5">
        <div className="hidden md:flex items-center gap-4 pr-4 border-r border-slate-200" data-testid="chef-info">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1 justify-end">
              {chef?.firstName} {chef?.lastName}
              {chef?.isActivated && <BadgeCheck className="h-3.5 w-3.5 text-[#15803D]" />}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 justify-end">
              <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{chef?.email}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-0.5">
            <Phone className="h-3 w-3" />+91 {chef?.mobileNumber}
          </div>
        </div>

        <Popover open={notifOpen} onOpenChange={handleOpen}>
          <PopoverTrigger asChild>
            <button data-testid="notification-bell" className="relative h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Bell className="h-5 w-5 text-slate-600" />
              {unread > 0 && (
                <span data-testid="notification-badge" className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0" data-testid="notification-panel">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm flex items-center justify-between">
              Notifications {unread > 0 && <span className="text-[11px] font-normal text-slate-400">{unread} new</span>}
            </div>
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
              ) : notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 flex gap-3 ${!n.read ? "bg-blue-50/40" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.tone === "green" ? "bg-emerald-500" : n.tone === "blue" ? "bg-blue-500" : "bg-amber-500"}`} />
                  <div>
                    <p className="text-sm text-slate-700">{n.title}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid="profile-menu-trigger" className="flex items-center gap-2 rounded-full hover:bg-slate-100 pl-1 pr-2 py-1 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#15803D] text-white flex items-center justify-center text-xs font-bold">
                {initials || "CF"}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold text-sm">{chef?.firstName} {chef?.lastName}</div>
              <div className="text-[11px] text-slate-400 font-normal">{chef?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="clear-cache-button"
              onClick={() => { invalidateCache(); toast.success("Local cache cleared"); }}
            >
              <Trash2 className="h-4 w-4" /> Clear memory cache
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="logout-button" onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
