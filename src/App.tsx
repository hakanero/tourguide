import {
	CompassIcon,
	GlobeIcon,
	MapPinIcon,
	PauseIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useLocation } from "./hooks/useLocationData";
import { getData } from "./lib/api";
import { useVoiceGuide } from "./hooks/useVoiceGuide";
import { useState, useEffect, useRef } from "react";
import NavigationPage from "./NavigationPage";

export default function App() {
	const { coords, placeName } = useLocation();
	const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
	const [nextVoiceUrl, setNextVoiceUrl] = useState<string | null>(null);
	const [isLoadingAudio, setIsLoadingAudio] = useState(false);
	const [currentCoords, setCurrentCoords] = useState(coords);
	const [hasPreloadedNext, setHasPreloadedNext] = useState(false);
	const [language, setLanguage] = useState("english");
	const previousLanguageRef = useRef("english");
	const currentLanguageRef = useRef("english");
	const [visitedCoordinates, setVisitedCoordinates] = useState<Array<{ lat: number; lng: number }>>([]);
	const hasInitializedCoords = useRef(false);

	const { startVoiceGuide, pauseVoiceGuide, isPlaying, audioRef } =
		useVoiceGuide();	// Fetch voice URL (and image if backend provides a different one) when coords change
	useEffect(() => {
		let mounted = true;

		// Check if coordinates have actually changed
		const coordsChanged =
			currentCoords.lat !== coords.lat || currentCoords.lng !== coords.lng;

		if (!coordsChanged) return;

		// Add new coordinates to the visited list
		setVisitedCoordinates(prev => {
			// Check if this coordinate is already in the list (avoid duplicates)
			const isDuplicate = prev.some(
				c => Math.abs(c.lat - coords.lat) < 0.0001 && Math.abs(c.lng - coords.lng) < 0.0001
			);
			if (isDuplicate) return prev;
			
			// Only add if this is not the Harvard Yard default location OR if we already have coordinates
			// (meaning this is a subsequent location change)
			const isHarvardYard = Math.abs(coords.lat - 42.3736) < 0.0001 && Math.abs(coords.lng - (-71.1097)) < 0.0001;
			if (isHarvardYard && prev.length === 0 && !hasInitializedCoords.current) {
				// This is the initial Harvard Yard default, don't add it
				return prev;
			}
			
			// Mark that we've initialized with a real coordinate
			if (!hasInitializedCoords.current && !isHarvardYard) {
				hasInitializedCoords.current = true;
			}
			
			return [...prev, { lat: coords.lat, lng: coords.lng }];
		});

		// If we already preloaded this location's audio, use it immediately
		if (nextVoiceUrl && hasPreloadedNext) {
			console.log("Using preloaded audio for new coordinates");
			setVoiceUrl(nextVoiceUrl);
			setNextVoiceUrl(null);
			setHasPreloadedNext(false);
			setCurrentCoords(coords);
			setIsLoadingAudio(false);
			return;
		}

		// Otherwise fetch normally
		setIsLoadingAudio(true);
		setVoiceUrl(null);
		(async () => {
			try {
				const currentLang = currentLanguageRef.current;
				console.log("Fetching audio for coordinates:", coords.lat, coords.lng, "language:", currentLang);
				const data = await getData(coords, currentLang);
				if (!mounted) return;
				// Only use the data if the language hasn't changed during the fetch
				if (currentLang === currentLanguageRef.current && data.voiceUrl) {
					setVoiceUrl(data.voiceUrl);
					setCurrentCoords(coords);
					setHasPreloadedNext(false);
				}
			} catch (e) {
				console.error("getData error:", e);
			} finally {
				if (mounted) {
					setIsLoadingAudio(false);
				}
			}
		})();
		return () => {
			mounted = false;
		};
	}, [
		coords.lat,
		coords.lng,
		placeName,
		nextVoiceUrl,
		hasPreloadedNext,
		currentCoords,
		language,
	]);

	// Preload next audio immediately when current audio starts playing
	useEffect(() => {
		if (!isPlaying || hasPreloadedNext) return;

		console.log("Audio started playing, preloading next segment...");
		setHasPreloadedNext(true);

		const currentLang = currentLanguageRef.current;
		// Fetch the next audio segment immediately when playback starts
		// In a real scenario, you might want to predict the next location
		// For now, we'll just fetch for the same coords to have it ready
		getData(coords, currentLang)
			.then((data) => {
				// Only use the data if the language hasn't changed
				if (currentLang === currentLanguageRef.current && data.voiceUrl) {
					setNextVoiceUrl(data.voiceUrl);
					console.log("Next audio segment preloaded");
				}
			})
			.catch((err) => {
				console.error("Failed to preload next audio:", err);
			});
	}, [isPlaying, hasPreloadedNext, coords, language]);

	// Refetch audio when language changes
	useEffect(() => {
		// Only run when language actually changes, not on initial mount
		if (language === previousLanguageRef.current) return;
		
		console.log("Language changed from", previousLanguageRef.current, "to", language);
		previousLanguageRef.current = language;
		currentLanguageRef.current = language;
		
		let mounted = true;

		setIsLoadingAudio(true);
		setVoiceUrl(null);
		setNextVoiceUrl(null);
		setHasPreloadedNext(false);
		
		// Pause current audio if playing and reset the playing state
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.src = "";
		}

		(async () => {
			try {
				const fetchLanguage = language;
				console.log("Fetching audio for new language:", fetchLanguage);
				const data = await getData(coords, fetchLanguage);
				if (!mounted) return;
				// Only set the URL if the language is still the same (no subsequent change happened)
				if (fetchLanguage === currentLanguageRef.current && data.voiceUrl) {
					console.log("Setting voice URL for language:", fetchLanguage);
					setVoiceUrl(data.voiceUrl);
				} else {
					console.log("Discarding audio for language:", fetchLanguage, "current is:", currentLanguageRef.current);
				}
			} catch (e) {
				console.error("Language change getData error:", e);
			} finally {
				if (mounted) {
					setIsLoadingAudio(false);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, [language, coords, audioRef]);

	// If voice guide is playing and voiceUrl changes, wait for current to finish before playing next
	useEffect(() => {
		if (!audioRef.current || !voiceUrl) return;

		const audio = audioRef.current;
		const currentSrc = audio.src;
		const newSrc = voiceUrl;

		// Only update if the URL has actually changed
		if (currentSrc === newSrc) return;

		console.log("Audio URL changed, updating source...");
		
		// Always update the src attribute first
		audio.src = voiceUrl;

		if (isPlaying) {
			// If currently playing, pause the old audio and load the new one
			audio.pause();
			audio.load();
			// Try to auto-play the new audio
			audio.play().catch((err) => console.error("Auto-play failed:", err));
		} else {
			// If not playing, just load the new audio
			audio.load();
		}
	}, [voiceUrl, isPlaying]);

	const [page, setPage] = useState<"home" | "navigation">("home");

	return (
		<div
			className="relative flex flex-col items-center justify-center h-screen w-full bg-cover bg-center overflow-hidden
			"
			style={{ backgroundImage: `url("/background.png")` }}
		>
			<div className="absolute top-2 right-2 z-10 text-white/80 cursor-pointer flex flex-row items-center gap-2 text-md">
				<GlobeIcon />
				<select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent focus:outline-none">
					<option value="english">English</option>
					<option value="spanish">Spanish</option>
					<option value="french">French</option>
					<option value="german">German</option>
					<option value="chinese">Chinese</option>
					<option value="turkish">Turkish</option>
				</select>
			</div>
			<div className="absolute top-2 left-2 z-10 flex flex-row items-center text-white font-semibold gap-2 text-xl">
				<CompassIcon size={32} /> Roamer AI
			</div>
			<div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

			<div className="my-10 relative z-10 flex flex-col items-center text-center pt-10 rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
				<div className="px-6">
					<h2 className="text-white/90 text-sm tracking-widest uppercase mb-2">
						Current Location
					</h2>
					<h1 className="text-4xl font-semibold text-white mb-10 drop-shadow-md flex flex-row items-center justify-center">
						<MapPinIcon weight="fill" className="mr-2 h-8" /> {placeName}
					</h1>
				</div>

				{page === "navigation" ? (
					<div className="w-full h-full">
						<NavigationPage visitedCoordinates={visitedCoordinates} />
					</div>
				) : (
					<div className="px-6 flex flex-col items-center text-center mb-6">
						<motion.div
							transition={{ duration: 0.5 }}
							className={`flex flex-row items-center space-x-6 ${
								isPlaying ? "animate-pulse" : ""
							}`}
						>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className={`flex items-center justify-center w-28 h-28 rounded-full bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg ${
									voiceUrl && !isLoadingAudio
										? "cursor-pointer"
										: "cursor-not-allowed opacity-50"
								}`}
								onClick={
									voiceUrl && !isLoadingAudio
										? isPlaying
											? pauseVoiceGuide
											: startVoiceGuide
										: undefined
								}
								disabled={!voiceUrl || isLoadingAudio}
							>
								{isLoadingAudio ? (
									<div className="animate-spin h-11 w-11 border-4 border-gray-900 border-t-transparent rounded-full" />
								) : isPlaying ? (
									<PauseIcon
										size={44}
										weight="fill"
										className="text-gray-900"
									/>
								) : (
									<PlayIcon size={44} weight="fill" className="text-gray-900" />
								)}
							</motion.button>
						</motion.div>

						<p className="mt-6 text-xl text-white font-medium drop-shadow">
							{isLoadingAudio
								? "Loading tour..."
								: isPlaying
								? "Stop the tour"
								: "Start the tour"}
						</p>
					</div>
				)}

				<div className="h-20 w-full flex flex-row items-start justify-center">
					<div
						className={`h-full flex flex-row items-center justify-center text-white border-white/40 w-1/2 cursor-pointer ${
							page === "navigation" ? "border-t-1" : ""
						}`}
						onClick={() => setPage("home")}
					>
						Home
					</div>
					<div
						className={`h-full flex flex-row items-center justify-center text-white w-1/2 border-white/40 border-l-1 cursor-pointer ${
							page === "home" ? "border-t-1" : ""
						}`}
						onClick={() => setPage("navigation")}
					>
						Navigation
					</div>
				</div>
			</div>

			<div className="absolute w-96 h-96 bg-white/20 blur-3xl rounded-full -top-20 right-10 pointer-events-none" />
			<audio ref={audioRef} />
		</div>
	);
}
