import { useEffect, useState } from "react";
import { reverseGeocode } from "../lib/utils";

export function useLocation(timeout = 10000): {
	coords: { lat: number; lng: number };
	placeName?: string;
} {
	const [location, setLocation] = useState<{
		coords: { lat: number; lng: number };
		placeName?: string;
	} | null>(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			console.error("Geolocation is not supported by your browser");
			return;
		}

		const onSuccess = async (position: GeolocationPosition) => {
			setLocation({
				coords: {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				},
				placeName:
					(
						await reverseGeocode({
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						})
					).split(",")[0] || "Unknown place",
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

		// Get location immediately
		navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

		// Update location every 1 minute 30 seconds (90000 milliseconds)
		const intervalId = setInterval(() => {
			navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
		}, 60000);

		// Cleanup interval on unmount
		return () => clearInterval(intervalId);
	}, [timeout]);

	return (
		location || {
			coords: { lat: 42.3736, lng: -71.1097 },
			placeName: "Harvard Yard",
		}
	); // Default to Harvard Yard if location not available
}
