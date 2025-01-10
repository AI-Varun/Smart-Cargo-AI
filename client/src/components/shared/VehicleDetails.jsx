import React from 'react';
import { Card, Descriptions, Space, Tag, Timeline } from 'antd';
import { 
  ClockCircleOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const statusColors = {
  // Truck statuses
  available: 'green',
  en_route: 'blue',
  loading: 'orange',
  maintenance: 'red',
  // Ship statuses
  at_dock: 'green',
  sailing: 'blue',
  delayed: 'red'
};

const VehicleDetails = ({ vehicle, routeProgress }) => {
  const isShip = vehicle.type === 'ship';

  return (
    <Card title={`${isShip ? '🚢' : '🚛'} ${vehicle.name}`}>
      <Descriptions column={1}>
        <Descriptions.Item label="Status">
          <Tag color={statusColors[vehicle.status]}>
            {vehicle.status.replace('_', ' ').toUpperCase()}
          </Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="ID">
          {isShip ? vehicle.shipId : vehicle.truckId}
        </Descriptions.Item>

        {isShip ? (
          <>
            <Descriptions.Item label="Capacity">
              {vehicle.capacity} TEU
            </Descriptions.Item>
            {vehicle.dockingSchedule && (
              <Descriptions.Item label="Next Dock">
                {`${vehicle.dockingSchedule.dockId} (${new Date(vehicle.dockingSchedule.startTime).toLocaleString()})`}
              </Descriptions.Item>
            )}
          </>
        ) : (
          <>
            <Descriptions.Item label="Driver">
              {vehicle.driverName}
            </Descriptions.Item>
            <Descriptions.Item label="Registration">
              {vehicle.registrationNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Capacity">
              {vehicle.capacity} tons
            </Descriptions.Item>
          </>
        )}

        {vehicle.currentDestination && (
          <Descriptions.Item label="Destination">
            {vehicle.currentDestination}
          </Descriptions.Item>
        )}

        {vehicle.eta && (
          <Descriptions.Item label="ETA">
            {new Date(vehicle.eta).toLocaleString()}
          </Descriptions.Item>
        )}
      </Descriptions>

      {routeProgress && (
        <Space direction="vertical" style={{ width: '100%', marginTop: '20px' }}>
          <Timeline>
            <Timeline.Item 
              dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
              color="green"
            >
              Started Journey
            </Timeline.Item>
            
            <Timeline.Item 
              dot={<LoadingOutlined style={{ fontSize: '16px' }} />}
              color="blue"
            >
              In Transit ({Math.round(routeProgress.progress * 100)}% Complete)
              <br />
              <small>
                Distance: {Math.round(routeProgress.totalDistance / 1000)}km
                <br />
                Time Remaining: {Math.round((routeProgress.totalDuration - routeProgress.elapsedTime) / 60)} minutes
              </small>
            </Timeline.Item>

            <Timeline.Item 
              dot={<EnvironmentOutlined style={{ fontSize: '16px' }} />}
              color={routeProgress.progress === 1 ? 'green' : 'gray'}
            >
              Destination
            </Timeline.Item>
          </Timeline>
        </Space>
      )}
    </Card>
  );
};

export default VehicleDetails;
