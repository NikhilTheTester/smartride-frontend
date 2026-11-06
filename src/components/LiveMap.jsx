import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';

// Zooms the map so that every marker is visible (only when the set of markers changes)
function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * Map built with Leaflet + OpenStreetMap (free, no API key).
 * cabs:   [{ id, label, lat, lng }]            -> blue big dots
 * places: [{ id, label, lat, lng, color }]     -> small coloured dots (pickup / drops)
 */
export default function LiveMap({ cabs = [], places = [], height = 360 }) {
  const all = [...cabs, ...places].filter((p) => p.lat != null && p.lng != null);
  return (
    <div className="map-box" style={{ height }}>
      <MapContainer center={[17.4435, 78.3772]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={all} />
        {places
          .filter((p) => p.lat != null)
          .map((p) => (
            <CircleMarker
              key={`p-${p.id}`}
              center={[p.lat, p.lng]}
              radius={8}
              pathOptions={{ color: p.color || '#e67e22', fillColor: p.color || '#e67e22', fillOpacity: 0.85 }}
            >
              <Tooltip>{p.label}</Tooltip>
            </CircleMarker>
          ))}
        {cabs
          .filter((c) => c.lat != null)
          .map((c) => (
            <CircleMarker
              key={`c-${c.id}`}
              center={[c.lat, c.lng]}
              radius={12}
              pathOptions={{ color: '#0b3d91', fillColor: '#1e6fff', fillOpacity: 0.95 }}
            >
              <Tooltip permanent direction="top">
                🚖 {c.label}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
