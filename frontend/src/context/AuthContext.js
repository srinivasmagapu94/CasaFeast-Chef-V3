import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient, invalidateCache } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [chefUUID, setChefUUID] = useState(() => localStorage.getItem("cf_uuid"));
  const [chef, setChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoAllowed, setGeoAllowed] = useState(() => sessionStorage.getItem("cf_geo") === "allowed");
  const [geoZone, setGeoZone] = useState(() => sessionStorage.getItem("cf_geo_zone") || "");

  const refreshChef = useCallback(async () => {
    const uuid = localStorage.getItem("cf_uuid");
    if (!uuid) {
      setChef(null);
      setLoading(false);
      return null;
    }
    try {
      invalidateCache(`/chef/${uuid}`);
      const res = await apiClient.get(`/chef/${uuid}`);
      setChef(res.data);
      return res.data;
    } catch (e) {
      setChef(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshChef();
  }, [refreshChef, chefUUID]);

  const login = (token, uuid) => {
    localStorage.setItem("cf_token", token);
    localStorage.setItem("cf_uuid", uuid);
    setChefUUID(uuid);
  };

  const logout = () => {
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_uuid");
    sessionStorage.removeItem("cf_geo");
    sessionStorage.removeItem("cf_geo_zone");
    setChefUUID(null);
    setChef(null);
    setGeoAllowed(false);
    invalidateCache();
  };

  const setGeo = (allowed, zone) => {
    setGeoAllowed(allowed);
    setGeoZone(zone || "");
    sessionStorage.setItem("cf_geo", allowed ? "allowed" : "denied");
    if (zone) sessionStorage.setItem("cf_geo_zone", zone);
  };

  return (
    <AuthContext.Provider
      value={{ chefUUID, chef, loading, login, logout, refreshChef, geoAllowed, geoZone, setGeo, setChefUUID }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
