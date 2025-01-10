import { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

export function ShipScheduler({ ships = [] }) {
  const [selectedShip, setSelectedShip] = useState(null);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ship Schedule
        </CardTitle>
        <CardDescription>
          View and manage ship schedules and routes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {ships.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No ships available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ships.map((ship) => (
                <Card
                  key={ship.id}
                  className={`cursor-pointer transition-all ${
                    selectedShip?.id === ship.id
                      ? "border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedShip(ship)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{ship.name}</CardTitle>
                    <CardDescription>
                      <div className="flex justify-between items-center">
                        <span>{ship.status}</span>
                        <span className="text-primary">{ship.eta}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Destination:</span>
                        <span>{ship.destination}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">Cargo:</span>
                        <span>{ship.cargo}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {selectedShip && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Schedule Actions</h3>
              <div className="flex gap-2">
                <Button variant="outline">View Route</Button>
                <Button variant="outline">Update Schedule</Button>
                <Button variant="outline">View Details</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
