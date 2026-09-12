// Serviceable zones: Visakhapatnam (Vizag) and Bangalore
export const ZONES = [
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, radiusKm: 60 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, radiusKm: 60 },
];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchZone(lat, lng) {
  for (const z of ZONES) {
    if (distanceKm(lat, lng, z.lat, z.lng) <= z.radiusKm) return z.name;
  }
  return null;
}

export function requestLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, reason: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const zone = matchZone(pos.coords.latitude, pos.coords.longitude);
        resolve({ ok: !!zone, zone, coords: pos.coords });
      },
      () => resolve({ ok: false, reason: "denied" }),
      { timeout: 8000 }
    );
  });
}
