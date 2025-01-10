import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Space, 
  Switch, 
  message 
} from 'antd';
import { SaveOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const TruckRegistration = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await axios.post('/trucks', values);
      message.success('Truck registered successfully!');
      form.resetFields();
    } catch (error) {
      console.error('Error registering truck:', error);
      message.error('Failed to register truck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Register New Truck">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          gpsEnabled: true,
          status: 'available'
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
          <Select placeholder="Select associated location">
            <Option value="plant_a">Plant A</Option>
            <Option value="plant_b">Plant B</Option>
            <Option value="warehouse_1">Warehouse 1</Option>
            <Option value="warehouse_2">Warehouse 2</Option>
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
              Register Truck
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
    </Card>
  );
};

export default TruckRegistration;
