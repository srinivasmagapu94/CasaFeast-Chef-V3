import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, RotateCcw, Loader2, UserCog } from "lucide-react";
import apiClient from "@/lib/api";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.get("/admin/chefs");
      setChefs(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const verify = async (uuid, track) => { await apiClient.post(`/admin/verify/${uuid}/${track}`); toast.success(`${track.toUpperCase()} verified`); load(); };
  const activate = async (uuid) => { await apiClient.post(`/admin/activate/${uuid}`); toast.success("Chef fully activated"); load(); };
  const reset = async (uuid) => { await apiClient.post(`/admin/reset/${uuid}`); toast.success("Reset to onboarding mode"); load(); };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
        <Logo size={36} />
        <div className="ml-auto flex items-center gap-2 text-sm font-semibold text-slate-500">
          <UserCog className="h-4 w-4" /> Admin Verification Console
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-[#15803D]" /></div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">Chef Verification</h1>
            <p className="text-slate-500 text-sm">Approve verification tracks to activate chef accounts (demo admin).</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" /></div>
        ) : (
          <div className="space-y-4">
            {chefs.map((c) => {
              const v = c.verification || {};
              return (
                <div key={c.chefUUID} className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5" data-testid={`admin-chef-${c.chefUUID}`}>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {c.firstName} {c.lastName}
                        {c.isActivated ? <Badge className="bg-emerald-100 text-emerald-700">Activated</Badge> : <Badge className="bg-amber-100 text-amber-700">Onboarding</Badge>}
                      </div>
                      <div className="text-xs text-slate-400">{c.email} · +91 {c.mobileNumber}</div>
                      <div className="text-[10px] text-slate-300 font-mono mt-0.5">{c.chefUUID}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" data-testid={`admin-activate-${c.chefUUID}`} onClick={() => activate(c.chefUUID)} disabled={c.isActivated} className="bg-[#15803D] hover:bg-[#166534] h-8 text-xs"><Check className="h-3.5 w-3.5" /> Activate All</Button>
                      <Button size="sm" variant="outline" data-testid={`admin-reset-${c.chefUUID}`} onClick={() => reset(c.chefUUID)} className="h-8 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {[["kyc", "KYC Verification"], ["bank", "Bank Verification"], ["field", "Field Verification"]].map(([key, label]) => (
                      <div key={key} className={`rounded-xl border p-3 flex items-center justify-between ${v[key] ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200"}`}>
                        <div>
                          <div className="text-sm font-medium text-slate-700">{label}</div>
                          <div className={`text-[11px] font-semibold ${v[key] ? "text-emerald-600" : "text-amber-600"}`}>{v[key] ? "Verified" : "Pending"}</div>
                        </div>
                        <Button size="sm" data-testid={`admin-verify-${key}-${c.chefUUID}`} onClick={() => verify(c.chefUUID, key)} disabled={v[key]} className="h-7 text-xs bg-[#1D4ED8] hover:bg-[#1E40AF]"><Check className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <LegalFooter className="border-t border-slate-200 bg-white" />
    </div>
  );
}
