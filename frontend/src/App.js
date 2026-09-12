import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import DashboardShell from "@/components/shell/DashboardShell";
import Onboarding from "@/pages/Onboarding";
import CreateMenu from "@/pages/menu/CreateMenu";
import MenuCatalog from "@/pages/menu/MenuCatalog";
import Orders from "@/pages/Orders";
import Revenue from "@/pages/Revenue";
import AdminPanel from "@/pages/AdminPanel";
import DashboardHome from "@/pages/DashboardHome";

function Protected({ children }) {
  const { chefUUID, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  if (!chefUUID) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route
              path="/app"
              element={
                <Protected>
                  <DashboardShell />
                </Protected>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="menu/create" element={<CreateMenu />} />
              <Route path="menu/active" element={<MenuCatalog mode="active" />} />
              <Route path="menu/inactive" element={<MenuCatalog mode="inactive" />} />
              <Route path="orders" element={<Orders />} />
              <Route path="revenue" element={<Revenue />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
