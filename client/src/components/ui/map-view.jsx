import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export function MapView({ 
  markers = [], 
  center = [51.505, -0.09], 
  zoom = 13, 
  shipment = null,
  height = '400px' 
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    console.log('MapView Props:', { markers, center, zoom, shipment });
    
    // If shipment is provided, calculate bounds
    if (shipment && shipment.source?.coordinates && shipment.destination?.coordinates) {
      const sourceCoords = shipment.source.coordinates;
      const destCoords = shipment.destination.coordinates;
      
      const bounds = L.latLngBounds([
        [sourceCoords[1], sourceCoords[0]],  // Swap to [lat, lon]
        [destCoords[1], destCoords[0]]       // Swap to [lat, lon]
      ]);
      
      console.log('Calculated Bounds:', bounds);
      
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, center, zoom, shipment]);

  // Prepare markers, including shipment markers if available
  const mapMarkers = [...markers];
  if (shipment) {
    if (shipment.source?.coordinates) {
      mapMarkers.push({
        position: [shipment.source.coordinates[1], shipment.source.coordinates[0]],
        popup: 'Source Location'
      });
    }
    if (shipment.destination?.coordinates) {
      mapMarkers.push({
        position: [shipment.destination.coordinates[1], shipment.destination.coordinates[0]],
        popup: 'Destination Location'
      });
    }
  }

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {mapMarkers.map((marker, index) => (
        <Marker 
          key={index} 
          position={marker.position}
        >
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}