import { useState } from 'react';
import { reverseGeocode } from '../services/nominatim';

export function useGeolocation(onDetected) {
  const [isDetecting, setIsDetecting] = useState(false);

  function detect() {
    if (!navigator.geolocation) return;

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location',
          address: 'Detected from this device',
        };

        try {
          const namedLocation = await reverseGeocode(location.lat, location.lng);
          onDetected(namedLocation || location);
        } catch {
          onDetected(location);
        } finally {
          setIsDetecting(false);
        }
      },
      () => setIsDetecting(false),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  return { detect, isDetecting };
}
