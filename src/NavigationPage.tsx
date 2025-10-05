import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useLocation } from "./hooks/useLocationData";
import L from "leaflet";

function MapUpdater({ center }: { center: [number, number] }) {
	const map = useMap();

	useEffect(() => {
		map.setView(center, map.getZoom());
	}, [center, map]);

	return null;
}

const owlIcon = new L.Icon({
	iconUrl: "/owl.png",
	iconSize: [50, 50],
	iconAnchor: [25, 50],
	popupAnchor: [0, -50],
});

export default function NavigationPage() {
	const { coords } = useLocation();
	const mapRef = useRef(null);

	return (
		<div className="h-100 mx-auto w-100 sm:h-120 sm:w-120 overflow-hidden">
			{/* Map */}
			<MapContainer
				ref={mapRef}
				center={[coords.lat, coords.lng]}
				zoom={16}
				className="h-full w-full"
				zoomControl={false}
			>
				<TileLayer
					attribution="&copy; OpenStreetMap"
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MapUpdater center={[coords.lat, coords.lng]} />
				<Marker position={[coords.lat, coords.lng]} icon={owlIcon} />
			</MapContainer>
		</div>
	);
}
