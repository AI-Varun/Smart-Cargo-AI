import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import PlantLocationForm from '../../components/locations/PlantLocationForm';
import PlantLocationList from '../../components/locations/PlantLocationList';
import MapView from '../../components/shared/MapView';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-hot-toast';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapBounds({ markers }) {
    const map = useMap();
  
    React.useEffect(() => {
      if (!markers || markers.length === 0) return;
  
      const bounds = L.latLngBounds(markers.map(marker => marker.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    }, [markers, map]);
  
    return null;
  }
  

const PlantLocationsPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const api = useApi();

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleCreateLocation = async (formData) => {
    try {
      await api.post('/plant-locations', formData);
      toast.success('Plant location created successfully');
      setIsFormVisible(false);
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error('Error creating plant location:', error);
      toast.error(error.response?.data?.message || 'Failed to create plant location');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Plant Locations</h1>
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isFormVisible ? 'Cancel' : 'Add Location'}
            </button>
          </div>

          {isFormVisible ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Location</h2>
              <PlantLocationForm 
                onSubmit={handleCreateLocation}
                onCancel={() => setIsFormVisible(false)}
              />
            </div>
          ) : (
            <PlantLocationList onSelect={handleLocationSelect} />
          )}
        </div>

        <div className="sticky top-4">
          <h2 className="text-xl font-semibold mb-4">Location Map</h2>
          <div className="h-[600px] rounded-lg overflow-hidden border">
            {selectedLocation ? (
              <MapContainer 
                center={[
                    selectedLocation.location.coordinates[1],
                    selectedLocation.location.coordinates[0]
                  ]}
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                   <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapBounds markers={[{
                      position: [
                        selectedLocation.location.coordinates[1],
                        selectedLocation.location.coordinates[0]
                      ],
                      popup: selectedLocation.name
                    }]}/>
                    
                    <Marker 
                    position={[
                        selectedLocation.location.coordinates[1],
                        selectedLocation.location.coordinates[0]
                    ]}>
                        <Popup>{selectedLocation.name}</Popup>
                    </Marker>
              </MapContainer>
            ) : (
              <div className="h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Select a location to view on map</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantLocationsPage;