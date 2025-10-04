import {
	MapPinIcon,
	PauseIcon,
	PlayIcon,
	SkipBackIcon,
	StopIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useLocation } from "./hooks/useLocationData";
import { getData } from "./lib/api";
import { useVoiceGuide } from "./hooks/useVoiceGuide";

export default function App() {
	const coords = useLocation();
	const { locationName, imageUrl, voiceUrl } = getData(coords);
	const {
		startVoiceGuide,
		stopVoiceGuide,
		pauseVoiceGuide,
		restartVoiceGuide,
		isPlaying,
		audioRef,
    isReset,
	} = useVoiceGuide();

	return (
		<div
			className="relative flex flex-col items-center justify-center h-screen w-full bg-cover bg-center overflow-hidden"
			style={{
				backgroundImage: `url('${imageUrl}')`,
			}}
		>
			<div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

			<div className="relative z-10 flex flex-col items-center text-center px-6 py-10 rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
				<h2 className="text-white/90 text-sm tracking-widest uppercase mb-2">
					Current Location
				</h2>
				<h1 className="text-4xl font-semibold text-white mb-10 drop-shadow-md flex flex-row items-center justify-center">
					<MapPinIcon weight="fill" className="mr-2 h-8" /> {locationName}
				</h1>

				<motion.div
					transition={{ duration: 0.5 }}
					className={`flex flex-row items-center space-x-6 ${
						isPlaying ? "animate-pulse" : ""
					}`}
				>
					{(isPlaying || !isReset) && (
						<motion.button
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
							className={`p-2 rounded-full bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg cursor-pointer`}
						>
							<SkipBackIcon
								size={25}
								weight="fill"
								className="text-gray-900"
								onClick={restartVoiceGuide}
							/>
						</motion.button>
					)}

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="flex items-center justify-center w-28 h-28 rounded-full bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg cursor-pointer"
						onClick={isPlaying ? pauseVoiceGuide : startVoiceGuide}
					>
						{isPlaying ? (
							<PauseIcon size={44} weight="fill" className="text-gray-900" />
						) : (
							<PlayIcon size={44} weight="fill" className="text-gray-900" />
						)}
					</motion.button>

					{!isReset && (
						<motion.button
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
							className="p-2 rounded-full bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg cursor-pointer"
						>
							<StopIcon
								size={25}
								weight="fill"
								className="text-gray-900"
								onClick={stopVoiceGuide}
							/>
						</motion.button>
					)}
				</motion.div>

				<p className="mt-6 text-xl text-white font-medium drop-shadow">
					{isPlaying ? "Stop the tour" : "Start the tour"}
				</p>
			</div>

			<div className="absolute w-96 h-96 bg-white/20 blur-3xl rounded-full -top-20 right-10 pointer-events-none" />
			<audio ref={audioRef} src={voiceUrl} />
		</div>
	);
}
