import { MapPinIcon, PlayIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function App() {
	return (
		<div
			className="relative flex flex-col items-center justify-center h-screen w-full bg-cover bg-center overflow-hidden"
			style={{
				backgroundImage:
					"url('https://www.tclf.org/sites/default/files/thumbnails/image/HarvardUniversity-sig.jpg')",
			}}
		>
			<div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

			<div className="relative z-10 flex flex-col items-center text-center px-6 py-10 rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
				<h2 className="text-white/90 text-sm tracking-widest uppercase mb-2">
					Current Location
				</h2>
				<h1 className="text-4xl font-semibold text-white mb-10 drop-shadow-md flex flex-row items-center justify-center">
					<MapPinIcon weight="fill" className="mr-2 h-8" /> Harvard Yard
				</h1>

				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className="flex items-center justify-center w-28 h-28 rounded-full bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg"
				>
					<PlayIcon size={44} weight="fill" className="text-gray-900" />
				</motion.button>

				<p className="mt-6 text-xl text-white font-medium drop-shadow">
					Start the tour
				</p>
			</div>

			<div className="absolute w-96 h-96 bg-white/20 blur-3xl rounded-full -top-20 right-10 pointer-events-none" />
		</div>
	);
}
