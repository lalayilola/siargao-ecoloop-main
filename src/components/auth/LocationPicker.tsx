import { useEffect, useState, type ComponentType } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    locationName: string;
    locationAddress: string;
  }) => void;
  initialLocation?: { latitude: number; longitude: number };
}

const loadLocationPicker = createClientOnlyFn(() => import("./LocationPicker.client"));

export function LocationPicker(props: LocationPickerProps) {
  const [ClientPicker, setClientPicker] = useState<ComponentType<LocationPickerProps> | null>(null);

  useEffect(() => {
    let isActive = true;

    void loadLocationPicker().then(({ LocationPickerClient }) => {
      if (isActive) setClientPicker(() => LocationPickerClient);
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!ClientPicker) {
    return (
      <Card className="space-y-3 p-4" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Select Location</h3>
        </div>
        <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted">
          <span className="text-sm text-muted-foreground">Loading map…</span>
        </div>
      </Card>
    );
  }

  return <ClientPicker {...props} />;
}
