import React from "react";
import { PlanetData } from "../../types/planet.types";

interface PlanetDetailsCardProps {
  planet: PlanetData;
  onClose?: () => void;
  selectedMoonId?: string | null;
  onMoonSelect?: (moonId: string) => void;
  onCycleMoons?: () => void;
}

export const PlanetDetailsCard: React.FC<PlanetDetailsCardProps> = ({
  planet,
  onClose,
  selectedMoonId,
  onMoonSelect,
}) => {
  return (
    <div
      className="fixed bottom-4 left-4 z-[60] bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 w-96 max-h-[70vh] text-white shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      style={{ pointerEvents: "auto" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-blue-300">{planet.name}</h2>
          <p className="text-sm text-gray-400 capitalize">
            {planet.type.replace(/_/g, " ")}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Physical Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Physical Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Radius:</div>
          <div>{planet.radius.toLocaleString()} km</div>

          <div className="text-gray-400">Mass:</div>
          <div>{planet.mass.toFixed(2)} M⊕</div>

          <div className="text-gray-400">Gravity:</div>
          <div>{planet.gravity.toFixed(2)} g</div>

          <div className="text-gray-400">Rotation:</div>
          <div>{planet.rotationSpeed.toFixed(1)} hours</div>

          <div className="text-gray-400">Axial Tilt:</div>
          <div>{planet.axialTilt.toFixed(1)}°</div>
        </div>
      </div>

      {/* Orbital Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Orbital Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Distance:</div>
          <div>{planet.orbitalDistance.toFixed(2)} AU</div>

          <div className="text-gray-400">Zone:</div>
          <div className="capitalize">
            <span
              className={
                planet.orbitalZone === "inferno"
                  ? "text-red-400"
                  : planet.orbitalZone === "hot"
                  ? "text-orange-400"
                  : planet.orbitalZone === "goldilocks"
                  ? "text-green-400"
                  : planet.orbitalZone === "cold"
                  ? "text-blue-300"
                  : planet.orbitalZone === "outer"
                  ? "text-blue-400"
                  : "text-purple-300"
              }
            >
              {planet.orbitalZone.replace("_", " ")}
            </span>
          </div>

          <div className="text-gray-400">Speed:</div>
          <div>{planet.orbitalSpeed.toFixed(1)} km/s</div>

          <div className="text-gray-400">Eccentricity:</div>
          <div>{planet.orbitalEccentricity.toFixed(3)}</div>

          <div className="text-gray-400">Inclination:</div>
          <div>{planet.orbitalInclination.toFixed(1)}°</div>
        </div>
      </div>

      {/* Spin Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Rotation Details
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Spin Speed:</div>
          <div>{planet.spinSpeed.toFixed(2)} rad/s</div>

          <div className="text-gray-400">Direction:</div>
          <div>{planet.spinDirection === 1 ? "Prograde" : "Retrograde"}</div>

          <div className="text-gray-400">Spin Axis:</div>
          <div className="font-mono text-xs">
            [{planet.spinAxis[0].toFixed(2)}, {planet.spinAxis[1].toFixed(2)},{" "}
            {planet.spinAxis[2].toFixed(2)}]
          </div>
        </div>
      </div>

      {/* Atmosphere */}
      {planet.atmosphere.present && (
        <div className="space-y-2 mb-3">
          <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
            Atmosphere
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-gray-400">Pressure:</div>
            <div>{planet.atmosphere.pressure.toFixed(2)} atm</div>

            <div className="text-gray-400">Height:</div>
            <div>{planet.atmosphere.height.toFixed(0)} km</div>

            <div className="text-gray-400">Composition:</div>
            <div className="col-span-2 text-xs space-y-0.5 ml-4">
              {Object.entries(planet.atmosphere.composition).map(
                ([gas, percent]) =>
                  percent > 0 && (
                    <div key={gas} className="flex justify-between">
                      <span className="text-gray-400 capitalize">
                        {gas.replace(/([A-Z])/g, " $1")}:
                      </span>
                      <span>{(percent * 100).toFixed(1)}%</span>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Moons and Rings */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Satellites
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Moons:</div>
          <div>{planet.moons?.length || 0}</div>

          <div className="text-gray-400">Rings:</div>
          <div className={planet.rings ? "text-green-400" : "text-gray-500"}>
            {planet.rings ? "Yes" : "No"}
          </div>
        </div>

        {/* Moon list */}
        {planet.moons && planet.moons.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">
              Moon Names ({planet.moons.length}):
            </div>
            <div className="text-xs space-y-0.5 max-h-20 overflow-y-auto">
              {planet.moons.map((moon, index) => (
                <div
                  key={moon.id}
                  className={`flex justify-between items-center p-1 rounded cursor-pointer transition-colors ${
                    selectedMoonId === moon.id
                      ? "bg-green-500/20 border border-green-500/50"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => onMoonSelect?.(moon.id)}
                >
                  <span className="text-gray-300">{moon.name}</span>
                  <span className="text-gray-500 text-xs">
                    {moon.material} • {(moon.size / 1000).toFixed(0)}km
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Click on a moon to select and focus on it
            </div>
          </div>
        )}

        {/* Ring details */}
        {planet.rings && (
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Ring Details:</div>
            <div className="text-xs space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Inner Radius:</span>
                <span className="text-gray-300">
                  {(planet.rings.innerRadius * 1000).toFixed(0)}km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Outer Radius:</span>
                <span className="text-gray-300">
                  {(planet.rings.outerRadius * 1000).toFixed(0)}km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pattern:</span>
                <span className="text-gray-300 capitalize">
                  {planet.rings.texturePattern}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Surface */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Surface
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Continents:</div>
          <div>{planet.surface.continents.length}</div>

          <div className="text-gray-400">Cities:</div>
          <div>{planet.surface.cities.length}</div>

          <div className="text-gray-400">Elevation:</div>
          <div>
            {planet.surface.elevation.minHeight.toFixed(0)}m to{" "}
            {planet.surface.elevation.maxHeight.toFixed(0)}m
          </div>

          <div className="text-gray-400">Roughness:</div>
          <div>{(planet.surface.elevation.roughness * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Technical ID */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-500 font-mono">ID: {planet.id}</div>
        <div className="text-xs text-gray-500 font-mono">
          Seed: {planet.seed}
        </div>
      </div>
    </div>
  );
};

export default PlanetDetailsCard;
