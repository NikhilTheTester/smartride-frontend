// Distance between two GPS points in metres (Haversine formula)
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// Rough ETA assuming an average city speed of 25 km/h
export function etaMinutes(m) {
  return Math.max(1, Math.round(m / ((25 * 1000) / 60)));
}

// Browser GPS with a fallback (Hyderabad centre) so the SOS button always works
export function getCurrentPosition() {
  const fallback = { lat: 17.385, lng: 78.4867 };
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(fallback);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(fallback),
      { timeout: 4000 }
    );
  });
}

// Speak a message aloud using the browser's built-in text-to-speech
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.lang = 'en-IN';
  window.speechSynthesis.speak(u);
}

export const today = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};
