import React from "react";
import { MoonData } from "../../types/planet.types";

interface MoonDetailsCardProps {
  moon: MoonData;
  parentPlanetName: string;
  onClose?: () => void;
}

export const MoonDetailsCard: React.FC<MoonDetailsCardProps> = ({
  moon,
  parentPlanetName,
  onClose,
}) => {
  return (
    <div
      className="fixed bottom-4 left-4 z-[60] bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 w-96 max-h-[70vh] text-white shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      style={{ pointerEvents: "auto" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{moon.name}</h2>
          <p className="text-sm text-gray-400">
            Moon of {parentPlanetName}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Moon Type */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1 mb-2">
          Moon Type
        </h3>
        <div className="text-sm">
          <span className="text-gray-400">Type:</span>
          <span className="ml-2 text-white">
            {moon.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1 mb-2">
          Physical Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Radius:</div>
          <div>{(moon.size / 1000).toFixed(0)} km</div>
          
          <div className="text-gray-400">Material:</div>
          <div className="capitalize">{moon.material}</div>
        </div>
      </div>

      {/* Orbital Properties */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1 mb-2">
          Orbital Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Distance:</div>
          <div>{(moon.orbitalDistance * 1000).toFixed(0)} km</div>
          
          <div className="text-gray-400">Speed:</div>
          <div>{moon.orbitalSpeed.toFixed(2)} km/s</div>
          
          <div className="text-gray-400">Inclination:</div>
          <div>{moon.orbitalInclination.toFixed(1)}°</div>
          
          <div className="text-gray-400">Eccentricity:</div>
          <div>{moon.orbitalEccentricity.toFixed(3)}</div>
        </div>
      </div>

      {/* Rotation Properties */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1 mb-2">
          Rotation
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Speed:</div>
          <div>{(moon.rotation.speed * 1000).toFixed(1)} mrad/s</div>
          
          <div className="text-gray-400">Direction:</div>
          <div>{moon.rotation.direction === 1 ? "Prograde" : "Retrograde"}</div>
        </div>
      </div>

      {/* Visual Properties */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1 mb-2">
          Visual Properties
        </h3>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-400">Color:</div>
          <div 
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ 
              backgroundColor: moon.type === "ice_world" ? "#E6F3FF" :
                              moon.type === "rocky_world" ? "#8B7355" :
                              moon.type === "terrestrial" ? "#4A5D23" :
                              moon.type === "desert_world" ? "#D2B48C" :
                              moon.type === "dwarf_planet" ? "#696969" :
                              moon.type === "lava_world" ? "#FF4500" :
                              moon.type === "ocean_world" ? "#4682B4" :
                              moon.type === "frozen_world" ? "#B0E0E6" :
                              "#8B7355"
            }}
          />
          <span className="text-sm text-gray-300">
            {moon.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
        </div>
      </div>
    </div>
  );
};
