# Smart Cargo AI - Intelligent Logistics Management System

## Project Overview

Smart Cargo AI is an advanced logistics management platform designed to streamline shipment tracking, vehicle management, and cargo transportation. The system provides a comprehensive solution for managing complex logistics operations with real-time tracking, intelligent routing, and efficient vehicle allocation.

## Tech Stack

### Frontend
- [React.js](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [Leaflet Maps](https://leafletjs.com/)

### Backend
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT Authentication](https://jwt.io/)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) (v9.x or later)
- [MongoDB](https://www.mongodb.com/) (v5.x or later)


## Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/AI-Varun/Smart-Cargo-AI.git
cd smart-cargo-ai
```

### 2. Setup Environment Variables
#### Client (.env in client folder)
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_WS_URL=ws://localhost:3000
```
#### Server (.env in server folder)
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smart-cargo
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=GEMINI_API_KEY
AIS_API_KEY=AIS_API_KEY
```

### 4. Run Development Servers

## Terminal 1 - Start Backend
```bash
cd server
npm run start
```
## Terminal 2 - Start Frontend
```bash
cd client
npm run dev
```

## Features

- **🚚 Vehicle Management**: Add, track, and manage your fleet of trucks and ships.
- **📦 Shipment Tracking**: Monitor the status and location of your shipments in real-time.
- **🟡 Real-time Route Mapping**: Visualize shipment routes on interactive maps.
- **📊 Logistics Analytics**: Gain insights into your operations with data-driven analytics.
- **🔐 Secure Authentication**: Ensure the security of your data with robust user authentication.

---

## API Endpoints (Few)

### Authentication
- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Log in an existing user.

### Vehicles
- **GET /api/trucks**: Retrieve all trucks.
- **GET /api/ships**: Retrieve all ships.
- **POST /api/vehicles**: Add a new vehicle (truck or ship).

### Shipments
- **GET /api/shipments**: Retrieve all shipments.
- **POST /api/shipments**: Create a new shipment.
- **PUT /api/shipments/:id**: Update an existing shipment.

---

## How to Use

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/AI-Varun/Smart-Cargo-AI.git
   ```

2. Navigate to the project directory:
   ```bash
   cd logistics-management-platform
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

# Run client tests
```bash
cd client
npm run dev
```
# Run server tests
```bash
cd server
npm run start
```


5. Access the application at `http://localhost:5173` (default port).

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

