import { reverseGeocode } from "./utils";

export async function getData(coords: { lat: number; lng: number }) {
	// Base backend URL (no trailing slash to make concat predictable)
	const apilink = "https://theroamerbackend.onrender.com/audio";

	const imageUrl =
		"https://www.tclf.org/sites/default/files/thumbnails/image/HarvardUniversity-sig.jpg";

	const placeName = reverseGeocode(coords);

	console.log("API Request - Sending coordinates:", {
		latitude: coords.lat,
		longitude: coords.lng,
		placeName,
	});
	const url = `${apilink}`;

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			latitude: coords.lat,
			longitude: coords.lng,
			placeName: placeName,
		}),
	});

	console.log("API Response status:", res.status);
	if (!res.ok) throw new Error(`API responded with status ${res.status}`);

	const audioBlob = await res.blob();
	console.log(
		"API Response - Received audio blob, size:",
		audioBlob.size,
		"bytes"
	);
	const voiceUrl = URL.createObjectURL(audioBlob);

	return {
		imageUrl,
		voiceUrl,
	};
}
