import React from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentForm from '../components/shipments/ShipmentForm';

const NewShipment = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/shipments');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Shipment</h1>
        <p className="text-gray-500">Fill in the details to create a new shipment</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <ShipmentForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default NewShipment;
