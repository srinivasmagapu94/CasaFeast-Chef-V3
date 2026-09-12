import React, { useEffect, useState } from "react";
import { TrendingUp, Wallet, Receipt, ShoppingBag, Loader2, PieChart as PieIcon, FileDown, FileSpreadsheet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PIE_COLORS = ["#1D4ED8", "#15803D", "#D97706"];

export default function Revenue() {
  const { chefUUID } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [history, setHistory] = useState([]);

  const download = async (format, month) => {
    const tag = `${format}-${month || "current"}`;
    setDownloading(tag);
    try {
      const qs = `format=${format}${month ? `&month=${encodeURIComponent(month)}` : ""}`;
      const res = await apiClient.get(`/payout/${chefUUID}/statement?${qs}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Casafeast_Statement_${(month || "current").replace(/\s/g, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} statement downloaded`);
    } catch {
      toast.error("Could not generate statement");
    } finally {
      setDownloading("");
    }
  };

  useEffect(() => {
    apiClient.get(`/revenue/${chefUUID}`).then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
    apiClient.get(`/payout/${chefUUID}/history`).then((r) => setHistory(r.data)).catch(() => {});
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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900">Revenue Analytics</h1>
          <p className="text-slate-500 text-sm mb-6">Earnings performance against the 20% + 18% GST commission model.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="download-pdf" onClick={() => download("pdf")} disabled={!!downloading} className="bg-[#1D4ED8] hover:bg-[#1E40AF]">
            {downloading === "pdf-current" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Statement PDF
          </Button>
          <Button data-testid="download-csv" onClick={() => download("csv")} disabled={!!downloading} variant="outline">
            {downloading === "csv-current" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} CSV
          </Button>
        </div>
      </div>

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

      {/* Payout history */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-soft p-6" data-testid="payout-history">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-4 w-4 text-[#15803D]" />
          <h3 className="font-semibold text-slate-800">Statement History</h3>
          <span className="text-[11px] text-slate-400">Re-download any month, anytime</span>
        </div>
        <div className="divide-y divide-slate-100">
          {history.map((m) => (
            <div key={m.key} data-testid={`history-row-${m.key}`} className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  {m.month}
                  {m.isCurrent && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">CURRENT</span>}
                </div>
                <div className="text-[11px] text-slate-400">Net payout ₹{m.netPayout} · {m.completedOrders} orders · commission ₹{m.commission} + GST ₹{m.gst}</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="font-display font-bold text-slate-900">₹{m.grossRevenue}</div>
                <div className="text-[10px] text-slate-400">gross</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" data-testid={`history-pdf-${m.key}`} onClick={() => download("pdf", m.month)} disabled={!!downloading} className="h-8 text-xs">
                  {downloading === `pdf-${m.month}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} PDF
                </Button>
                <Button size="sm" variant="ghost" data-testid={`history-csv-${m.key}`} onClick={() => download("csv", m.month)} disabled={!!downloading} className="h-8 text-xs text-slate-500">
                  {downloading === `csv-${m.month}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
