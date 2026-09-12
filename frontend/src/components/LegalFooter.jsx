import React from "react";

export function LegalFooter({ className = "" }) {
  return (
    <footer
      data-testid="legal-footer"
      className={`text-center text-xs text-slate-400 py-3 px-4 ${className}`}
    >
      Created by <span className="font-semibold text-slate-500">SystemNex Techsolutions LLP</span>. All
      rights reserved. TM Number: <span className="font-mono text-slate-500">7810892</span>.
    </footer>
  );
}

export default LegalFooter;
