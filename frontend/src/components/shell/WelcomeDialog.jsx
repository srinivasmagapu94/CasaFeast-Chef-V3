import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight } from "lucide-react";

export function WelcomeDialog({ onGoOnboarding }) {
  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="welcome-dialog"
      >
        <DialogTitle className="sr-only">Welcome to Casafeast — complete onboarding</DialogTitle>
        <div className="text-center py-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
            <PartyPopper className="h-8 w-8 text-[#15803D]" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900">Welcome to Casafeast!</h2>
          <p className="text-slate-500 mt-3 text-sm">
            Please complete On-boarding to start receiving the orders.
          </p>
          <Button
            data-testid="welcome-onboarding-button"
            onClick={onGoOnboarding}
            className="w-full mt-6 bg-[#1D4ED8] hover:bg-[#1E40AF] h-11 group"
          >
            Start Onboarding <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
