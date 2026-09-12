import React from "react";

export function Logo({ size = 40, showText = true, textClass = "" }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="casafeast-logo">
      <div
        className="brand-cream rounded-xl flex items-center justify-center border border-[#F3EFE6] shadow-soft overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src="/casafeast_logo.png"
          alt="Casafeast"
          className="object-contain"
          style={{ width: size * 1.4, height: size * 1.4 }}
        />
      </div>
      {showText && (
        <div className="leading-none">
          <div className={`font-display font-extrabold text-[#15803D] text-xl tracking-tight ${textClass}`}>
            Casa<span className="text-[#1D4ED8]">feast</span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 tracking-wide mt-0.5">
            Home-cooked. Planet-friendly.
          </div>
        </div>
      )}
    </div>
  );
}

export default Logo;
