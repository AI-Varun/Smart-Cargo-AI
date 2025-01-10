import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Ship, X } from 'lucide-react';
import api from '../../services/api';
import polyline from '@mapbox/polyline';
import { decode } from '@mapbox/polyline';
// Fix for default marker icons in production
L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.7.1/dist/images/';

// Custom marker icons
const createCustomIcon = (color) => {
    return L.divIcon({
        html: `<div class="w-4 h-4 rounded-full bg-${color}-500 border-2 border-white shadow-lg flex items-center justify-center">
      <div class="w-2 h-2 rounded-full bg-${color}-300"></div>
    </div>`,
        className: 'custom-div-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

// Openrouteservice API to "snap to road"
const fetchORSroute = async (start, end) => {
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=polyline`
        );
        const data = await response.json();
        console.log("OSRM Response:", data);

        if (data.code === 'Ok' && data.routes && data.routes.length > 0 && data.routes[0] && data.routes[0].geometry) {
             // Decode the polyline string
            const decodedCoordinates = decode(data.routes[0].geometry);
             // The decoded coordinates are already in [lat, lng] format that Leaflet expects
            return decodedCoordinates;
        } else {
            console.error('Invalid OSRM response, falling back to direct line:', data);
            // Fallback to direct route
        return [
            [start[1], start[0]],
            [end[1], end[0]]
        ];
        }
    } catch (error) {
        console.error('Error fetching route:', error);
        return [
            [start[1], start[0]],
            [end[1], end[0]]
        ];
    }
};

const MapView = ({
    shipment = null,
    vehicles = [], // Add support for vehicles
    onClose = null,
    markers = [],
    route = null,
    className = '',
    height = '100%',
    width = '100%',
    onVehicleClick = () => {} // Add optional click handler
}) => {
    const mapRef = useRef(null);
    const [predictedPath, setPredictedPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPredictedPath, setShowPredictedPath] = useState(false);

    const initialMapCenter = [20.5937, 78.9629]; // India center
    const initialZoom = 5;

    // Safely extract coordinates for a vehicle/ship
    const getCoordinates = (vehicle, fallback = [20.5937, 78.9629]) => {
        console.log('Extracting vehicle coordinates:', vehicle);

        // Check for location object with coordinates
        if (vehicle?.location?.coordinates) {
            const coords = vehicle.location.coordinates;
            console.log('Coordinates from location:', coords);
            
            // Ensure coordinates are valid
            if (Array.isArray(coords) && coords.length === 2) {
                return [coords[1], coords[0]]; // Reverse for Leaflet
            }
        }

        // Fallback checks
        if (vehicle?.coordinates) {
            return vehicle.coordinates;
        }

        console.warn('No valid coordinates found', { 
            vehicle, 
            fallback 
        });

        return fallback.reverse(); // Reverse to match [lat, lon]
    };

    // Determine map center and markers
    const mapCenter = vehicles.length > 0 
        ? getCoordinates(vehicles[0]) 
        : initialMapCenter;

    return (
        <MapContainer
            center={mapCenter}
            zoom={initialZoom}
            style={{ height, width }}
            ref={mapRef}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Render vehicle/ship markers */}
            {vehicles.map((vehicle, index) => {
                const coords = getCoordinates(vehicle);
                console.log(`Vehicle ${index} coordinates:`, coords);
                
                return (
                    <Marker 
                    key={vehicle._id || index} 
                    position={coords}
                    icon={createCustomIcon('blue')}
                    eventHandlers={{
                        click: () => onVehicleClick(vehicle)
                    }}
                >
                    <Popup>
                        <div style={{ color: 'black' }}>
                            <strong>{vehicle.name || 'Vehicle'}</strong>
                            <br />
                            Status: {vehicle.status || 'Unknown'}
                            <br />
                            Location: {coords.join(', ')}
                        </div>
                    </Popup>
                </Marker>
                );
            })}
        </MapContainer>
    );
};

export default MapView;