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
import { useState, useEffect } from "react";
import NavigationPage from "./NavigationPage";

export default function App() {
	const { coords, placeName } = useLocation();
	const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
	const [nextVoiceUrl, setNextVoiceUrl] = useState<string | null>(null);
	const [isLoadingAudio, setIsLoadingAudio] = useState(false);
	const [currentCoords, setCurrentCoords] = useState(coords);
	const [hasPreloadedNext, setHasPreloadedNext] = useState(false);
	const [language, setLanguage] = useState("en");

	const { startVoiceGuide, pauseVoiceGuide, isPlaying, audioRef } =
		useVoiceGuide();

	// Fetch voice URL (and image if backend provides a different one) when coords change
	useEffect(() => {
		let mounted = true;

		// Check if coordinates have actually changed
		const coordsChanged =
			currentCoords.lat !== coords.lat || currentCoords.lng !== coords.lng;

		if (!coordsChanged) return;

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
				console.log("Fetching audio for coordinates:", coords.lat, coords.lng);
				const data = await getData(coords, language);
				if (!mounted) return;
				if (data.voiceUrl) {
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
	]);

	// Preload next audio immediately when current audio starts playing
	useEffect(() => {
		if (!isPlaying || hasPreloadedNext) return;

		console.log("Audio started playing, preloading next segment...");
		setHasPreloadedNext(true);

		// Fetch the next audio segment immediately when playback starts
		// In a real scenario, you might want to predict the next location
		// For now, we'll just fetch for the same coords to have it ready
		getData(coords, language)
			.then((data) => {
				if (data.voiceUrl) {
					setNextVoiceUrl(data.voiceUrl);
					console.log("Next audio segment preloaded");
				}
			})
			.catch((err) => {
				console.error("Failed to preload next audio:", err);
			});
	}, [isPlaying, hasPreloadedNext, coords]);

	// If voice guide is playing and voiceUrl changes, wait for current to finish before playing next
	useEffect(() => {
		if (!audioRef.current || !voiceUrl) return;

		const audio = audioRef.current;

		if (isPlaying) {
			console.log("Audio changed while playing, waiting for current to finish...");
			
			// Set up listener to play new audio when current one ends
			const handleEnded = () => {
				console.log("Current audio finished, loading next audio...");
				audio.load();
				audio.play().catch((err) => console.error("Auto-play failed:", err));
			};

			audio.addEventListener('ended', handleEnded);

			return () => {
				audio.removeEventListener('ended', handleEnded);
			};
		} else {
			// If not playing, just load the new audio
			console.log("Audio changed while paused, loading new audio...");
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
						<NavigationPage />
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
			{voiceUrl && <audio ref={audioRef} src={voiceUrl} />}
		</div>
	);
}
