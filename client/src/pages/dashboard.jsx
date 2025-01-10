import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Tabs, Modal, Button, Space, message } from 'antd';
import { 
  CarOutlined, 
  RocketOutlined, 
  AlertOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import MapView from '../components/shared/MapView';
import AlertsPanel from '../components/shared/AlertsPanel';
import VehicleDetails from '../components/shared/VehicleDetails';
import axios from 'axios';

const { TabPane } = Tabs;

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    activeTrucks: 0,
    activeShips: 0,
    totalAlerts: 0,
    resolvedAlerts: 0
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeProgress, setRouteProgress] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to all updates
      socket.send(JSON.stringify({
        type: 'subscribe_all'
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      message.error('Lost connection to server. Retrying...');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect
      setTimeout(() => {
        message.info('Reconnecting to server...');
        initializeWebSocket();
      }, 5000);
    };

    setWs(socket);

    // Fetch initial data
    fetchDashboardData();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, alertsRes, statsRes] = await Promise.all([
        axios.get('/vehicles'),
        axios.get('/alerts'),
        axios.get('/stats')
      ]);

      setVehicles(vehiclesRes.data);
      setAlerts(alertsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to fetch dashboard data');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'vehicle_update':
        setVehicles(prevVehicles => {
          const index = prevVehicles.findIndex(v => 
            v.type === data.vehicleType && v.id === data.vehicleId
          );
          if (index === -1) return [...prevVehicles, data.data];
          const newVehicles = [...prevVehicles];
          newVehicles[index] = { ...newVehicles[index], ...data.data };
          return newVehicles;
        });
        break;

      case 'alert':
        setAlerts(prevAlerts => [data.data, ...prevAlerts]);
        setStats(prevStats => ({
          ...prevStats,
          totalAlerts: prevStats.totalAlerts + 1
        }));
        break;

      case 'route_progress':
        if (selectedVehicle?.id === data.vehicleId) {
          setRouteProgress(data.data);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'get_route_progress',
        vehicleId: vehicle.id,
        vehicleType: vehicle.type
      }));
    }
  };

  const handleAlertClick = (alert) => {
    Modal.info({
      title: alert.title,
      content: (
        <Space direction="vertical">
          <p>{alert.message}</p>
          <p>Created: {new Date(alert.createdAt).toLocaleString()}</p>
          {alert.status === 'open' && (
            <Button 
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => acknowledgeAlert(alert.id)}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      ),
      width: 500
    });
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`/alerts/${alertId}/acknowledge`);
      message.success('Alert acknowledged');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      message.error('Failed to acknowledge alert');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Trucks"
              value={stats.activeTrucks}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Ships"
              value={stats.activeShips}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Alerts"
              value={stats.totalAlerts - stats.resolvedAlerts}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resolved Alerts"
              value={stats.resolvedAlerts}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={16}>
          <Card style={{ height: '600px' }}>
            <Tabs defaultActiveKey="map">
              <TabPane tab="Map View" key="map">
                <MapView 
                  vehicles={vehicles}
                  onVehicleClick={handleVehicleClick}
                />
              </TabPane>
              {selectedVehicle && (
                <TabPane tab="Vehicle Details" key="details">
                  <VehicleDetails
                    vehicle={selectedVehicle}
                    routeProgress={routeProgress}
                  />
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>
        <Col span={8}>
          <AlertsPanel
            alerts={alerts}
            onAlertClick={handleAlertClick}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;