import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths bị vỡ khi bundle qua Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icon tuỳ chỉnh màu akai (#E63946)
const redIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path fill="#E63946" stroke="#b02030" stroke-width="1.5"
          d="M14 1C7.373 1 2 6.373 2 13c0 8.75 12 22 12 22s12-13.25 12-22C26 6.373 20.627 1 14 1z"/>
        <circle cx="14" cy="13" r="5" fill="#fff" opacity="0.9"/>
      </svg>
    `),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
});

/** Tự động cập nhật center map khi lat/lng thay đổi */
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  address?: string;
  height?: number;        // chiều cao px, default 180
  zoom?: number;          // zoom level, default 15
  className?: string;
}

/**
 * MapPreview — Hiển thị bản đồ Leaflet + OpenStreetMap tại tọa độ cho trước.
 * Hoàn toàn miễn phí, không cần API key.
 */
export default function MapPreview({
  lat,
  lng,
  address,
  height = 180,
  zoom = 15,
  className = '',
}: Props) {
  if (!lat || !lng) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <RecenterMap lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={redIcon}>
          {address && (
            <Popup closeButton={false} className="leaflet-popup-akai">
              <span className="text-xs font-medium text-gray-700 whitespace-normal max-w-[220px] block">
                {address}
              </span>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
