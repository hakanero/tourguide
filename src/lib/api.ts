export async function getData(coords: { lat: number; lng: number }) {
    // Base backend URL (no trailing slash to make concat predictable)
    const apilink = "https://tourguidebackend.fly.dev/api";

    const imageUrl =
        "https://www.tclf.org/sites/default/files/thumbnails/image/HarvardUniversity-sig.jpg";

    const defaultVoiceUrl =
        "https://github.com/rafaelreis-hotmart/Audio-Sample-files/raw/master/sample.mp3";

    try {
        const url = `${apilink}/tour?lat=${encodeURIComponent(
            coords.lat
        )}&lon=${encodeURIComponent(coords.lng)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded with status ${res.status}`);
        const data = await res.json();

        // Accept a few possible field names from the backend
        const voiceUrl = data.voiceUrl || data.url || data.audioUrl || data.audio || defaultVoiceUrl;

        return {
            imageUrl,
            voiceUrl,
        };
    } catch (err) {
        console.error("Failed to fetch voice URL from API:", err);
        return {
            imageUrl,
            voiceUrl: defaultVoiceUrl,
        };
    }
}