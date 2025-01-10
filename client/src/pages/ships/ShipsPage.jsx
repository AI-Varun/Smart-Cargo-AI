import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Table, 
  Tag, 
  Space, 
  Modal,
  message,
  Drawer,
  Switch,
  Row,
  Col,
  Descriptions
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  RocketOutlined,
  EnvironmentOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import ShipRegistrationForm from './ShipRegistrationForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import MapView from '../../components/shared/MapView';
import VehicleDetails from '../../components/shared/VehicleDetails';

const ShipsPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState({});
  const [isMapVisible, setIsMapVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data: ships = [], isLoading } = useQuery({
    queryKey: ['ships'],
    queryFn: async () => {
      const response = await axios.get('/ships');
      console.log('Ships Data:', response.data);
      return response.data.map(ship => ({
        ...ship,
        // Ensure location is always an object with coordinates
        location: ship.location || { 
          type: 'Point', 
          coordinates: [0, 0] 
        },
        // Provide default values
        aisData: ship.aisData || 'N/A',
        capacity: ship.capacity || 0,
        status: ship.status || 'Unknown',
        isTracking: ship.isTracking || false
      }));
    },
    // Add error handling
    onError: (error) => {
      console.error('Failed to fetch ships:', error);
      message.error('Failed to load ships data');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/ships/${id}`),
    onSuccess: () => {
      message.success('Ship deleted successfully');
      queryClient.invalidateQueries(['ships']);
    },
    onError: (error) => {
      message.error('Failed to delete ship: ' + error.message);
    }
  });

  const toggleTrackingMutation = useMutation({
    mutationFn: ({ shipId, enabled }) => {
      console.log('Toggle Tracking - Ship ID:', shipId, 'Enabled:', enabled);
      
      // Validate shipId before making the request
      if (!shipId || shipId === 'undefined') {
        throw new Error('Invalid Ship ID');
      }
      
      return axios.post(`/ships/${shipId}/tracking`, { enabled });
    },
    onSuccess: (_, { enabled }) => {
      message.success(`Tracking ${enabled ? 'started' : 'stopped'} successfully`);
      queryClient.invalidateQueries(['ships']);
    },
    onError: (error) => {
      message.error('Failed to toggle tracking: ' + error.message);
      console.error('Tracking Toggle Error:', error);
    }
  });

  const handleTrackingToggle = (shipId, enabled) => {
    setIsTrackingEnabled(prev => ({ ...prev, [shipId]: enabled }));
    toggleTrackingMutation.mutate({ shipId, enabled });
  };

    const columns = [
      {
        title: 'Ship ID',
        dataIndex: 'shipId',
        key: 'shipId',
        render: (text) => (
          <Space>
            <RocketOutlined />
            {text}
          </Space>
        )
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'MMSI',
        dataIndex: 'aisData',
        key: 'aisData',
      },
    {
      title: 'Current Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        <Space>
          <EnvironmentOutlined />
          {location ? `${location.coordinates[1].toFixed(6)}, ${location.coordinates[0].toFixed(6)}` : 'N/A'}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          at_dock: 'green',
          sailing: 'blue',
          maintenance: 'orange'
        };
        return (
          <Tag color={colors[status] || 'default'}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Tracking',
      key: 'tracking',
      render: (_, record) => (
        <Switch
          checked={isTrackingEnabled[record._id] ?? record.isTracking}
          onChange={(checked) => handleTrackingToggle(record._id, checked)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => {
              setSelectedShip(record);
              setIsMapVisible(true);
            }}
          >
            Track
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingShip(record);
              setIsModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Ship',
                content: `Are you sure you want to delete ship ${record.name}?`,
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => deleteMutation.mutate(record._id)
              });
            }}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Ships Management</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingShip(null);
              setIsModalVisible(true);
            }}
          >
            Add Ship
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={ships}
          rowKey="id"
          loading={isLoading}
        />
      </Card>

      <Modal
        title={editingShip ? 'Edit Ship' : 'Add New Ship'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingShip(null);
        }}
        footer={null}
        width={800}
      >
        <ShipRegistrationForm
          initialValues={editingShip}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingShip(null);
            queryClient.invalidateQueries(['ships']);
          }}
        />
      </Modal>

      <Drawer
        title={`Tracking Ship: ${selectedShip?.name || ''}`}
        placement="right"
        width="80%"
        onClose={() => {
          setIsMapVisible(false);
          setSelectedShip(null);
        }}
        open={isMapVisible}
        extra={
          <Switch
            checked={isTrackingEnabled[selectedShip?._id] ?? selectedShip?.isTracking}
            onChange={(checked) => handleTrackingToggle(selectedShip?._id, checked)}
            checkedChildren="Tracking ON"
            unCheckedChildren="Tracking OFF"
          />
        }
      >
        {selectedShip && (
          <div>
            <div style={{ height: '60vh', marginBottom: '20px' }}>
              <MapView
                vehicles={[selectedShip]}
                onVehicleClick={() => {}}
              />
            </div>
            
            <Card title="Ship Details">
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1}>
                    <Descriptions.Item label="Ship ID">
                      {selectedShip.shipId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Name">
                      {selectedShip.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="MMSI">
                      {selectedShip.aisData}
                    </Descriptions.Item>
                    <Descriptions.Item label="Capacity">
                      {selectedShip.capacity} TEU
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1}>
                    <Descriptions.Item label="Current Location">
                      {selectedShip.location?.coordinates?.join(', ') || 'Not available'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {selectedShip.status}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tracking Status">
                      {isTrackingEnabled[selectedShip._id] ?? selectedShip.isTracking 
                        ? 'Enabled' : 'Disabled'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ShipsPage;