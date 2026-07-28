import { useEffect, useState, type ComponentType } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export interface LocationViewProps {
  latitude: number;
  longitude: number;
  locationName: string;
  locationAddress?: string;
  onClose?: () => void;
}

const loadLocationView = createClientOnlyFn(() => import("./LocationView.client"));

export function LocationView(props: LocationViewProps) {
  const [ClientView, setClientView] = useState<ComponentType<LocationViewProps> | null>(null);

  useEffect(() => {
    let isActive = true;

    void loadLocationView().then(({ LocationViewClient }) => {
      if (isActive) setClientView(() => LocationViewClient);
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!ClientView) {
    return (
      <Card className="space-y-3 p-4" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Location Details</h3>
        </div>
        <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted">
          <span className="text-sm text-muted-foreground">Loading map…</span>
        </div>
      </Card>
    );
  }

  return <ClientView {...props} />;
}
