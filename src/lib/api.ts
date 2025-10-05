export async function getData(coords: { lat: number; lng: number }) {
    // Base backend URL (no trailing slash to make concat predictable)
    const apilink = "https://theroamerbackend-8a8yra3n5-hakaneros-projects.vercel.app";

    const imageUrl =
        "https://www.tclf.org/sites/default/files/thumbnails/image/HarvardUniversity-sig.jpg";

    const defaultVoiceUrl =
        "https://github.com/rafaelreis-hotmart/Audio-Sample-files/raw/master/sample.mp3";

    try {
        const url = `${apilink}/audio`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: coords.lat,
                longitude: coords.lng
            })
        });
        
        if (!res.ok) throw new Error(`API responded with status ${res.status}`);
        
        const audioBlob = await res.blob();
        const voiceUrl = URL.createObjectURL(audioBlob);

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