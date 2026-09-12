import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, Check, X, Truck, Loader2, Clock, Package, CalendarClock, CheckCircle2,
} from "lucide-react";
import apiClient, { invalidateCache } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABS = [
  { key: "Today", icon: Clock, color: "#1D4ED8" },
  { key: "Upcoming", icon: CalendarClock, color: "#D97706" },
  { key: "Completed", icon: CheckCircle2, color: "#15803D" },
];
const SUBS = ["Weekly 5-Days", "Monthly 20-Days", "Quarterly 60-Days"];
const SLOTS = ["Breakfast", "Lunch", "Dinner"];

const STATUS_CLASS = {
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

function OrderCard({ order, onAccept, onReject, onDispatch }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4 hover:shadow-float transition-all" data-testid={`order-card-${order.orderId}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-900">{order.customerName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{order.orderId}</div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] || STATUS_CLASS.pending}`}>{order.status}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{order.timeSlot}</span>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{order.subscription}</span>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">₹{order.orderValue}</span>
      </div>

      <div className="mt-3 text-sm text-slate-600 flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-slate-400" /> {order.items}</div>

      <div className="mt-3 flex items-center gap-1.5">
        {order.deliveryMode === "dispatched" ? (
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1" data-testid={`order-dispatched-${order.orderId}`}><Truck className="h-3.5 w-3.5" /> Dispatched · {order.deliveryPartner}</span>
        ) : (
          <span className="text-[11px] text-amber-600 font-medium">Delivery pending</span>
        )}
      </div>

      {order.bucket !== "Completed" && (
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <Button size="sm" data-testid={`order-accept-${order.orderId}`} onClick={() => onAccept(order)} disabled={order.status === "accepted"} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"><Check className="h-3.5 w-3.5" /> Accept</Button>
          <Button size="sm" variant="outline" data-testid={`order-reject-${order.orderId}`} onClick={() => onReject(order)} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"><X className="h-3.5 w-3.5" /> Reject</Button>
          <Button size="sm" variant="outline" data-testid={`order-dispatch-${order.orderId}`} onClick={() => onDispatch(order)} disabled={order.deliveryMode === "dispatched"} className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8 text-xs"><Truck className="h-3.5 w-3.5" /></Button>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { chefUUID } = useAuth();
  const [tab, setTab] = useState("Today");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState("all");
  const [sub, setSub] = useState("all");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      invalidateCache("/orders");
      const res = await apiClient.get(`/orders?chefUUID=${chefUUID}`);
      setOrders(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chefUUID]);

  const counts = useMemo(() => {
    const c = { Today: 0, Upcoming: 0, Completed: 0 };
    orders.forEach((o) => { c[o.bucket] = (c[o.bucket] || 0) + 1; });
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (o.bucket !== tab) return false;
      if (q) {
        const hay = `${o.customerName} ${o.orderId} ${o.items}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (slot !== "all" && o.timeSlot !== slot) return false;
      if (sub !== "all" && o.subscription !== sub) return false;
      if (deliveryOnly && o.deliveryMode !== "dispatched") return false;
      return true;
    });
  }, [orders, tab, q, slot, sub, deliveryOnly]);

  const onAccept = async (o) => { await apiClient.post(`/orders/${o.orderId}/accept`); invalidateCache("/orders"); toast.success("Order accepted — added to packaging queue"); load(); };
  const onDispatch = async (o) => { const r = await apiClient.post(`/orders/${o.orderId}/request-delivery`); invalidateCache("/orders"); toast.success(`Delivery partner requested: ${r.data.deliveryPartner}`); load(); };
  const submitReject = async () => { await apiClient.post(`/orders/${rejecting.orderId}/reject`, { reason }); invalidateCache("/orders"); toast.success("Order rejected"); setRejecting(null); setReason(""); load(); };

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-slate-900">Orders</h1>
      <p className="text-slate-500 text-sm mb-6">Manage your incoming and ongoing subscription orders.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t.key} data-testid={`orders-tab-${t.key.toLowerCase()}`} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-white shadow-soft border border-slate-200" : "text-slate-500 hover:bg-white/60"}`}
            style={tab === t.key ? { color: t.color } : {}}>
            <t.icon className="h-4 w-4" /> {t.key}
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{counts[t.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4 mb-6 flex flex-wrap items-center gap-3" data-testid="orders-filter-bar">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input data-testid="orders-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, order ID, items…" className="pl-9" />
        </div>
        <Select value={slot} onValueChange={setSlot}>
          <SelectTrigger data-testid="orders-slot-filter" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Slots</SelectItem>{SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sub} onValueChange={setSub}>
          <SelectTrigger data-testid="orders-sub-filter" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Plans</SelectItem>{SUBS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <button data-testid="orders-delivery-toggle" onClick={() => setDeliveryOnly((d) => !d)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 ${deliveryOnly ? "bg-[#1D4ED8] text-white border-[#1D4ED8]" : "bg-white text-slate-600 border-slate-200"}`}>
          <Truck className="h-4 w-4" /> Dispatched only
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400" data-testid="orders-empty">No orders in this view.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((o) => <OrderCard key={o.orderId} order={o} onAccept={onAccept} onReject={setRejecting} onDispatch={onDispatch} />)}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md" data-testid="reject-dialog">
          <DialogHeader><DialogTitle className="font-display">Reject order {rejecting?.orderId}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 -mt-1">Let the customer know why you can't fulfil this order.</p>
          <Textarea data-testid="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ingredients unavailable today…" className="min-h-[90px]" />
          <Button data-testid="reject-submit" onClick={submitReject} className="w-full bg-red-500 hover:bg-red-600">Confirm Rejection</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
