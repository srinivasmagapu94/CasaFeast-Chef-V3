import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export function LegalFooter({ className = "", variant = "plain" }) {
  if (variant === "fancy") {
    return (
      <footer data-testid="legal-footer" className={`py-5 px-4 ${className}`}>
        <div className="max-w-xl mx-auto flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-300" />
          <div className="flex items-center gap-2.5 rounded-full bg-white border border-slate-200 shadow-soft px-4 py-2">
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#15803D] flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            <div className="text-[11px] leading-tight">
              <span className="text-slate-400">Crafted by </span>
              <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1D4ED8] to-[#15803D]">
                SystemNex Techsolutions LLP
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-2 py-0.5 text-[10px] font-mono tracking-wide">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> TM 7810892
            </span>
          </div>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-300" />
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-2">All rights reserved · Trademark Registered</p>
      </footer>
    );
  }
  return (
    <footer data-testid="legal-footer" className={`text-center text-xs text-slate-400 py-3 px-4 ${className}`}>
      Created by <span className="font-semibold text-slate-500">SystemNex Techsolutions LLP</span>. All rights
      reserved. TM Number: <span className="font-mono text-slate-500">7810892</span>.
    </footer>
  );
}

export default LegalFooter;
