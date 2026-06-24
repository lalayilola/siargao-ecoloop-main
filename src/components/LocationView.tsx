import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix for default marker icon in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationViewProps {
  latitude: number;
  longitude: number;
  locationName: string;
  locationAddress?: string;
  onClose?: () => void;
}

export function LocationView({ latitude, longitude, locationName, locationAddress, onClose }: LocationViewProps) {
  const [mapLoading, setMapLoading] = useState(true);
  const openInMaps = () => {
    // Open in Google Maps
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  const openDirections = () => {
    // Open directions in Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Location Details</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Map */}
      <div className="h-[400px] w-full rounded-lg overflow-hidden border relative">
        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        )}
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          whenReady={() => setMapLoading(false)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]}>
            <Popup>
              <div className="text-center">
                <strong>{locationName}</strong>
                {locationAddress && <p className="text-sm mt-1">{locationAddress}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Location Info */}
      <div className="space-y-2">
        <p className="font-medium">{locationName}</p>
        {locationAddress && (
          <p className="text-sm text-muted-foreground">{locationAddress}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={openInMaps} className="flex-1" variant="outline">
          <MapPin className="h-4 w-4 mr-2" />
          Open in Maps
        </Button>
        <Button onClick={openDirections} className="flex-1">
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </div>
    </Card>
  );
}
