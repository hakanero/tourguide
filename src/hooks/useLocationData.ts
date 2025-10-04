import { useEffect, useState } from "react";

export function useLocation(timeout = 10000): { lat: number; lng: number } {
	

	const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			console.error("Geolocation is not supported by your browser");
			return;
		}

		const onSuccess = (position: GeolocationPosition) => {
			setLocation({
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			});
		};

		const onError = (error: GeolocationPositionError) => {
			console.error("Error getting location:", error);
		};

		const options = {
			enableHighAccuracy: true,
			timeout: timeout,
			maximumAge: 0,
		};

		navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
	}, [timeout]);

	return location || { lat: 42.3736, lng: -71.1097 }; // Default to Harvard Yard if location not available
}