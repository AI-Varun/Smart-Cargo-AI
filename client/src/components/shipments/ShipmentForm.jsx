import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import MapView from '../shared/MapView';
import { toast } from 'react-hot-toast';
import { searchAddress, getRoute } from '../../lib/osrm';
import { debounce } from 'lodash';
import {
    TruckIcon,
    ShipIcon,
    MapPinIcon,
    PackageIcon,
    ScaleIcon,
    ClockIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    CheckIcon
} from 'lucide-react';
import { WeightIcon } from 'lucide-react';

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

    const cargoTypes = [
        "General Freight",
        "Refrigerated Cargo",
        "Hazardous Materials",
        "Bulk Cargo",
        "Liquid Cargo",
        "Oversized Cargo",
        "Flatbed Cargo",
        "Automobiles",
        "Construction Materials",
        "Wood and Timber",
        "Textiles and Apparel",
        "Furniture",
        "Electronics",
        "Medical Supplies",
        "Food and Beverages"
    ];

    const [loading, setLoading] = useState(false);
    const [plantLocations, setPlantLocations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [route, setRoute] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const api = useApi();

    useEffect(() => {
        console.log("Initial formData:", formData);
        fetchPlantLocations();
        fetchVehicles(formData.vehicleType);
        console.log("useEffect - fetchPlantLocations & fetchVehicles - formData:", formData);
    }, []);

    useEffect(() => {
        if (selectedLocation && formData.deliveryCoordinates) {
            fetchRoute();
            console.log("useEffect - fetchRoute - formData:", formData);
        }
    }, [selectedLocation, formData.deliveryCoordinates]);

    const fetchPlantLocations = async () => {
        console.log("fetchPlantLocations called");
        try {
            const data = await api.get('/plant-locations');
            setPlantLocations(data);
            console.log("fetchPlantLocations - success:", data);
        } catch (error) {
            toast.error('Failed to fetch plant locations');
            console.error('fetchPlantLocations - error:', error);
        }
    };

    const fetchVehicles = async (vehicleType) => {
        console.log("fetchVehicles called - vehicleType:", vehicleType);
        try {
            const vehicleTypeLower = vehicleType.toLowerCase();
            const data = await api.get(`/${vehicleTypeLower}s`);
            setVehicles(data);
            console.log("fetchVehicles - success:", data, "for", vehicleTypeLower);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
            console.error('Error fetching vehicles:', error);
        }
    };


    const fetchRoute = async () => {
        console.log("fetchRoute called - selectedLocation:", selectedLocation, "formData.deliveryCoordinates:", formData.deliveryCoordinates);
        if (!selectedLocation?.location?.coordinates || !formData.deliveryCoordinates) {
            console.log("fetchRoute - early return - missing coords");
            return;
        }

        const startCoords = [selectedLocation.location.coordinates[0], selectedLocation.location.coordinates[1]];
        const endCoords = [formData.deliveryCoordinates[0], formData.deliveryCoordinates[1]];
        console.log("fetchRoute - startCoords:", startCoords, "endCoords:", endCoords);

        const routeData = await getRoute(startCoords, endCoords);
        if (routeData) {
            setRoute(routeData);
            console.log("fetchRoute - success:", routeData);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return renderLocationStep();
            case 2:
                return renderVehicleStep();
            case 3:
                return renderCargoStep();
            default:
                return renderLocationStep();
        }
    };

    const debouncedSearchAddress = debounce(async (query) => {
        if (!query) {
            console.log("debouncedSearchAddress - no query");
            setAddressSuggestions([]);
            return;
        }
        console.log("debouncedSearchAddress - query:", query);
        const results = await searchAddress(query);
        setAddressSuggestions(results);
        console.log("debouncedSearchAddress - results:", results);
    }, 300);

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log("handleChange - name:", name, "value:", value);
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            console.log("handleChange - updated formData:", newState);
            return newState;
        });
        if (name === 'deliveryAddress') {
            console.log("handleChange - deliveryAddress change detected - value:", value);
            debouncedSearchAddress(value);
        }
    };

    const handleAddressSelect = (suggestion) => {
        console.log("handleAddressSelect - suggestion:", suggestion);
        setFormData(prev => {
            const newState = {
                ...prev,
                deliveryAddress: suggestion.display_name,
                deliveryCoordinates: [suggestion.lon, suggestion.lat]
            }
            console.log("handleAddressSelect - updated formData:", newState);
            return newState;
        });
        setAddressSuggestions([]);
    };

    const handlePickupLocationSelect = (locationId) => {
        console.log("handlePickupLocationSelect - locationId:", locationId);
        const location = plantLocations.find(loc => loc._id === locationId);
        console.log("handlePickupLocationSelect - selected location:", location);
        setSelectedLocation(location);
        setFormData(prev => {
            const newState = { ...prev, pickupLocationId: locationId };
            console.log("handlePickupLocationSelect - updated formData:", newState);
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("handleSubmit called - formData:", formData);
        setLoading(true);
        try {
            const selectedPickupLocation = plantLocations.find(loc => loc._id === formData.pickupLocationId);
            console.log("handleSubmit - selectedPickupLocation:", selectedPickupLocation);
            // Validate and convert estimated delivery time
            let estimatedDeliveryTime = null;
            if (formData.estimatedDeliveryTime) {
                const deliveryDate = new Date(formData.estimatedDeliveryTime);
                if (!isNaN(deliveryDate.getTime())) {
                    estimatedDeliveryTime = deliveryDate.toISOString();
                } else {
                    console.log("handleSubmit - invalid estimated delivery time");
                    toast.error('Invalid estimated delivery time');
                    setLoading(false);
                    return;
                }
            }

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
                eta: estimatedDeliveryTime,
                contents: [{
                    type: formData.cargo,
                    quantity: parseFloat(formData.weight)
                }]
            };
            console.log("handleSubmit - shipmentData:", shipmentData);
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
            console.log("handleSubmit - success - reset form");
        } catch (error) {
            console.error("handleSubmit - error:", error);
            toast.error(error.response?.data?.message || 'Failed to create shipment');
        } finally {
            setLoading(false);
            console.log("handleSubmit - finally - loading set to false");
        }
    };

    const nextStep = () => {
        console.log("nextStep called - currentStep:", currentStep, "formData:", formData);
        if (currentStep === 1 && (!formData.pickupLocationId || !formData.deliveryAddress)) {
            console.log("nextStep - error - missing location data");
            toast.error('Please select pickup and delivery locations');
            return;
        }
        if (currentStep === 2 && (!formData.vehicleType || !formData.vehicleId)) {
            console.log("nextStep - error - missing vehicle data");
            toast.error('Please select vehicle type and vehicle');
            return;
        }
        if (currentStep === 3 && (!formData.cargo || !formData.weight)) {
            console.log("nextStep - error - missing cargo data");
            toast.error('Please select cargo type and enter weight');
            return;
        }
        console.log("nextStep - moving to next step");
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        console.log("prevStep called - currentStep:", currentStep);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            step === currentStep
                                ? 'bg-primary text-white ring-2 ring-primary/30'
                                : step < currentStep
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                        {step < currentStep ? <CheckIcon className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                        <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className={`h-full bg-primary transition-all ${
                                    step < currentStep ? 'w-full' : 'w-0'
                                }`}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderLocationStep = () => (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        Pickup Location
                    </label>
                    <Select
                        value={formData.pickupLocationId}
                        onValueChange={(value) => handlePickupLocationSelect(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Plant Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {plantLocations.map(location => (
                                <SelectItem key={location._id} value={location._id}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative">
                    <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        Delivery Address
                    </label>
                    <Input
                        type="text"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Enter delivery address"
                        className="w-full"
                    />
                    <div>
                        <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                            <ClockIcon className="w-4 h-4 mr-2" />
                            Estimated Delivery Time
                        </label>
                        <Input
                            type="datetime-local"
                            name="estimatedDeliveryTime"
                            value={formData.estimatedDeliveryTime}
                            onChange={handleChange}
                            className="w-full"
                            min={new Date().toISOString().split('T')[0] + 'T00:00'}
                        />
                    </div>
                    {addressSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                            {addressSuggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="p-3 hover:bg-blue-50 text-gray-800 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200 ease-in-out"
                                    onClick={() => handleAddressSelect(suggestion)}
                                >
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[400px] rounded-lg overflow-hidden border">
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
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Select pickup and delivery locations</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderVehicleStep = () => (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        {formData.vehicleType === 'Truck' ? (
                            <>
                                <TruckIcon className="w-4 h-4 mr-2" /> Truck Type
                            </>
                        ) : (
                            <>
                                <ShipIcon className="w-4 h-4 mr-2" /> Ship Type
                            </>
                        )}
                    </label>
                    <Select
                        value={formData.vehicleType}
                        onValueChange={(value) => {
                            console.log("Select - vehicleType - onValueChange - value:", value, "formData before update:", formData);
                            setFormData(prev => {
                                const newState = { ...prev, vehicleType: value, vehicleId: '' };
                                console.log("Select - vehicleType - onValueChange - updated formData:", newState);
                                 return newState
                            });
                            fetchVehicles(value)
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Vehicle Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Truck">Truck</SelectItem>
                            <SelectItem value="Ship">Ship</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map(vehicle => (
                        <Card
                            key={vehicle._id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                                formData.vehicleId === vehicle._id
                                    ? 'ring-2 ring-primary bg-primary/5'
                                    : 'hover:border-primary'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, vehicleId: vehicle._id }))}
                        >
                            <div className="flex items-center space-x-4">
                                {formData.vehicleType === 'Truck' ? (
                                    <TruckIcon className="w-10 h-10 text-primary" />
                                ) : (
                                    <ShipIcon className="w-10 h-10 text-primary" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">
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
        </div>
    );


    const renderCargoStep = () => (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        <PackageIcon className="w-4 h-4 mr-2" />
                        Cargo Type
                    </label>
                    <Select
                        value={formData.cargo}
                        onValueChange={(value) => handleChange({ target: { name: 'cargo', value } })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Cargo Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {cargoTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="flex items-center text-sm font-medium mb-2 text-gray-700">
                        <WeightIcon className="w-4 h-4 mr-2" />
                        Cargo Weight (kg)
                    </label>
                    <Input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Enter cargo weight"
                        className="w-full"
                        min="0"
                        step="0.1"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepIndicator()}

            <div className="min-h-[600px] overflow-y-auto pr-2">
                {currentStep === 1 && renderLocationStep()}
                {currentStep === 2 && renderVehicleStep()}
                {currentStep === 3 && renderCargoStep()}
            </div>

            <div className="flex justify-between pt-6 border-t sticky bottom-0 bg-background">
                <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Previous
                </Button>

                {currentStep < 3 ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-2"
                    >
                        Next
                        <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? 'Creating...' : 'Create Shipment'}
                        <CheckIcon className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </form>
    );
};

export default ShipmentForm;