import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, ShoppingBag, TrendingUp, UtensilsCrossed, Lock,
  ChevronRight, PlusCircle, Layers, Archive,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SupportTicket } from "@/components/shell/SupportTicket";

function NavItem({ to, icon: Icon, label, disabled, testid, end }) {
  if (disabled) {
    return (
      <div
        data-testid={testid}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 cursor-not-allowed select-none opacity-50"
        title="Complete onboarding to unlock"
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="text-sm font-medium flex-1">{label}</span>
        <Lock className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
          isActive ? "bg-[#1D4ED8] text-white shadow-lg shadow-blue-900/30" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { chef } = useAuth();
  const activated = chef?.isActivated;
  const [openMenu, setOpenMenu] = useState(true);
  const [openOrders, setOpenOrders] = useState(true);
  const loc = useLocation();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 border-r border-slate-800 hidden lg:flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)]" data-testid="sidebar">
      <div className="p-3 overflow-y-auto flex-1">
        <NavItem to="/app" end icon={LayoutDashboard} label="Overview" testid="nav-overview" />

        {!activated && (
          <NavItem to="/app/onboarding" icon={ClipboardCheck} label="On-Boarding" testid="nav-onboarding" />
        )}

        <div className="mt-4 mb-2 px-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Operations
        </div>

        {/* Orders group */}
        <div>
          <button
            data-testid="nav-orders-group"
            onClick={() => activated && setOpenOrders((o) => !o)}
            disabled={!activated}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activated ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-500 opacity-50 cursor-not-allowed"
            }`}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className="text-sm font-medium flex-1 text-left">Orders</span>
            {activated ? (
              <ChevronRight className={`h-4 w-4 transition-transform ${openOrders ? "rotate-90" : ""}`} />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
          </button>
          {activated && openOrders && (
            <div className="ml-4 pl-3 border-l border-slate-800 mt-1 space-y-0.5">
              <NavLink to="/app/orders" data-testid="nav-orders" className={({ isActive }) => `block px-3 py-2 rounded-lg text-[13px] ${isActive ? "text-white bg-white/5 font-semibold" : "text-slate-400 hover:text-white"}`}>
                Today · Upcoming · Completed
              </NavLink>
            </div>
          )}
        </div>

        {/* Revenue */}
        <NavItem to="/app/revenue" icon={TrendingUp} label="Revenue Analytics" disabled={!activated} testid="nav-revenue" />

        {/* Menu group */}
        <div>
          <button
            data-testid="nav-menu-group"
            onClick={() => activated && setOpenMenu((o) => !o)}
            disabled={!activated}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activated ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-500 opacity-50 cursor-not-allowed"
            }`}
          >
            <UtensilsCrossed className="h-[18px] w-[18px]" />
            <span className="text-sm font-medium flex-1 text-left">Menu Catalog</span>
            {activated ? (
              <ChevronRight className={`h-4 w-4 transition-transform ${openMenu ? "rotate-90" : ""}`} />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
          </button>
          {activated && openMenu && (
            <div className="ml-4 pl-3 border-l border-slate-800 mt-1 space-y-0.5">
              {[
                { to: "/app/menu/create", label: "Create Menu", icon: PlusCircle, testid: "nav-menu-create" },
                { to: "/app/menu/active", label: "Active Menu", icon: Layers, testid: "nav-menu-active" },
                { to: "/app/menu/inactive", label: "Inactive Menu", icon: Archive, testid: "nav-menu-inactive" },
              ].map((m) => (
                <NavLink key={m.to} to={m.to} data-testid={m.testid} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] ${isActive ? "text-white bg-white/5 font-semibold" : "text-slate-400 hover:text-white"}`}>
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>

      <SupportTicket />
    </aside>
  );
}
