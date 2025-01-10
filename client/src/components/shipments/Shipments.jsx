import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { toast } from 'react-hot-toast';
import { PlusIcon } from 'lucide-react';

const ShipmentForm = ({ onSuccess, onClose }) => {
    const [formData, setFormData] = useState({
        pickupLocationId: '',
        deliveryAddress: '',
        deliveryCoordinates: null,
        vehicleType: 'Truck',
        vehicleId: '',
        cargo: '',
        weight: '',
        estimatedDeliveryTime: ''
    });

    const [loading, setLoading] = useState(false);
    const [plantLocations, setPlantLocations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [route, setRoute] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
const [filteredShipments, setFilteredShipments] = useState([]);
const [sortBy, setSortBy] = useState('date');
const [filterStatus, setFilterStatus] = useState('all');
    const api = useApi();

    useEffect(() => {
        fetchPlantLocations();
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (selectedLocation && formData.deliveryCoordinates) {
            fetchRoute();
        }
    }, [selectedLocation, formData.deliveryCoordinates]);

    const fetchPlantLocations = async () => {
        try {
            const data = await api.get('/plant-locations');
            setPlantLocations(data);
        } catch (error) {
            toast.error('Failed to fetch plant locations');
            console.error('Error fetching plant locations:', error);
        }
    };

    const fetchVehicles = async () => {
        try {
            const data = await api.get(`/${formData.vehicleType.toLowerCase()}s`);
            setVehicles(data);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchRoute = async () => {
        if (!selectedLocation?.location?.coordinates || !formData.deliveryCoordinates) return;

        const startCoords = [selectedLocation.location.coordinates[0], selectedLocation.location.coordinates[1]];
        const endCoords = [formData.deliveryCoordinates[0], formData.deliveryCoordinates[1]];

        const routeData = await getRoute(startCoords, endCoords);
        if (routeData) {
            setRoute(routeData);
        }
    };

    const debouncedSearchAddress = debounce(async (query) => {
        if (!query) {
            setAddressSuggestions([]);
            return;
        }
        const results = await searchAddress(query);
        setAddressSuggestions(results);
    }, 300);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'vehicleType') {
            fetchVehicles();
        }

        if (name === 'deliveryAddress') {
            debouncedSearchAddress(value);
        }
    };


    const handleAddressSelect = (suggestion) => {
        setFormData(prev => ({
            ...prev,
            deliveryAddress: suggestion.display_name,
            deliveryCoordinates: [suggestion.lon, suggestion.lat]
        }));
        setAddressSuggestions([]);
    };

    const handlePickupLocationSelect = (locationId) => {
        const location = plantLocations.find(loc => loc._id === locationId);
        setSelectedLocation(location);
        setFormData(prev => ({ ...prev, pickupLocationId: locationId }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const selectedPickupLocation = plantLocations.find(loc => loc._id === formData.pickupLocationId);

            const shipmentData = {
                source: {
                    coordinates: selectedPickupLocation.location.coordinates,
                    address: selectedPickupLocation.address
                },
                destination: {
                    coordinates: formData.deliveryCoordinates,
                    address: formData.deliveryAddress
                },
                vehicleType: formData.vehicleType,
                vehicle: formData.vehicleId,
                eta: new Date(formData.estimatedDeliveryTime).toISOString(),
                contents: [{
                    type: formData.cargo,
                    quantity: parseFloat(formData.weight)
                }]
            };

            await api.post('/shipments', shipmentData);
            toast.success('Shipment created successfully');
            setFormData({
                pickupLocationId: '',
                deliveryAddress: '',
                deliveryCoordinates: null,
                vehicleType: 'Truck',
                vehicleId: '',
                cargo: '',
                weight: '',
                estimatedDeliveryTime: ''
            });
            setRoute(null);
            setCurrentStep(1);
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create shipment');
            console.error('Error creating shipment:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && (!formData.pickupLocationId || !formData.deliveryAddress)) {
            toast.error('Please select pickup and delivery locations');
            return;
        }
        if (currentStep === 2 && (!formData.vehicleType || !formData.vehicleId)) {
            toast.error('Please select vehicle type and vehicle');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };
    // Helper function to determine badge variant based on shipment status
const getShipmentStatusVariant = (status) => {
    switch(status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'secondary';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Search and filter handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const filtered = shipments.filter(shipment => 
      shipment.trackingNumber.toLowerCase().includes(query.toLowerCase()) ||
      shipment.source.address.toLowerCase().includes(query.toLowerCase()) ||
      shipment.destination.address.toLowerCase().includes(query.toLowerCase()) ||
      shipment.contents[0].type.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredShipments(filtered);
  };
  
  // View shipment details handler
  const handleViewShipmentDetails = (shipment) => {
    // Implement modal or navigation to shipment details
    console.log('View shipment details:', shipment);
  };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step === currentStep
                                ? 'bg-blue-500 text-white'
                                : step < currentStep
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {step < currentStep ? '✓' : step}
                    </div>
                    {step < 3 && (
                        <div
                            className={`w-16 h-1 ${
                                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    

    const renderLocationStep = () => (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        Pickup Location
                    </label>
                    <select
                        name="pickupLocationId"
                        value={formData.pickupLocationId}
                        onChange={(e) => handlePickupLocationSelect(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white text-gray-900"
                        required
                    >
                        <option value="">Select Plant Location</option>
                        {plantLocations.map(location => (
                            <option key={location._id} value={location._id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <label className="flex items-center text-sm font-medium mb-1">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        Delivery Address
                    </label>
                    <Input
                        type="text"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Enter delivery address"
                        required
                        className="bg-white text-gray-900"
                    />
                    {addressSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {addressSuggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                                    onClick={() => handleAddressSelect(suggestion)}
                                >
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[400px] rounded-lg overflow-hidden">
                {selectedLocation && formData.deliveryCoordinates ? (
                    <MapView
                        markers={[
                            {
                                position: [
                                    selectedLocation.location.coordinates[1],
                                    selectedLocation.location.coordinates[0]
                                ],
                                popup: 'Pickup: ' + selectedLocation.name
                            },
                            {
                                position: [formData.deliveryCoordinates[1], formData.deliveryCoordinates[0]],
                                popup: 'Delivery: ' + formData.deliveryAddress
                            }
                        ]}
                        route={route?.geometry}
                        className="h-full w-full"
                    />
                ) : (
                    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Select pickup and delivery locations to view route</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderVehicleStep = () => (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        {formData.vehicleType === 'Truck' ? (
                            <TruckIcon className="w-4 h-4 mr-1" />
                        ) : (
                            <ShipIcon className="w-4 h-4 mr-1" />
                        )}
                        Vehicle Type
                    </label>
                    <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md bg-white text-gray-900"
                        required
                    >
                        <option value="Truck">Truck</option>
                        <option value="Ship">Ship</option>
                    </select>
                </div>

                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        {formData.vehicleType === 'Truck' ? (
                            <TruckIcon className="w-4 h-4 mr-1" />
                        ) : (
                            <ShipIcon className="w-4 h-4 mr-1" />
                        )}
                        Vehicle
                    </label>
                    <select
                        name="vehicleId"
                        value={formData.vehicleId}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md bg-white text-gray-900"
                        required
                    >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.name || vehicle.registrationNumber}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {vehicles.map(vehicle => (
                    <Card
                        key={vehicle._id}
                        className={`p-4 cursor-pointer transition-all ${
                            formData.vehicleId === vehicle._id
                                ? 'ring-2 ring-blue-500'
                                : 'hover:border-blue-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, vehicleId: vehicle._id }))}
                    >
                        <div className="flex items-center space-x-3">
                            {formData.vehicleType === 'Truck' ? (
                                <TruckIcon className="w-8 h-8 text-blue-500" />
                            ) : (
                                <ShipIcon className="w-8 h-8 text-blue-500" />
                            )}
                            <div>
                                <h3 className="font-semibold">
                                    {vehicle.name || vehicle.registrationNumber}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Capacity: {vehicle.capacity} tons
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderCargoStep = () => (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        <PackageIcon className="w-4 h-4 mr-1" />
                        Cargo Description
                    </label>
                    <Input
                        type="text"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleChange}
                        placeholder="Enter cargo description"
                        required
                        className="bg-white text-gray-900"
                    />
                </div>

                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        <ScaleIcon className="w-4 h-4 mr-1" />
                        Weight (kg)
                    </label>
                    <Input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Enter weight in kg"
                        required
                        className="bg-white text-gray-900"
                    />
                </div>

                <div>
                    <label className="flex items-center text-sm font-medium mb-1">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Estimated Delivery Time
                    </label>
                    <Input
                        type="datetime-local"
                        name="estimatedDeliveryTime"
                        value={formData.estimatedDeliveryTime}
                        onChange={handleChange}
                        required
                        className="bg-white text-gray-900"
                    />
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
                <h4 className="font-semibold mb-2">Shipment Summary</h4>
                <div className="space-y-2 text-sm">
                    <p>From: {selectedLocation?.name || 'Not selected'}</p>
                    <p>To: {formData.deliveryAddress || 'Not selected'}</p>
                    <p>Vehicle: {vehicles.find(v => v._id === formData.vehicleId)?.name || 'Not selected'}</p>
                    <p>Cargo: {formData.cargo || 'Not specified'}</p>
                    <p>Weight: {formData.weight ? `${formData.weight} kg` : 'Not specified'}</p>
                    {route && (
                        <>
                            <p>Distance: {(route.distance / 1000).toFixed(1)} km</p>
                            <p>Duration: {Math.round(route.duration / 60)} minutes</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
                {currentStep === 1
                  ? 'Select Locations'
                  : currentStep === 2
                    ? 'Choose Vehicle'
                    : 'Cargo Details'}
            </h2>
            <Button type="button" onClick={onClose} variant="ghost">
                <XIcon className="w-5 h-5" />
            </Button>
        </div>
            {renderStepIndicator()}

            <Card className="p-6">
                <div className="mb-6">

                    <p className="text-gray-500">
                        {currentStep === 1
                            ? 'Select pickup and delivery locations'
                            : currentStep === 2
                                ? 'Select vehicle type and specific vehicle'
                                : 'Enter cargo details and delivery time'}
                    </p>
                </div>

                {currentStep === 1 && renderLocationStep()}
                {currentStep === 2 && renderVehicleStep()}
                {currentStep === 3 && renderCargoStep()}

                <div className="flex justify-between mt-6">
                    {currentStep > 1 && (
                        <Button type="button" onClick={prevStep} variant="outline">
                            Back
                        </Button>
                    )}
                    {currentStep < 3 ? (
                        <Button type="button" onClick={nextStep} className="ml-auto">
                            Next
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={loading}
                            className="ml-auto bg-green-500 hover:bg-green-600"
                        >
                            {loading ? 'Creating...' : 'Create Shipment'}
                        </Button>
                    )}
                </div>
            </Card>
        </form>
    );
};

const Shipments = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const api = useApi();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const data = await api.get('/shipments');
      setShipments(data);
    } catch (error) {
      toast.error('Failed to fetch shipments');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchShipments();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              New Shipment
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[90vw] sm:w-[600px] lg:w-[900px] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Create New Shipment</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ShipmentForm onSuccess={handleFormSuccess} onClose={() => setIsFormOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
  
      {/* Search and Filter Section */}
      <div className="mb-6 flex space-x-4">
        <Input
          type="text"
          placeholder="Search shipments..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-grow"
        />
        
        {/* Status Filter Dropdown */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
  
        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>
  
      {/* Shipments Table/Grid */}
      <div className="grid gap-4">
        {(filteredShipments.length > 0 ? filteredShipments : shipments)
          .filter(shipment => 
            filterStatus === 'all' || shipment.status === filterStatus
          )
          .sort((a, b) => {
            switch(sortBy) {
              case 'date':
                return new Date(b.createdAt) - new Date(a.createdAt);
              case 'status':
                return a.status.localeCompare(b.status);
              default:
                return 0;
            }
          })
          .map(shipment => (
            <div key={shipment._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="font-bold text-primary mr-2">
                    #{shipment.trackingNumber}
                  </span>
                  <Badge 
                    variant={getShipmentStatusVariant(shipment.status)}
                  >
                    {shipment.status}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewShipmentDetails(shipment)}
                >
                  View Details
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">From:</p>
                  <p>{shipment.source.address}</p>
                </div>
                <div>
                  <p className="text-gray-600">To:</p>
                  <p>{shipment.destination.address}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cargo:</p>
                  <p>{shipment.contents[0].type} - {shipment.contents[0].quantity} kg</p>
                </div>
                <div>
                  <p className="text-gray-600">ETA:</p>
                  <p>{new Date(shipment.eta).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Shipments;