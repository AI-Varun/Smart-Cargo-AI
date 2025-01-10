import axios from 'axios';
import mongoose from 'mongoose';
import { Shipment } from '../src/models/Shipment.js';
import { Truck } from '../src/models/Truck.js';
import { Ship } from '../src/models/Ship.js';
import { Alert } from '../src/models/Alert.js';

// Helper function to get shipment details
async function getShipmentContext(shipmentId) {
    try {
        const shipment = await Shipment.findOne({ shipmentId });
        if (!shipment) return "Shipment not found.";
        
        return `Shipment Details:
- ID: ${shipment.shipmentId}
- Status: ${shipment.status}
- From: ${shipment.source.address}
- To: ${shipment.destination.address}
- Vehicle Type: ${shipment.vehicleType}
- ETA: ${shipment.eta}`;
    } catch (error) {
        console.error('Error fetching shipment:', error);
        return null;
    }
}

// Helper function to get analytics data
async function getAnalyticsContext() {
    try {
        const totalShipments = await Shipment.countDocuments();
        const inTransit = await Shipment.countDocuments({ status: 'in-transit' });
        const delivered = await Shipment.countDocuments({ status: 'delivered' });
        const activeTrucks = await Truck.countDocuments({ status: 'active' });
        const activeShips = await Ship.countDocuments({ status: 'active' });
        
        return `Current System Status:
- Total Shipments: ${totalShipments}
- In Transit: ${inTransit}
- Delivered: ${delivered}
- Active Trucks: ${activeTrucks}
- Active Ships: ${activeShips}`;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return null;
    }
}

// Function to analyze user intent
function analyzeUserIntent(message) {
    const trackingPattern = /track.*shipment|status.*shipment|where.*shipment|tracking.*[A-Z0-9]{6,}/i;
    const analyticsPattern = /analytics|statistics|performance|forecast|report/i;
    const alertPattern = /alert|warning|notification|issue/i;
    
    if (trackingPattern.test(message)) return 'tracking';
    if (analyticsPattern.test(message)) return 'analytics';
    if (alertPattern.test(message)) return 'alerts';
    return 'general';
}

export default async function routes(fastify) {
    fastify.post('/send', async (request, reply) => {
        try {
            const { message } = request.body;
            console.log('Received message:', message);

            // Analyze intent and gather context
            const intent = analyzeUserIntent(message);
            let context = '';

            switch (intent) {
                case 'tracking':
                    const shipmentMatch = message.match(/[A-Z0-9]{6,}/);
                    if (shipmentMatch) {
                        const shipmentContext = await getShipmentContext(shipmentMatch[0]);
                        if (shipmentContext) {
                            context = shipmentContext + '\n\n';
                        }
                    }
                    break;
                    
                case 'analytics':
                    const analyticsContext = await getAnalyticsContext();
                    if (analyticsContext) {
                        context = analyticsContext + '\n\n';
                    }
                    break;
                    
                case 'alerts':
                    const alerts = await Alert.find({ status: 'active' })
                        .sort({ severity: -1 })
                        .limit(5);
                    if (alerts.length > 0) {
                        context = 'Active Alerts:\n' + alerts.map(a => 
                            `- ${a.type} (${a.severity}): ${a.message}`
                        ).join('\n') + '\n\n';
                    }
                    break;
            }

            // System context for the AI
            const systemContext = `You are an AI assistant for the Smart Cargo AI tracking system. 
You help users track shipments, check analytics, and monitor alerts.
Current context: ${context}

User query: ${message}`;

            // Make API request with context
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{
                        parts: [{ text: systemContext }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('API Response:', response.data);
            return { response: response.data.candidates[0].content.parts[0].text };
        } catch (error) {
            console.error('Chat error:', error.response?.data || error.message);
            return reply.code(500).send({ 
                error: 'Failed to process message',
                details: error.response?.data || error.message 
            });
        }
    });

    // Test endpoint
    fastify.get('/test', async () => {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{
                        parts: [{ text: "Hello" }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { response: response.data.candidates[0].content.parts[0].text };
        } catch (error) {
            console.error('Test error:', error.response?.data || error.message);
            return { error: error.response?.data || error.message };
        }
    });
}
