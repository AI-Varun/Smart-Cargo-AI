// import { FastifyInstance } from 'fastify';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { v4 as uuidv4 } from 'uuid';
// import mongoose from 'mongoose';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// class ChatSession {
//   constructor() {
//     this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
//     this.chat = this.model.startChat();
//     this.lastAccessed = Date.now();
//   }

//   async sendMessage(message) {
//     this.lastAccessed = Date.now();
//     return await this.chat.sendMessage(message);
//   }
// }

// let chatSessions = new Map();

// const getShipmentPrompt = () => {
//   const Shipment = mongoose.model('Shipment');
//   const schema = Shipment.schema.obj;
  
//   // Detailed field extraction with comprehensive descriptions
//   const requiredFields = Object.entries(schema)
//     .filter(([_, config]) => config.required || config.default)
//     .map(([field, config]) => {
//       let type = config.type;
//       if (config.type === mongoose.Schema.Types.ObjectId) {
//         type = 'ID';
//       } else if (Array.isArray(config.type)) {
//         type = 'Array';
//       } else if (typeof config.type === 'function') {
//         type = config.type.name;
//       }
      
//       let description = '';
//       if (config.enum) {
//         description = `(Options: ${config.enum.join(', ')})`;
//       }
      
//       // Add more context for specific fields
//       switch(field) {
//         case 'source':
//           description += ' Include full address, coordinates, and any location details';
//           break;
//         case 'destination':
//           description += ' Provide complete delivery address and coordinates';
//           break;
//         case 'vehicleType':
//           description += ' Specify the mode of transportation';
//           break;
//         case 'contents':
//           description += ' Describe cargo type, weight, and any special handling requirements';
//           break;
//         case 'status':
//           description += ' Current shipment status (pending, in-transit, delivered, etc.)';
//           break;
//       }
      
//       return `* ${field}: ${type} ${description}`;
//     });

//   return `Shipment Creation Guidance:

// You are an AI assistant helping to create a comprehensive shipment tracking entry. Provide detailed information for each field:

// ${requiredFields.join('\n')}

// Additional Recommendations:
// 1. Ensure all coordinates are in [longitude, latitude] format
// 2. Provide precise addresses for source and destination
// 3. Include specific details about cargo and transportation
// 4. Consider potential route challenges or special requirements

// Example Shipment Structure:
// {
//   "trackingNumber": "SHP123456",
//   "source": {
//     "address": "123 Warehouse St, Industrial Zone",
//     "coordinates": [72.8777, 19.0760],
//     "type": "Point"
//   },
//   "destination": {
//     "address": "456 Delivery Rd, Commercial District",
//     "coordinates": [77.5946, 12.9716],
//     "type": "Point"
//   },
//   "vehicleType": "Truck",
//   "contents": [{
//     "type": "Electronics",
//     "quantity": 500,
//     "weight": 250.5
//   }],
//   "status": "pending",
//   "eta": "2024-02-15T14:30:00Z"
// }

// Please provide a complete and accurate shipment entry based on these guidelines.`;
// };

// export default async function chatController(fastify: FastifyInstance) {
//   const sendMessage = async (request, reply) => {
//     try {
//       const { message } = request.body;
//       const sessionId = request.headers['session-id'] || uuidv4();
  
//       // Comprehensive tracking number extraction
//       const trackingRegex = /(?:shipment\s*)?#?(?:SHP\d{10,})\b/i;
//       const trackingMatch = message.match(trackingRegex);
  
//       // Tracking intent detection
//       const trackingIntentPatterns = [
//         /when.*(?:will|does).*(?:arrive|reach)/i,
//         /track.*shipment/i,
//         /shipment.*status/i,
//         /where.*shipment/i
//       ];
      
//       const hasTrackingIntent = trackingIntentPatterns.some(pattern => pattern.test(message));
  
//       if (trackingMatch && hasTrackingIntent) {
//         const trackingNumber = trackingMatch[0].replace(/[#\s]/g, '');
        
//         try {
//           // Immediate database lookup
//           const Shipment = mongoose.model('Shipment');
//           const shipment = await Shipment.findOne({ shipmentId: trackingNumber });
          
//           if (shipment) {
//             // Direct tracking response
//             const trackingResponse = await getShipmentTrackingResponse(trackingNumber);
//             return reply.send({ 
//               response: trackingResponse,
//               trackingFound: true 
//             });
//           } else {
//             // Clear, direct response for not found shipment
//             return reply.send({ 
//               response: `🕵️ Shipment Tracking Result
  
//   ❌ Shipment #${trackingNumber} Not Found
  
//   🔍 Quick Insights:
//      - Tracking number may be incorrect
//      - Shipment might be recently created
//      - Possible system delay
  
//   💡 Recommended Actions:
//      1. Verify tracking number
//      2. Check shipment creation status
//      3. Contact support if needed
  
//   Would you like help finding your shipment?`,
//               trackingFound: false
//             });
//           }
//         } catch (dbError) {
//           console.error('Tracking lookup error:', dbError);
//           return reply.send({ 
//             response: `🚨 Tracking System Alert
  
//   😕 Temporary access issue detected.
  
//   💡 Recommendations:
//      - Retry tracking shortly
//      - Confirm tracking number
//      - Contact support team
  
//   We apologize for the inconvenience.`,
//             trackingFound: false
//           });
//         }
//       }
  
//       // Existing code for other message types
//       if (message.toLowerCase().includes('create') && message.toLowerCase().includes('shipment')) {
//         const prompt = getShipmentPrompt();
//         if (!chatSessions.has(sessionId)) {
//           chatSessions.set(sessionId, new ChatSession());
//         }
//         const chatSession = chatSessions.get(sessionId);
//         await chatSession.sendMessage(prompt);
        
//         return reply.send({ response: prompt });
//       }
  
//       // Default chat handling
//       if (!chatSessions.has(sessionId)) {
//         chatSessions.set(sessionId, new ChatSession());
//       }
//       const chatSession = chatSessions.get(sessionId);
//       const response = await chatSession.sendMessage(message);
      
//       return reply.send({ response });
//     } catch (error) {
//       console.error('Chat controller critical error:', error);
//       return reply.status(500).send({ 
//         error: 'Unexpected system error',
//         response: '🤖 System temporarily unavailable. Please try again later.'
//       });
//     }
//   };

//   fastify.post('/send', sendMessage);
// }
// const getShipmentTrackingResponse = async (trackingNumber) => {
//   try {
//     // Find the shipment by tracking number
//     const Shipment = mongoose.model('Shipment');
//     const shipment = await Shipment.findOne({ shipmentId: trackingNumber });

//     if (!shipment) {
//       // If no shipment found, provide predictive analysis
//       return generatePredictiveTrackingResponse(trackingNumber);
//     }

//     // Calculate predicted arrival details
//     const currentTime = new Date();
//     const etaDate = shipment.eta ? new Date(shipment.eta) : calculateEstimatedArrival(shipment);
//     const timeDiff = etaDate.getTime() - currentTime.getTime();
//     const hoursRemaining = Math.max(0, timeDiff / (1000 * 60 * 60));

//     // Format arrival time
//     const formattedETA = etaDate.toLocaleString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       timeZone: 'Asia/Kolkata'
//     });

//     // Determine arrival status
//     const arrivalStatus = determineArrivalStatus(currentTime, etaDate, shipment.status);

//     return `🚚 Shipment #${trackingNumber} Arrival Forecast

// 📍 Current Status: ${shipment.status.toUpperCase()}

// 🌍 Journey Details:
//    From: ${shipment.source.address}
//    To: ${shipment.destination.address}

// ⏰ Arrival Information:
//    Estimated Arrival: ${formattedETA}
//    Time Remaining: ${hoursRemaining.toFixed(2)} hours

// 🔮 Arrival Prediction:
//    ${arrivalStatus}

// 💡 Tracking Insights:
//    - Vehicle: ${shipment.vehicleType}
//    - Origin Coordinates: ${shipment.source.coordinates.join(', ')}
//    - Destination Coordinates: ${shipment.destination.coordinates.join(', ')}

// 🚨 Pro Tip: 
//    Arrival times can fluctuate. Stay prepared for potential adjustments.`;
//   } catch (error) {
//     console.error('Tracking error:', error);
//     return generatePredictiveTrackingResponse(trackingNumber);
//   }
// };

// // Helper function to determine arrival status
// const determineArrivalStatus = (currentTime, etaDate, currentStatus) => {
//   if (currentStatus === 'delivered') {
//     return '✅ Shipment has been delivered';
//   }

//   if (etaDate < currentTime) {
//     return '⚠️ Shipment is delayed. Estimated arrival has passed.';
//   }

//   const hoursDiff = (etaDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

//   if (hoursDiff <= 24) {
//     return '🚨 Shipment is very close to arrival. Expected within 24 hours.';
//   }

//   if (hoursDiff <= 72) {
//     return '🚚 Shipment is in transit. Expected to arrive soon.';
//   }

//   return '🌐 Shipment is on its planned route. No immediate concerns.';
// };

// const calculateEstimatedArrival = (shipment) => {
//   const currentTime = new Date();
//   const distance = calculateDistance(shipment.source.coordinates, shipment.destination.coordinates);
//   const estimatedTravelTime = estimateTravelTime(shipment);
  
//   // Calculate estimated arrival based on current time and estimated travel time
//   return new Date(currentTime.getTime() + estimatedTravelTime * 60 * 60 * 1000);
// };

// const getStatusPrediction = (currentStatus, hoursRemaining) => {
//   const statusMap = {
//     'pending': [
//       'Shipment is preparing for dispatch',
//       'Expected to start journey soon',
//       'Initial processing stage'
//     ],
//     'in-transit': [
//       `Estimated ${hoursRemaining.toFixed(2)} hours until arrival`,
//       'Currently moving towards destination',
//       'On track with expected timeline'
//     ],
//     'delayed': [
//       'Potential route challenges detected',
//       'Recommended to verify with logistics team',
//       'Possible extended delivery time'
//     ],
//     'delivered': [
//       'Shipment has reached its final destination',
//       'Delivery process completed',
//       'No further tracking required'
//     ]
//   };

//   const predictions = statusMap[currentStatus.toLowerCase()] || [
//     'Unable to predict exact status',
//     'Recommend direct contact with logistics team'
//   ];

//   return predictions[Math.floor(Math.random() * predictions.length)];
// };

// const generatePredictiveTrackingResponse = (trackingNumber) => {
//   const numberFormat = validateTrackingNumberFormat(trackingNumber);
  
//   return `🕵️ Shipment #${trackingNumber} - Tracking Investigation

// ❓ No exact shipment match found in our system.

// 🔍 Preliminary Analysis:
//    - Tracking Number: ${trackingNumber}
//    - Number Format: ${numberFormat}
//    - Potential Status: Pending Creation

// 💡 Intelligent Predictions:
//    ${generateIntelligentPrediction(trackingNumber)}

// 🚀 Recommended Actions:
//    1. Verify tracking number accuracy
//    2. Check with shipping provider
//    3. Confirm shipment details

// Would you like assistance with tracking or creating a new shipment?`;
// };

// const generateIntelligentPrediction = (trackingNumber) => {
//   const predictionScenarios = [
//     'Shipment might be recently initiated',
//     'Possible data synchronization delay',
//     'New shipment in processing stage',
//     'Tracking number may be in queue'
//   ];

//   return predictionScenarios[Math.floor(Math.random() * predictionScenarios.length)];
// };

// const validateTrackingNumberFormat = (trackingNumber) => {
//   const patterns = [
//     { name: 'Standard Numeric', regex: /^SHP\d{10}$/ },
//     { name: 'Extended Alphanumeric', regex: /^SHP[A-Z0-9]{10,15}$/ }
//   ];

//   const matchedPattern = patterns.find(pattern => pattern.regex.test(trackingNumber));
//   return matchedPattern ? matchedPattern.name : 'Unrecognized Format';
// };

// const calculateDistance = (coord1, coord2) => {
//   // Haversine formula for calculating great-circle distance between two points
//   const [lon1, lat1] = coord1;
//   const [lon2, lat2] = coord2;
//   const R = 6371; // Radius of the Earth in kilometers
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a = 
//     Math.sin(dLat/2) * Math.sin(dLat/2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//     Math.sin(dLon/2) * Math.sin(dLon/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   return (R * c).toFixed(2);
// };

// const estimateTravelTime = (shipment) => {
//   const avgSpeedByVehicle = {
//     'Truck': 60, // km/h
//     'Ship': 20   // km/h
//   };
  
//   const distance = calculateDistance(shipment.source.coordinates, shipment.destination.coordinates);
//   const avgSpeed = avgSpeedByVehicle[shipment.vehicleType] || 40;
  
//   return (distance / avgSpeed).toFixed(2);
// };

// // const generatePredictiveTrackingResponse = (trackingNumber) => {
// //   // Provide a predictive response when no shipment is found
// //   return `Shipment #${trackingNumber} - Tracking Insights:

// // 📍 No exact match found in our system.

// // Predictive Analysis:
// // - Tracking Number Format: ${validateTrackingNumberFormat(trackingNumber)}
// // - Potential Status Prediction: Pending or In Processing
// // - Recommendation: 
// //   1. Verify tracking number with shipper
// //   2. Check if shipment is recently created

// // Would you like to:
// // - Retry tracking
// // - Create a new shipment
// // - Contact support
// // `;
// // };

// // const validateTrackingNumberFormat = (trackingNumber) => {
// //   const patterns = [
// //     { name: 'Standard Numeric', regex: /^SHP\d{10}$/ },
// //     { name: 'Extended Alphanumeric', regex: /^SHP[A-Z0-9]{10,15}$/ }
// //   ];

// //   const matchedPattern = patterns.find(pattern => pattern.regex.test(trackingNumber));
// //   return matchedPattern ? matchedPattern.name : 'Unrecognized Format';
// // };

import { FastifyInstance } from 'fastify';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class ChatSession {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
        this.chat = this.model.startChat();
        this.lastAccessed = Date.now();
    }

    async sendMessage(message) {
        this.lastAccessed = Date.now();
        return await this.chat.sendMessage(message);
    }
}

let chatSessions = new Map();


const getShipmentPrompt = () => {
    const Shipment = mongoose.model('Shipment');
    const schema = Shipment.schema.obj;
    
    // Detailed field extraction with comprehensive descriptions
    const requiredFields = Object.entries(schema)
        .filter(([_, config]) => config.required || config.default)
        .map(([field, config]) => {
            let type = config.type;
            if (config.type === mongoose.Schema.Types.ObjectId) {
                type = 'ID';
            } else if (Array.isArray(config.type)) {
                type = 'Array';
            } else if (typeof config.type === 'function') {
                type = config.type.name;
            }
            
            let description = '';
            if (config.enum) {
                description = `(Options: ${config.enum.join(', ')})`;
            }
            
            // Add more context for specific fields
            switch(field) {
                case 'source':
                    description += ' Include full address, coordinates, and any location details';
                    break;
                case 'destination':
                    description += ' Provide complete delivery address and coordinates';
                    break;
                case 'vehicleType':
                    description += ' Specify the mode of transportation';
                    break;
                case 'contents':
                    description += ' Describe cargo type, weight, and any special handling requirements';
                    break;
                case 'status':
                    description += ' Current shipment status (pending, in-transit, delivered, etc.)';
                    break;
            }
            
            return `* ${field}: ${type} ${description}`;
        });

    return `Shipment Creation Guidance:

You are an AI assistant helping to create a comprehensive shipment tracking entry. Provide detailed information for each field:

${requiredFields.join('\n')}

Additional Recommendations:
1. Ensure all coordinates are in [longitude, latitude] format
2. Provide precise addresses for source and destination
3. Include specific details about cargo and transportation
4. Consider potential route challenges or special requirements

Example Shipment Structure:
{
  "trackingNumber": "SHP123456",
  "source": {
    "address": "123 Warehouse St, Industrial Zone",
    "coordinates": [72.8777, 19.0760],
    "type": "Point"
  },
  "destination": {
    "address": "456 Delivery Rd, Commercial District",
    "coordinates": [77.5946, 12.9716],
    "type": "Point"
  },
  "vehicleType": "Truck",
  "contents": [{
    "type": "Electronics",
    "quantity": 500,
    "weight": 250.5
  }],
  "status": "pending",
  "eta": "2024-02-15T14:30:00Z"
}

Please provide a complete and accurate shipment entry based on these guidelines.`;
};

// Function to analyze user intent
const analyzeUserIntent = (message) => {
    const trackingPattern = /(?:track|status|where|tracking).*?(?:shipment|truck|plant)\s*#?([A-Z0-9]+)?/i;
    const timeToDeliverPattern = /time to deliver|eta/i;
    const analyticsPattern = /analytics|statistics|performance|forecast|report/i;
    const createShipmentPattern = /create.*shipment/i
    const alertPattern = /alert|warning|notification|issue/i;
    
    const trackingMatch = message.match(trackingPattern);

    if (trackingMatch) {
        const id = trackingMatch[1];
        if (id) {
            return { intent: 'tracking', id};
        }
        return {intent:'tracking', id: null}
    };
    if (createShipmentPattern.test(message)) return {intent: 'create_shipment'};
    if(timeToDeliverPattern.test(message)) return {intent: 'time_to_deliver'};
    if (analyticsPattern.test(message)) return {intent: 'analytics'};
    if (alertPattern.test(message)) return {intent: 'alerts'};

    return { intent: 'general'};
};

// Helper function to get shipment details
const getShipmentContext = async (shipmentId) => {
    try {
        const Shipment = mongoose.model('Shipment');
        const shipment = await Shipment.findOne({ shipmentId });
         if (!shipment) {
            return generatePredictiveTrackingResponse(shipmentId);
         }

        const formattedETA = shipment.eta ? new Date(shipment.eta).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
        }) : 'Not Available';
        
        return `Shipment Details:
    - **Shipment ID:** ${shipment.shipmentId}
    - **Status:** ${shipment.status}
    - **Origin:** ${shipment.source.address}
    - **Destination:** ${shipment.destination.address}
    - **Mode of Transport:** ${shipment.vehicleType}
    - **Estimated Time of Arrival (ETA):** ${formattedETA}`;
    } catch (error) {
        console.error('Error fetching shipment:', error);
        return "Could not fetch shipment details at the moment.";
    }
}

// Helper function to get estimated arrival time for a shipment
const getTimeToDeliverContext = async (shipmentId) => {
    try {
        const Shipment = mongoose.model('Shipment');
        const shipment = await Shipment.findOne({ shipmentId });
        if (!shipment) {
            return generatePredictiveTrackingResponse(shipmentId);
        }
        
        const currentTime = new Date();
        const etaDate = shipment.eta ? new Date(shipment.eta) : calculateEstimatedArrival(shipment);
        const timeDiff = etaDate.getTime() - currentTime.getTime();
        const hoursRemaining = Math.max(0, timeDiff / (1000 * 60 * 60));
        const formattedETA = etaDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata'
        });

    return `Estimated Arrival for Shipment ${shipmentId}:
        - **ETA:** ${formattedETA}
        - **Time Remaining:** Approximately ${hoursRemaining.toFixed(2)} hours`;
    } catch (error) {
        console.error('Error fetching estimated time of delivery', error);
        return 'Could not fetch the estimated time of delivery at the moment. Please try again later';
    }
}

// Helper function to get analytics data
const getAnalyticsContext = async () => {
    try {
        const Shipment = mongoose.model('Shipment');
        const Truck = mongoose.model('Truck');
        const Ship = mongoose.model('Ship');
        
        const totalShipments = await Shipment.countDocuments();
        const inTransit = await Shipment.countDocuments({ status: 'in-transit' });
        const delivered = await Shipment.countDocuments({ status: 'delivered' });
        const activeTrucks = await Truck.countDocuments({ status: 'available' });
        const activeShips = await Ship.countDocuments({ status: 'at_dock' });
        
        return `Current System Status:
        - **Total Shipments:** ${totalShipments}
        - **In Transit:** ${inTransit}
        - **Delivered:** ${delivered}
        - **Active Trucks:** ${activeTrucks}
        - **Active Ships:** ${activeShips}`;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return "Could not fetch analytics data at the moment.";
    }
}


// Function to handle tracking
const handleTrackingIntent = async (message,id) => {
    if(id){
        const shipmentContext = await getShipmentContext(id);
        if (shipmentContext) {
            return shipmentContext;
        } else {
            return generatePredictiveTrackingResponse(id);
        }
    } else {
        const trackingMatch = message.match(/(?:shipment|truck|plant)\s*#?([A-Z0-9]+)/i);
        if(trackingMatch && trackingMatch[1]){
            return await handleTrackingIntent(message, trackingMatch[1]);
        }
        return "Please provide a valid tracking number.";
    }
};

// Function to handle time to deliver intent
const handleTimeToDeliverIntent = async (message) => {
    const trackingMatch = message.match(/(?:shipment|truck|plant)\s*#?([A-Z0-9]+)/i);
    if(trackingMatch && trackingMatch[1]){
        const timeToDeliverContext = await getTimeToDeliverContext(trackingMatch[1]);
        if (timeToDeliverContext){
            return timeToDeliverContext;
        } else{
            return "Could not fetch the estimated time of delivery at the moment.";
        }
    }
        return "Please provide a valid tracking number.";
};


const handleAnalyticsIntent = async () => {
    const analyticsContext = await getAnalyticsContext();
    if (analyticsContext) {
        return analyticsContext;
    }
    return "Could not fetch analytics data at the moment.";
};
    
const handleAlertsIntent = async () => {
    const Alert = mongoose.model('Alert');
    const alerts = await Alert.find({ status: 'active' })
        .sort({ severity: -1 })
        .limit(5);
    if (alerts.length > 0) {
        return 'Active Alerts:\n' + alerts.map(a => 
            `- ${a.type} (${a.severity}): ${a.message}`
        ).join('\n');
    }
    return "No active alerts at the moment.";
}


const generatePredictiveTrackingResponse = (trackingNumber) => {
    const numberFormat = validateTrackingNumberFormat(trackingNumber);
    
    return `🕵️ Shipment #${trackingNumber} - Tracking Investigation

    ❓ No exact shipment match found in our system.

    🔍 Preliminary Analysis:
       - Tracking Number: ${trackingNumber}
       - Number Format: ${numberFormat}
       - Potential Status: Pending Creation

    💡 Intelligent Predictions:
        ${generateIntelligentPrediction(trackingNumber)}

    🚀 Recommended Actions:
       1. Verify tracking number accuracy
       2. Check with shipping provider
       3. Confirm shipment details

    Would you like assistance with tracking or creating a new shipment?`;
};

const generateIntelligentPrediction = (trackingNumber) => {
    const predictionScenarios = [
      'Shipment might be recently initiated',
      'Possible data synchronization delay',
      'New shipment in processing stage',
      'Tracking number may be in queue'
    ];
  
    return predictionScenarios[Math.floor(Math.random() * predictionScenarios.length)];
  };

const validateTrackingNumberFormat = (trackingNumber) => {
    const patterns = [
        { name: 'Standard Numeric', regex: /^SHP\d{10}$/ },
        { name: 'Extended Alphanumeric', regex: /^SHP[A-Z0-9]{10,15}$/ }
    ];
    
    const matchedPattern = patterns.find(pattern => pattern.regex.test(trackingNumber));
    return matchedPattern ? matchedPattern.name : 'Unrecognized Format';
};


const calculateDistance = (coord1, coord2) => {
  // Haversine formula for calculating great-circle distance between two points
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(2);
};

const estimateTravelTime = (shipment) => {
  const avgSpeedByVehicle = {
    'Truck': 60, // km/h
    'Ship': 20   // km/h
  };
  
  const distance = calculateDistance(shipment.source.coordinates, shipment.destination.coordinates);
  const avgSpeed = avgSpeedByVehicle[shipment.vehicleType] || 40;
  
  return (distance / avgSpeed).toFixed(2);
};

export default async function chatController(fastify) {
    const sendMessage = async (request, reply) => {
        try {
            const { message } = request.body;
            const sessionId = request.headers['session-id'] || uuidv4();
             
            // Analyze intent
             const {intent, id} = analyzeUserIntent(message);
             let context = '';
 
            switch (intent) {
                case 'tracking':
                context = await handleTrackingIntent(message,id);
                break;
                case 'time_to_deliver':
                    context = await handleTimeToDeliverIntent(message);
                break;
                case 'analytics':
                    context = await handleAnalyticsIntent();
                break;
                case 'alerts':
                    context = await handleAlertsIntent();
                break;
                case 'create_shipment':
                   if (message.toLowerCase().includes("name:") && message.toLowerCase().includes("phone:") && message.toLowerCase().includes("email:") && message.toLowerCase().includes("address:")) {
                        // If the message contains name, phone, and email, consider it as form submission.
                           if (!chatSessions.has(sessionId)) {
                                chatSessions.set(sessionId, new ChatSession());
                           }
                           const chatSession = chatSessions.get(sessionId);
                           const response = await chatSession.sendMessage(message);
                           return reply.send({ response });
                       } else{
                             const prompt = getShipmentPrompt();
                            if (!chatSessions.has(sessionId)) {
                                chatSessions.set(sessionId, new ChatSession());
                            }
                             const chatSession = chatSessions.get(sessionId);
                             await chatSession.sendMessage(prompt);
                             return reply.send({ response: prompt, skipAI: true });
                    }
               
                
                default:
                break;
        }

            if(context){
                return reply.send({ response: context });
            }
            
            // Default chat handling
            if (!chatSessions.has(sessionId)) {
                chatSessions.set(sessionId, new ChatSession());
            }
            const chatSession = chatSessions.get(sessionId);
            const response = await chatSession.sendMessage(message);
             return reply.send({ response });
        } catch (error) {
            console.error('Chat controller critical error:', error);
            return reply.status(500).send({ 
                error: 'Unexpected system error',
                response: '🤖 System temporarily unavailable. Please try again later.'
            });
        }
    };
    
    fastify.post('/send', sendMessage);
}