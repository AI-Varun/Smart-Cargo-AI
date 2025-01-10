import React, { useState, useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useApi } from '../../hooks/useApi';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import debounce from 'lodash/debounce';
import { MapPin, Search, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './PlantLocationForm.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEventHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

function MapUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    // Add safety checks to prevent null/undefined errors
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

const PlantLocationForm = ({ onSubmit, onCancel, onLocationSelect }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: {
      type: 'Point',
      coordinates: [51.505, -0.09] // Default coordinates
    }
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();
  
  const handleMapClick = (latlng) => {
    const newLocation = {
      ...formData,
      location: {
        type: 'Point',
        coordinates: [latlng.lng, latlng.lat]
      }
    };
    setFormData(newLocation);

    if (onLocationSelect) {
      onLocationSelect({
        name: formData.name || 'New Location',
        location: newLocation.location,
        address: formData.address
      });
    }
  };
  
  const searchAddress = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      const response = await api.get(`/plant-locations/search-address?query=${encodeURIComponent(query)}`);
      setSuggestions(response || []);
      setLoading(false);
    }, 300),
    [api]
  );

  const handleAddressSelect = (suggestion) => {
    const newLocation = {
      ...formData,
      address: suggestion.display_name,
      location: {
        type: 'Point',
        coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)]
      }
    };
    setFormData(newLocation);
    setSuggestions([]);
    
    // Notify parent component about location change
    if (onLocationSelect) {
      onLocationSelect({
        name: newLocation.name || 'New Location',
        location: newLocation.location,
        address: newLocation.address
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.coordinates.length) {
      alert('Please select a valid address');
      return;
    }
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="plant-location-form p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Plant Location</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <Input
            placeholder="Enter plant name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full"
          />
        </div>
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <Input
            placeholder="Search for an address"
            value={formData.address}
            onChange={(e) => {
              setFormData({ ...formData, address: e.target.value });
              searchAddress(e.target.value);
            }}
            className="w-full"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex items-start gap-2 border-b border-gray-100 last:border-0"
                  onClick={() => handleAddressSelect(suggestion)}
                >
                  <MapPin className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{suggestion.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Location Map</label>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{formData.name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-semibold">{formData.address || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Latitude</p>
                <p className="font-semibold">
                  {formData.location.coordinates[1] !== undefined 
                    ? formData.location.coordinates[1].toFixed(6) 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Longitude</p>
                <p className="font-semibold">
                  {formData.location.coordinates[0] !== undefined 
                    ? formData.location.coordinates[0].toFixed(6) 
                    : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button onClick={handleSubmit} className="px-4 py-2">Save</Button>
        <Button 
          onClick={onCancel} 
          variant="secondary" 
          className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PlantLocationForm;
