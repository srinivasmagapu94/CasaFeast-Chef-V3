import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPinOff, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { requestLocation, ZONES } from "@/lib/geofence";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/shell/TopBar";
import { Sidebar } from "@/components/shell/Sidebar";
import { WelcomeDialog } from "@/components/shell/WelcomeDialog";

function GeofenceLock({ onSimulate, checking }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
        data-testid="geofence-lock"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-6">
          <MapPinOff className="h-9 w-9 text-red-400" />
        </div>
        <h1 className="font-display font-extrabold text-3xl text-white leading-tight">
          We are not serving your location at the moment.
        </h1>
        <p className="text-slate-400 mt-4 text-sm">
          Casafeast currently operates only in <span className="text-emerald-400 font-semibold">Visakhapatnam</span> and{" "}
          <span className="text-emerald-400 font-semibold">Bangalore</span>. Please enable location access from a serviceable city.
        </p>

        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">Demo · simulate a location</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONES.map((z) => (
              <Button
                key={z.name}
                data-testid={`geo-simulate-${z.name.toLowerCase()}`}
                onClick={() => onSimulate(z.name)}
                disabled={checking}
                className="bg-[#15803D] hover:bg-[#166534] text-white"
              >
                <MapPin className="h-4 w-4" /> {z.name}
              </Button>
            ))}
          </div>
          <Button
            data-testid="geo-simulate-other"
            variant="ghost"
            onClick={() => onSimulate(null)}
            disabled={checking}
            className="w-full mt-2 text-slate-400 hover:text-white hover:bg-white/5"
          >
            Simulate other (blocked) location
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardShell() {
  const { chef, loading, geoAllowed, setGeo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(!geoAllowed);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (geoAllowed) {
      setChecking(false);
      return;
    }
    (async () => {
      setChecking(true);
      const res = await requestLocation();
      if (res.ok && res.zone) {
        setGeo(true, res.zone);
        setLocked(false);
      } else {
        setLocked(true);
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulate = (zone) => {
    setChecking(true);
    setTimeout(() => {
      if (zone) {
        setGeo(true, zone);
        setLocked(false);
      } else {
        setLocked(true);
      }
      setChecking(false);
    }, 500);
  };

  if (loading || (checking && !geoAllowed)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" />
        <p className="text-sm">Verifying your location…</p>
      </div>
    );
  }

  if (!geoAllowed && locked) {
    return <GeofenceLock onSimulate={simulate} checking={checking} />;
  }

  const activated = chef?.isActivated;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <TopBar />
      <div className="flex flex-1 max-w-[1600px] w-full mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8" data-testid="workspace-main">
          <Outlet />
        </main>
      </div>
      <LegalFooter className="border-t border-slate-200 bg-white" />
      {!activated && location.pathname !== "/app/onboarding" && (
        <WelcomeDialog onGoOnboarding={() => navigate("/app/onboarding")} />
      )}
    </div>
  );
}
