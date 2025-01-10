import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Tab } from '@headlessui/react';
import { Truck, Ship, Calendar, Package, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import './ShipmentTracker.css';

const ShipmentTracker = () => {
  const [activeShipments, setActiveShipments] = useState({
    trucks: [],
    ships: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center of India

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/shipments');
      
      // Filter out shipments without coordinates and separate by vehicle type
      const validShipments = data.filter(s => 
        s.source?.coordinates?.length === 2 && 
        s.destination?.coordinates?.length === 2
      );
      
      const trucks = validShipments.filter(s => s.vehicleType === 'Truck');
      const ships = validShipments.filter(s => s.vehicleType === 'Ship');
      
      setActiveShipments({ trucks, ships });
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipments on mount and when component gains focus
  useEffect(() => {
    fetchShipments();

    // Add event listener for when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchShipments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const ShipmentCard = ({ shipment }) => (
    <div 
      className={`shipment-card ${selectedShipment?.id === shipment.id ? 'selected' : ''}`}
      onClick={() => {
        setSelectedShipment(shipment);
        const [lng, lat] = shipment.currentLocation.coordinates;
        setMapCenter([lat, lng]);
      }}
    >
      <div className="card-header">
        <div className="shipment-icon">
          {shipment.vehicleType === 'Truck' ? <Truck size={24} /> : <Ship size={24} />}
        </div>
        <div className="shipment-id">#{shipment.shipmentId}</div>
        <div className={`status-badge ${shipment.status}`}>
          {shipment.status}
        </div>
      </div>

      <div className="card-content">
        <div className="info-row">
          <Calendar size={16} />
          <span>ETA: {new Date(shipment.eta).toLocaleDateString()}</span>
        </div>
        <div className="info-row">
          <Package size={16} />
          <span>Contents: {shipment.contents.map(c => `${c.type} (${c.quantity})`).join(', ')}</span>
        </div>
        <div className="info-row">
          <MapPin size={16} />
          <span>From: {shipment.source.address}</span>
        </div>
        <div className="info-row">
          <MapPin size={16} />
          <span>To: {shipment.destination.address}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="shipment-tracker">
      <Tab.Group>
        <Tab.List className="tab-list">
          <Tab className={({ selected }) => `tab ${selected ? 'selected' : ''}`}>
            <Truck size={20} />
            <span>Trucks ({activeShipments.trucks.length})</span>
          </Tab>
          <Tab className={({ selected }) => `tab ${selected ? 'selected' : ''}`}>
            <Ship size={20} />
            <span>Ships ({activeShipments.ships.length})</span>
          </Tab>
        </Tab.List>

        <div className="tracker-content">
          <Tab.Panels className="shipment-list">
            <Tab.Panel>
              {loading ? (
                <div className="loading">Loading trucks...</div>
              ) : activeShipments.trucks.length > 0 ? (
                activeShipments.trucks.map(shipment => (
                  <ShipmentCard key={shipment.id} shipment={shipment} />
                ))
              ) : (
                <div className="no-shipments">No active truck shipments</div>
              )}
            </Tab.Panel>
            <Tab.Panel>
              {loading ? (
                <div className="loading">Loading ships...</div>
              ) : activeShipments.ships.length > 0 ? (
                activeShipments.ships.map(shipment => (
                  <ShipmentCard key={shipment.id} shipment={shipment} />
                ))
              ) : (
                <div className="no-shipments">No active ship shipments</div>
              )}
            </Tab.Panel>
          </Tab.Panels>

          <div className="map-container">
            <MapContainer center={mapCenter} zoom={5} className="map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {[...activeShipments.trucks, ...activeShipments.ships].map(shipment => (
                <Marker 
                  key={shipment.id}
                  position={[
                    shipment.currentLocation?.coordinates?.[1] ?? shipment.source.coordinates[1],
                    shipment.currentLocation?.coordinates?.[0] ?? shipment.source.coordinates[0]
                  ]}
                >
                  <Popup>
                    <div>
                      <h3>Shipment #{shipment.shipmentId}</h3>
                      <p>Status: {shipment.status}</p>
                      <p>Vehicle: {shipment.vehicleType}</p>
                      <p>ETA: {new Date(shipment.eta).toLocaleDateString()}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </Tab.Group>
    </div>
  );
};

export default ShipmentTracker;
