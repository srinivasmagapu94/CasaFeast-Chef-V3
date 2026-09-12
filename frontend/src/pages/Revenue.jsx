import React, { useEffect, useState } from "react";
import { TrendingUp, Wallet, Receipt, ShoppingBag, Loader2, PieChart as PieIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const PIE_COLORS = ["#1D4ED8", "#15803D", "#D97706"];

export default function Revenue() {
  const { chefUUID } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/revenue/${chefUUID}`).then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [chefUUID]);

  if (loading || !data) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" /></div>;

  const kpis = [
    { label: "Gross Revenue", value: `₹${data.grossRevenue}`, icon: TrendingUp, color: "#1D4ED8" },
    { label: "Net Payout", value: `₹${data.netPayout}`, icon: Wallet, color: "#15803D" },
    { label: "Commission + GST", value: `₹${(data.commission + data.gst).toFixed(2)}`, icon: Receipt, color: "#D97706" },
    { label: "Completed Orders", value: data.completedOrders, icon: ShoppingBag, color: "#2563EB" },
  ];

  const subData = Object.entries(data.activeSubscriptions).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-slate-900">Revenue Analytics</h1>
      <p className="text-slate-500 text-sm mb-6">Earnings performance against the 20% + 18% GST commission model.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={k.label} data-testid={`revenue-kpi-${i}`} className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${k.color}15` }}>
              <k.icon className="h-5 w-5" style={{ color: k.color }} />
            </div>
            <div className="font-display font-extrabold text-2xl text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-soft p-6" data-testid="revenue-chart">
          <h3 className="font-semibold text-slate-800 mb-4">Weekly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.weeklyTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="revenue" stroke="#1D4ED8" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6" data-testid="revenue-subscriptions">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><PieIcon className="h-4 w-4 text-[#15803D]" /> Active Subscriptions</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={subData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {subData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-soft p-6" data-testid="commission-breakdown">
        <h3 className="font-semibold text-slate-800 mb-4">Commission Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["Gross Revenue", `₹${data.grossRevenue}`, "#0F172A"],
            ["Platform Commission (20%)", `₹${data.commission}`, "#D97706"],
            ["GST (18% on commission)", `₹${data.gst}`, "#DC2626"],
            ["Your Net Payout", `₹${data.netPayout}`, "#15803D"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
