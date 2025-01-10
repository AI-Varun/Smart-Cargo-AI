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
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CarOutlined,
  EnvironmentOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import TruckRegistrationForm from './TruckRegistrationForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import MapView from '../../components/shared/MapView';
import VehicleDetails from '../../components/shared/VehicleDetails';

const TrucksPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState({});
  const [isMapVisible, setIsMapVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data: trucks = [], isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const response = await axios.get('/trucks');
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/trucks/${id}`),
    onSuccess: () => {
      message.success('Truck deleted successfully');
      queryClient.invalidateQueries(['trucks']);
    },
    onError: (error) => {
      message.error('Failed to delete truck: ' + error.message);
    }
  });

  const toggleTrackingMutation = useMutation({
    mutationFn: ({ truckId, enabled }) => 
      axios.post(`/trucks/${truckId}/tracking`, { enabled }),
    onSuccess: (_, { enabled }) => {
      message.success(`Tracking ${enabled ? 'started' : 'stopped'} successfully`);
      queryClient.invalidateQueries(['trucks']);
    },
    onError: (error) => {
      message.error('Failed to toggle tracking: ' + error.message);
    }
  });

  const handleTrackingToggle = (truckId, enabled) => {
    setIsTrackingEnabled(prev => ({ ...prev, [truckId]: enabled }));
    toggleTrackingMutation.mutate({ truckId, enabled });
  };

  const columns = [
    {
      title: 'Truck ID',
      dataIndex: 'truckId',
      key: 'truckId',
      render: (text) => (
        <Space>
          <CarOutlined />
          {text}
        </Space>
      )
    },
    {
      title: 'Registration Number',
      dataIndex: 'registrationNumber',
      key: 'registrationNumber',
    },
    {
      title: 'Driver Name',
      dataIndex: 'driverName',
      key: 'driverName',
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
          available: 'green',
          en_route: 'blue',
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
      title: 'GPS Tracking',
      key: 'tracking',
      render: (_, record) => (
        <Switch
          checkedChildren="ON"
          unCheckedChildren="OFF"
          checked={isTrackingEnabled[record._id]}
          onChange={(checked) => handleTrackingToggle(record._id, checked)}
          disabled={!record.gpsEnabled}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<RadarChartOutlined />}
            onClick={() => {
              setSelectedTruck(record);
              setIsMapVisible(true);
            }}
            disabled={!record.gpsEnabled}
          >
            Track
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTruck(record);
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
                title: 'Delete Truck',
                content: `Are you sure you want to delete truck ${record.truckId}?`,
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
            <CarOutlined />
            <span>Trucks Management</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTruck(null);
              setIsModalVisible(true);
            }}
          >
            Add Truck
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={trucks}
          rowKey="_id"
          loading={isLoading}
        />
      </Card>

      <Modal
        title={editingTruck ? 'Edit Truck' : 'Add New Truck'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTruck(null);
        }}
        footer={null}
        width={800}
      >
        <TruckRegistrationForm
          initialValues={editingTruck}
          onSuccess={() => {
            setIsModalVisible(false);
            setEditingTruck(null);
            queryClient.invalidateQueries(['trucks']);
          }}
        />
      </Modal>

      <Drawer
        title={`Tracking Truck: ${selectedTruck?.truckId || ''}`}
        placement="right"
        width="80%"
        onClose={() => {
          setIsMapVisible(false);
          setSelectedTruck(null);
        }}
        open={isMapVisible}
      >
        <div style={{ height: '60vh', marginBottom: '20px' }}>
          <MapView
            vehicles={selectedTruck ? [selectedTruck] : []}
            onVehicleClick={() => {}}
          />
        </div>
        {selectedTruck && (
          <VehicleDetails
            vehicle={selectedTruck}
            routeProgress={selectedTruck.routeProgress}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TrucksPage;