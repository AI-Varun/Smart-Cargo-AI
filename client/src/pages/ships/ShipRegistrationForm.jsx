import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  message
} from 'antd';
import { SaveOutlined, ClearOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ShipRegistrationForm = ({ initialValues, onSuccess }) => {
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
        // Format the docking schedule
      if (values.dockingSchedule) {
        const [startTime, endTime] = values.dockingSchedule;
        values.dockingSchedule = {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          dockId: values.dockId,
          wharfAllocation: values.wharfAllocation
        };
      }

      // Format the location data
      if (values.location && values.location.coordinates) {
          values.location = {
            type: 'Point',
            coordinates: values.location.coordinates
          };
        }


      if (initialValues) {
        return axios.put(`/ships/${initialValues.id}`, values);
      }
      return axios.post('/ships', values);
    },
    onSuccess: () => {
      message.success(`Ship ${initialValues ? 'updated' : 'registered'} successfully!`);
      queryClient.invalidateQueries(['ships']);
      form.resetFields();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error saving ship:', error);
      message.error(`Failed to ${initialValues ? 'update' : 'register'} ship. Please try again.`);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
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
        status: 'at_dock',
        ...initialValues,
        dockingSchedule: initialValues?.dockingSchedule ? [
          initialValues.dockingSchedule.startTime,
          initialValues.dockingSchedule.endTime
        ] : undefined
      }}
    >
      <Form.Item
        name="shipId"
        label="Ship ID"
        rules={[
          { required: true, message: 'Please enter Ship ID' },
          { pattern: /^[A-Z0-9-]+$/, message: 'Ship ID must be uppercase letters, numbers, and hyphens only' }
        ]}
      >
        <Input placeholder="Enter Ship ID (e.g., SHP-001)" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Ship Name"
        rules={[{ required: true, message: 'Please enter ship name' }]}
      >
        <Input placeholder="Enter ship name" />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="Capacity (TEU)"
        rules={[{ required: true, message: 'Please enter capacity' }]}
      >
        <InputNumber
          min={1}
          max={20000}
          placeholder="Enter capacity in TEU"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Current Status"
        rules={[{ required: true, message: 'Please select status' }]}
      >
        <Select>
          <Option value="at_dock">At Dock</Option>
          <Option value="sailing">Sailing</Option>
          <Option value="maintenance">Maintenance</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="aisData"
        label="AIS MMSI Number"
        rules={[
          { required: true, message: 'Please enter MMSI number' },
          { pattern: /^\d{9}$/, message: 'MMSI must be a 9-digit number' }
        ]}
      >
        <Input placeholder="Enter 9-digit MMSI number" />
      </Form.Item>

      <Form.Item
        name="dockingSchedule"
        label="Docking Schedule"
        rules={[{ required: true, message: 'Please select docking schedule' }]}
      >
        <RangePicker
          showTime
          style={{ width: '100%' }}
          placeholder={['Start Time', 'End Time']}
        />
      </Form.Item>

      <Form.Item
        name="dockId"
        label="Dock ID"
        rules={[{ required: true, message: 'Please select dock' }]}
      >
        <Select placeholder="Select dock">
          <Option value="DOCK-A">Dock A</Option>
          <Option value="DOCK-B">Dock B</Option>
          <Option value="DOCK-C">Dock C</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="wharfAllocation"
        label="Wharf Allocation"
        rules={[{ required: true, message: 'Please select wharf' }]}
      >
        <Select placeholder="Select wharf">
          <Option value="WHARF-1">Wharf 1</Option>
          <Option value="WHARF-2">Wharf 2</Option>
          <Option value="WHARF-3">Wharf 3</Option>
        </Select>
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
          name="location"
          label="Current Location"
          rules={[
            {
              required: true,
              message: 'Please enter current location'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const coordinates = getFieldValue("location")?.coordinates
                if (!coordinates || coordinates.length !== 2) {
                    return Promise.reject(new Error('Location must have both longitude and latitude'));
                }
                if (coordinates[0] < -180 || coordinates[0] > 180 || coordinates[1] < -90 || coordinates[1] > 90) {
                     return Promise.reject(new Error('Invalid coordinates'));
                }
                 return Promise.resolve()
              },
            }),
          ]}
        >
            <Input.Group compact>
                <Form.Item
                name={['location', 'coordinates',0]}
                noStyle
                rules={[{ required: true, message: 'Enter longitude' }]}
                >
                <InputNumber
                    placeholder="Longitude"
                    style={{ width: '50%' }}
                    min={-180}
                    max={180}
                    step={0.000001}
                />
                </Form.Item>
                <Form.Item
                name={['location','coordinates',1]}
                noStyle
                rules={[{ required: true, message: 'Enter latitude' }]}
                >
                <InputNumber
                    placeholder="Latitude"
                    style={{ width: '50%' }}
                    min={-90}
                    max={90}
                    step={0.000001}
                />
                </Form.Item>
            </Input.Group>
      </Form.Item>


      <Form.Item>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            htmlType="submit"
          >
            {initialValues ? 'Update' : 'Register'} Ship
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

export default ShipRegistrationForm;