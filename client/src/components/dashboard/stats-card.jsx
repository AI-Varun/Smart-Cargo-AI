import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

export function StatsCard({ title, value, icon: Icon, description, trend }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground">
            {description}
            {trend && (
              <span className={trend.type === 'increase' ? 'text-green-500' : 'text-red-500'}>
                {trend.value}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}