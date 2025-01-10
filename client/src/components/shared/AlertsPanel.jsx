import React from 'react';
import { Badge, Card, List, Space, Tag, Typography } from 'antd';
import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const severityColors = {
  low: 'blue',
  medium: 'orange',
  high: 'red',
  critical: 'purple'
};

const statusIcons = {
  open: <AlertOutlined style={{ color: '#ff4d4f' }} />,
  acknowledged: <ClockCircleOutlined style={{ color: '#faad14' }} />,
  resolved: <CheckCircleOutlined style={{ color: '#52c41a' }} />
};

const AlertsPanel = ({ alerts, onAlertClick }) => {
  return (
    <Card 
      title={
        <Space>
          <AlertOutlined />
          <span>Active Alerts</span>
          <Badge count={alerts.filter(a => a.status === 'open').length} />
        </Space>
      }
      style={{ height: '100%', overflow: 'auto' }}
    >
      <List
        dataSource={alerts}
        renderItem={alert => (
          <List.Item
            onClick={() => onAlertClick(alert)}
            style={{ cursor: 'pointer' }}
            actions={[
              <Tag color={severityColors[alert.severity]}>
                {alert.severity.toUpperCase()}
              </Tag>
            ]}
          >
            <List.Item.Meta
              avatar={statusIcons[alert.status]}
              title={
                <Space>
                  <Text>{alert.title}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </Text>
                </Space>
              }
              description={alert.message}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AlertsPanel;
