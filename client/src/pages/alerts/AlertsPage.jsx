import { useState } from 'react'
import { DataTable } from '../../components/ui/data-table'
import { StatsCard } from '../../components/dashboard/stats-card'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

const mockAlerts = [
  {
    id: 'AL001',
    type: 'Delay',
    severity: 'High',
    message: 'Ship Ocean Queen delayed by 6 hours',
    timestamp: '2 hours ago',
    status: 'Open',
    affectedAsset: 'Ocean Queen',
  },
  {
    id: 'AL002',
    type: 'Weather',
    severity: 'Medium',
    message: 'Storm warning on route to Singapore',
    timestamp: '4 hours ago',
    status: 'Open',
    affectedAsset: 'Multiple Ships',
  },
  {
    id: 'AL003',
    type: 'Maintenance',
    severity: 'Low',
    message: 'Scheduled maintenance for Truck T-123',
    timestamp: '1 day ago',
    status: 'Resolved',
    affectedAsset: 'Truck T-123',
  },
]

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState(null)

  const columns = [
    { key: 'id', label: 'Alert ID' },
    { 
      key: 'severity',
      label: 'Severity',
      render: (row) => (
        <Badge
          variant={
            row.severity === 'High' ? 'destructive' :
            row.severity === 'Medium' ? 'warning' :
            'secondary'
          }
        >
          {row.severity}
        </Badge>
      )
    },
    { key: 'type', label: 'Type' },
    { key: 'message', label: 'Message' },
    { key: 'timestamp', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'Open' ? 'destructive' : 'success'}>
          {row.status}
        </Badge>
      )
    },
    { key: 'affectedAsset', label: 'Affected Asset' },
  ]

  const openAlerts = mockAlerts.filter(alert => alert.status === 'Open')
  const highSeverityAlerts = mockAlerts.filter(alert => alert.severity === 'High')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alerts</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Open Alerts"
          value={openAlerts.length.toString()}
          icon={AlertTriangle}
          trend={{ type: 'increase', value: '+2 from yesterday' }}
        />
        <StatsCard
          title="Average Response Time"
          value="45min"
          icon={Clock}
          trend={{ type: 'decrease', value: '-10min from last week' }}
        />
        <StatsCard
          title="Resolved Today"
          value="8"
          icon={CheckCircle}
          trend={{ type: 'increase', value: '+3 from yesterday' }}
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Alert History</h2>
          <div className="flex gap-2">
            {highSeverityAlerts.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                {highSeverityAlerts.length} High Priority
              </Badge>
            )}
            {openAlerts.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {openAlerts.length} Open
              </Badge>
            )}
          </div>
        </div>
        <DataTable
          data={mockAlerts}
          columns={columns}
          onRowClick={setSelectedAlert}
        />
      </div>
    </div>
  )
}
