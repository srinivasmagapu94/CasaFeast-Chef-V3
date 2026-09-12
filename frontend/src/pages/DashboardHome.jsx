import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingUp, UtensilsCrossed, ClipboardCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";

const CHEF_IMG = "https://images.unsplash.com/photo-1760445529057-2d9c60969d55?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";

export default function DashboardHome() {
  const { chef, chefUUID } = useAuth();
  const navigate = useNavigate();
  const [rev, setRev] = useState(null);

  useEffect(() => {
    if (chef?.isActivated && chefUUID) {
      apiClient.get(`/revenue/${chefUUID}`).then((r) => setRev(r.data)).catch(() => {});
    }
  }, [chef, chefUUID]);

  if (!chef?.isActivated) {
    return (
      <div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl overflow-hidden shadow-float bg-slate-900 relative">
          <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${CHEF_IMG})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
          <div className="relative p-8 lg:p-12 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" /> Onboarding pending
            </span>
            <h1 className="font-display font-extrabold text-3xl lg:text-4xl text-white mt-4 leading-tight">
              Hi {chef?.firstName}, let's get your kitchen live.
            </h1>
            <p className="text-slate-300 mt-3">
              Complete your 4-step onboarding and get verified to start receiving high-volume subscription orders.
            </p>
            <Button data-testid="home-start-onboarding" onClick={() => navigate("/app/onboarding")} className="mt-6 bg-[#15803D] hover:bg-[#166534] h-11 group">
              Continue Onboarding <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { label: "Gross Revenue", value: `₹${rev?.grossRevenue ?? 0}`, icon: TrendingUp, color: "#1D4ED8", to: "/app/revenue" },
    { label: "Total Orders", value: rev?.totalOrders ?? 0, icon: ShoppingBag, color: "#15803D", to: "/app/orders" },
    { label: "Completed", value: rev?.completedOrders ?? 0, icon: ClipboardCheck, color: "#D97706", to: "/app/orders" },
    { label: "Net Payout", value: `₹${rev?.netPayout ?? 0}`, icon: UtensilsCrossed, color: "#2563EB", to: "/app/revenue" },
  ];

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-slate-900">Welcome back, {chef?.firstName} 👋</h1>
      <p className="text-slate-500 mt-1">Here's how your kitchen is performing today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((s, i) => (
          <motion.button
            key={s.label}
            data-testid={`home-stat-${i}`}
            onClick={() => navigate(s.to)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-float transition-all hover:-translate-y-0.5"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}15` }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div className="font-display font-extrabold text-2xl text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {[
          { title: "Manage Orders", desc: "Accept, reject & dispatch orders", to: "/app/orders", icon: ShoppingBag },
          { title: "Menu Catalog", desc: "Create & manage subscription plans", to: "/app/menu/active", icon: UtensilsCrossed },
          { title: "Revenue Analytics", desc: "Track earnings & payouts", to: "/app/revenue", icon: TrendingUp },
        ].map((c) => (
          <button key={c.title} onClick={() => navigate(c.to)} className="text-left bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:shadow-float transition-all group">
            <c.icon className="h-6 w-6 text-[#1D4ED8]" />
            <h3 className="font-semibold text-slate-900 mt-3">{c.title}</h3>
            <p className="text-sm text-slate-500">{c.desc}</p>
            <span className="text-sm text-[#1D4ED8] font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Open <ArrowRight className="h-4 w-4" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
