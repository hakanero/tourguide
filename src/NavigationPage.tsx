import { use, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { DivIcon } from "leaflet";
import { useLocation } from "./hooks/useLocationData";
import { useVoiceGuide } from "./hooks/useVoiceGuide";

function RecenterOnMe({
	map,
	to,
}: {
	map: React.RefObject<any>;
	to: { lat: number; lng: number } | null;
}) {
	const mapInstance = map.current;
	const did = useRef(false);
	useEffect(() => {
		if (to && mapInstance && !did.current) {
			mapInstance.setView([to.lat, to.lng], 16, { animate: true });
			did.current = true;
		}
	}, [to, map]);
	return null;
}

function useMascotIcon(talking = true) {
	return useMemo<DivIcon>(() => {
		const el = document.createElement("div");
		el.style.position = "relative";
		el.style.transform = "translate(-50%, -100%)"; // anchor bottom center

		const stateClass = talking ? "talking" : "paused";

		el.innerHTML = `
      <div class="mascot ${stateClass}" style="position: relative; display: grid; place-items: center;">
        <!-- Avatar wrapper with ring & bobbing -->
        <div class="avatar">
          <img src="/src/assets/owl.png" alt="Guide" class="owl" />
          <!-- pulsing ring shown only when talking -->
          <div class="ring"></div>
          <!-- pause badge shown when paused -->
          <div class="pause-badge">⏸</div>
          <!-- equalizer bars (only move when talking) -->
          <div class="eq">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Pin base -->
        <img src="/src/assets/maps.png" alt="Pin" class="pin"/>
      </div>
    `;

		const style = document.createElement("style");
		style.textContent = `
      .mascot .avatar {
        position: relative;
        height: 62px; width: 62px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid #2563eb;
        box-shadow: 0 6px 18px rgba(0,0,0,0.18);
        display: grid; place-items: center;
        overflow: hidden;
      }
      .mascot .owl {
        width: 48px; height: 48px; object-fit: contain;
      }
      .mascot .pin {
        width: 40px; height: 40px; object-fit: contain;
        margin-top: 8px;
        filter: drop-shadow(0 3px 8px rgba(0,0,0,0.30));
      }

      .mascot .eq {
        position: absolute; right: -14px; top: 18px;
        display: flex; gap: 3px;
        height: 20px; align-items: flex-end;
        opacity: 0.95;
      }
      .mascot .eq span {
        width: 4px; background: #2563eb; border-radius: 2px;
        height: 6px;                 /* base height when paused */
        animation: none;             /* default no animation */
      }
      .mascot.talking .eq span {
        animation: bounce 900ms ease-in-out infinite;
      }
      .mascot.talking .eq span:nth-child(2) { animation-delay: 110ms; }
      .mascot.talking .eq span:nth-child(3) { animation-delay: 220ms; }

      @keyframes bounce {
        0%   { height: 6px }
        25%  { height: 18px }
        50%  { height: 10px }
        75%  { height: 20px }
        100% { height: 6px }
      }

      /* Pulsing ring around avatar when talking */
      .mascot .ring {
        position: absolute; inset: -4px;
        border: 3px solid rgba(37, 99, 235, 0.35);
        border-radius: 999px;
        opacity: 0; transform: scale(0.85);
      }
      .mascot.talking .ring {
        animation: ring 1.2s ease-out infinite;
      }
      @keyframes ring {
        0%   { opacity: .7; transform: scale(0.85) }
        70%  { opacity: 0;  transform: scale(1.25) }
        100% { opacity: 0;  transform: scale(1.25) }
      }

      /* Gentle bobbing while talking */
      .mascot.talking .avatar {
        animation: bob 2.4s ease-in-out infinite;
      }
      @keyframes bob {
        0%,100% { transform: translateY(0px) }
        50%     { transform: translateY(-2px) }
      }

      /* Pause badge only visible when paused */
      .mascot .pause-badge {
        position: absolute; right: -6px; top: -6px;
        height: 20px; width: 20px; border-radius: 999px;
        background: white; border: 1px solid #e2e8f0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        display: grid; place-items: center;
        font-size: 12px; color: #0f172a;
        opacity: 0; transform: scale(0.9);
        transition: opacity .15s ease, transform .15s ease;
      }
      .mascot.paused .pause-badge {
        opacity: 1; transform: scale(1);
      }
    `;
		el.appendChild(style);

		return L.divIcon({
			html: el,
			iconSize: [0, 0],
			className: "mascot-icon",
		});
	}, [talking]);
}

export default function NavigationPage() {
	const { coords } = useLocation();
	const { isPlaying: talking } = useVoiceGuide();
	const mascotIcon = useMascotIcon(talking); // <-- drive waves
	const mapRef = useRef(null);

	return (
		<div className="h-120 w-120 overflow-hidden">
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
				{
					<RecenterOnMe
						map={mapRef}
						to={{ lat: coords.lat, lng: coords.lng }}
					/>
				}

				<Marker position={[coords.lat, coords.lng]} icon={mascotIcon} />
			</MapContainer>
		</div>
	);
}
