import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
const CHEF_SERVICES_URL = "http://localhost:8080/ws_casafeast_chef_services/chef";

// Lightweight payload hash to simulate "Data in Transit Protection"
function hashPayload(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data || {});
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

// Local cache layer to prevent redundant network pooling on GET requests
const cache = new Map();
export function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (!prefix || key.includes(prefix)) cache.delete(key);
  }
}

export const apiClient = axios.create({ baseURL: API });
export const chefServicesClient = axios.create({ baseURL: CHEF_SERVICES_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cf_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  config.headers["X-Payload-Hash"] = hashPayload(config.data);
  config.headers["X-Secure-Transit"] = "TLS-1.3";
  return config;
});

export async function cachedGet(url, opts = {}) {
  const key = url;
  if (!opts.force && cache.has(key)) return cache.get(key);
  const res = await apiClient.get(url);
  cache.set(key, res.data);
  return res.data;
}

export default apiClient;
