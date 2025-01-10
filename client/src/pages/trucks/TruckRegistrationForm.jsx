import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Button, 
  Space,
  message 
} from 'antd';
import { SaveOutlined, ClearOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const { Option } = Select;

const TruckRegistrationForm = ({ initialValues, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch plant locations
  const { data: plantLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['plantLocations'],
    queryFn: async () => {
      const response = await axios.get('/plant-locations');
      return response.data;
    },
    onError: (error) => {
      console.error('Error fetching plant locations:', error);
      message.error('Failed to load plant locations');
    }
  });

  const mutation = useMutation({
    mutationFn: (values) => {
      if (initialValues) {
        return axios.put(`/trucks/${initialValues.id}`, values);
      }
      return axios.post('/trucks', values);
    },
    onSuccess: () => {
      message.success(`Truck ${initialValues ? 'updated' : 'registered'} successfully!`);
      queryClient.invalidateQueries(['trucks']);
      form.resetFields();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error saving truck:', error);
      message.error(`Failed to ${initialValues ? 'update' : 'register'} truck. Please try again.`);
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const onFinish = async (values) => {
    setLoading(true);
    mutation.mutate(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        gpsEnabled: true,
        status: 'available',
        ...initialValues
      }}
    >
      <Form.Item
        name="truckId"
        label="Truck ID"
        rules={[
          { required: true, message: 'Please enter Truck ID' },
          { pattern: /^[A-Z0-9-]+$/, message: 'Truck ID must be uppercase letters, numbers, and hyphens only' }
        ]}
      >
        <Input placeholder="Enter Truck ID (e.g., TRK-001)" />
      </Form.Item>

      <Form.Item
        name="registrationNumber"
        label="Vehicle Registration Number"
        rules={[
          { required: true, message: 'Please enter registration number' },
          { pattern: /^[A-Z0-9 ]+$/, message: 'Registration number must be uppercase letters and numbers' }
        ]}
      >
        <Input placeholder="Enter vehicle registration number" />
      </Form.Item>

      <Form.Item
        name="driverName"
        label="Driver Name"
        rules={[{ required: true, message: 'Please enter driver name' }]}
      >
        <Input placeholder="Enter driver's full name" />
      </Form.Item>

      <Form.Item
        name="associatedLocation"
        label="Associated Plant/Location"
        rules={[{ required: true, message: 'Please select associated location' }]}
      >
        <Select 
          placeholder="Select associated location" 
          loading={isLoadingLocations}
        >
          {plantLocations?.map(location => (
            <Option key={location._id} value={location._id}>
              {location.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="capacity"
        label="Capacity (tons)"
        rules={[{ required: true, message: 'Please enter capacity' }]}
      >
        <InputNumber
          min={1}
          max={50}
          placeholder="Enter capacity in tons"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="gpsEnabled"
        label="GPS Enabled"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="status"
        label="Current Status"
        rules={[{ required: true, message: 'Please select status' }]}
      >
        <Select>
          <Option value="available">Available</Option>
          <Option value="maintenance">Maintenance</Option>
          <Option value="en_route">En Route</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            htmlType="submit"
          >
            {initialValues ? 'Update' : 'Register'} Truck
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => form.resetFields()}
          >
            Clear Form
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TruckRegistrationForm;