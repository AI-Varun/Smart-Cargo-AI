import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import { MapPin, Trash2, ChevronRight, Loader2 } from 'lucide-react';

const PlantLocationList = ({ onSelect }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/plant-locations');
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching plant locations:', error);
      setError('Failed to load plant locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }
    
    try {
      await api.delete(`/plant-locations/${id}`);
      fetchLocations();
    } catch (error) {
      console.error('Error deleting plant location:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <Button onClick={fetchLocations} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <MapPin className="w-12 h-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Locations Found</h3>
        <p className="text-gray-500 text-sm">Add your first plant location to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {locations.map((location) => (
          <div
            key={location._id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900 mb-1">{location.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{location.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDelete(location._id)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onSelect?.(location)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {location.location.coordinates[1].toFixed(6)}, {location.location.coordinates[0].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlantLocationList;
