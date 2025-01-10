import { BarChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { StatsCard } from '../../components/dashboard/stats-card'
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react'

const mockData = {
  deliveryTimes: [
    { name: 'Mon', trucks: 4.2, ships: 120 },
    { name: 'Tue', trucks: 3.8, ships: 132 },
    { name: 'Wed', trucks: 4.5, ships: 128 },
    { name: 'Thu', trucks: 4.1, ships: 124 },
    { name: 'Fri', trucks: 3.9, ships: 130 },
  ],
  delays: [
    { name: 'Mon', value: 5 },
    { name: 'Tue', value: 8 },
    { name: 'Wed', value: 3 },
    { name: 'Thu', value: 6 },
    { name: 'Fri', value: 4 },
  ]
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="On-Time Delivery"
          value="94%"
          icon={TrendingUp}
          trend={{ type: 'increase', value: '+2.5% from last week' }}
        />
        <StatsCard
          title="Average Delay"
          value="45min"
          icon={Clock}
          trend={{ type: 'decrease', value: '-12min from last week' }}
        />
        <StatsCard
          title="Delay Incidents"
          value="26"
          icon={AlertTriangle}
          trend={{ type: 'decrease', value: '-3 from last week' }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Times</h2>
          <BarChart width={500} height={300} data={mockData.deliveryTimes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="trucks" fill="#8884d8" name="Trucks (hours)" />
            <Bar dataKey="ships" fill="#82ca9d" name="Ships (hours)" />
          </BarChart>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Delay Incidents</h2>
          <BarChart width={500} height={300} data={mockData.delays}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ffc658" name="Incidents" />
          </BarChart>
        </div>
      </div>
    </div>
  )
}