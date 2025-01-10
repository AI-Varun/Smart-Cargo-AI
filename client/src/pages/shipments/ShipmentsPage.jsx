import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import MapView from '../../components/shared/MapView';
import ShipmentForm from '../../components/shipments/ShipmentForm';
import api from '../../services/api';
import { 
  Plus, 
  Truck, 
  Ship, 
  ArrowRight, 
  Calendar, 
  Package, 
  MapPin,
  X
} from 'lucide-react';

const ShipmentsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await api.get('/shipments');
      setShipments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('Failed to fetch shipments');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (shipment, newStatus) => {
    try {
      await api.put(`/shipments/${shipment._id}/status`, { status: newStatus });
      fetchShipments();
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Calculate stats
  const stats = {
    active: shipments.filter(s => s.status === 'pending' || s.status === 'in-transit').length,
    inTransit: shipments.filter(s => s.status === 'in-transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => {
      const isLate = new Date(s.eta) < new Date() && s.status !== 'delivered';
      return isLate;
    }).length
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all your shipments in real-time</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Active Shipments</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.active}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">In Transit</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.inTransit}</p>
            </div>
            <Truck className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Delivered</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{stats.delivered}</p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delayed</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.delayed}</p>
            </div>
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Shipment Info
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Vehicle Details
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Route
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr 
                  key={shipment._id}
                  onClick={() => setSelectedShipment(shipment)}
                  className={`group cursor-pointer transition-colors
                    ${selectedShipment?._id === shipment._id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        shipment.status === 'delivered' ? 'bg-green-500' :
                        shipment.status === 'in-transit' ? 'bg-blue-500' :
                        shipment.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">#{shipment.shipmentId}</div>
                        <div className="text-sm text-gray-500">Created {new Date(shipment.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                        {shipment.vehicleType === 'Truck' ? 
                          <Truck className="w-5 h-5 text-gray-600" /> : 
                          <Ship className="w-5 h-5 text-gray-600" />
                        }
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shipment.vehicleType}</div>
                        {shipment.vehicle && (
                          <div className="text-sm text-gray-500">
                            {shipment.vehicle.registrationNumber}
                            {shipment.vehicle.driverName && 
                              <span className="text-gray-400"> • {shipment.vehicle.driverName}</span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600 font-medium truncate max-w-[200px]">
                          {shipment.source.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600 font-medium truncate max-w-[200px]">
                          {shipment.destination.address}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1.5 w-fit
                        ${shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${shipment.status === 'pending' ? 'bg-yellow-500' :
                          shipment.status === 'in-transit' ? 'bg-blue-500' :
                          shipment.status === 'delivered' ? 'bg-green-500' :
                          shipment.status === 'cancelled' ? 'bg-red-500' :
                          'bg-gray-500'}`}
                        />
                        {shipment.status === 'in-transit' ? 'In Transit' : 
                         shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                      </span>
                      <select
                        value={shipment.status}
                        onChange={(e) => handleStatusUpdate(shipment, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700
                          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                          focus:border-blue-500 transition-colors cursor-pointer w-full
                          dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      >
                        <option value="pending" className="text-gray-700 bg-white dark:text-white dark:bg-gray-800">Set as Pending</option>
                        <option value="in-transit" className="text-gray-700 bg-white dark:text-white dark:bg-gray-800">Set as In Transit</option>
                        <option value="delivered" className="text-gray-700 bg-white dark:text-white dark:bg-gray-800">Set as Delivered</option>
                        <option value="cancelled" className="text-gray-700 bg-white dark:text-white dark:bg-gray-800">Set as Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className={`text-sm font-medium ${
                          new Date(shipment.eta) < new Date() && shipment.status !== 'delivered'
                            ? 'text-red-600'
                            : 'text-gray-700'
                        }`}>
                          {new Date(shipment.eta).toLocaleDateString()}
                        </span>
                      </div>
                      {shipment.status === 'in-transit' && (
                        <div className="text-sm text-gray-600">
                          {Math.round(Math.random() * 100)}% completed
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShipment(shipment);
                      }}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 
                        font-medium text-sm bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-1.5
                        transition-colors active:bg-blue-200"
                    >
                      <MapPin className="w-4 h-4" />
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Modal */}
      {selectedShipment && (
        <MapView 
          shipment={selectedShipment} 
          onClose={() => setSelectedShipment(null)}
        />
      )}

      {/* New Shipment Form Modal */}
      {showForm && (
        <ShipmentForm
          onClose={() => setShowForm(false)}
          onSubmit={fetchShipments}
        />
      )}
    </div>
  );
};

export default ShipmentsPage;
