import React from "react";
import { AsteroidData } from "../../types/asteroid.types";

interface AsteroidDetailsCardProps {
  asteroid: AsteroidData;
  onClose?: () => void;
}

export const AsteroidDetailsCard: React.FC<AsteroidDetailsCardProps> = ({
  asteroid,
  onClose,
}) => {
  // Get material color for visual representation
  const getMaterialColor = (material: string): string => {
    switch (material) {
      case "silicate":
        return "#8B7355";
      case "iron":
        return "#4A4A4A";
      case "nickel":
        return "#6B6B6B";
      case "carbonaceous":
        return "#2C2C2C";
      case "ice":
        return "#E6F3FF";
      case "platinum":
        return "#E5E4E2";
      case "gold":
        return "#FFD700";
      case "rare_earth":
        return "#C0C0C0";
      default:
        return "#8B7355";
    }
  };

  // Seeded random for consistent value calculations
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const materialColor = getMaterialColor(asteroid.material);

  // Calculate consistent estimated value based on asteroid seed
  const estimatedValue =
    asteroid.resources.rareMetals.length > 0
      ? Math.floor(
          asteroid.resources.rareMetals.length * 1000 +
            seededRandom(asteroid.seed + 999) * 5000
        )
      : Math.floor(seededRandom(asteroid.seed + 888) * 500);

  return (
    <div className="fixed bottom-4 left-4 z-[60] bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 w-96 max-h-[70vh] text-white shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pointer-events-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-blue-300">{asteroid.name}</h2>
          <p className="text-sm text-gray-400 capitalize">
            {asteroid.material.replace(/_/g, " ")} Asteroid
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

      {/* Material Visual */}
      <div className="flex items-center gap-3 mb-3 p-2 bg-white/5 rounded">
        <div
          className="w-6 h-6 rounded-full border border-white/20"
          style={{ backgroundColor: materialColor }}
        />
        <div>
          <div className="text-sm font-medium">
            {asteroid.material.replace(/_/g, " ").toUpperCase()}
          </div>
          <div className="text-xs text-gray-400">
            {asteroid.resources.abundance.toFixed(1)}% abundance
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Physical Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Radius:</div>
          <div>{(asteroid.size * 6371).toFixed(2)} km</div>

          <div className="text-gray-400">Volume:</div>
          <div>
            {(
              ((4 / 3) * Math.PI * Math.pow(asteroid.size * 6371, 3)) /
              1e12
            ).toFixed(3)}{" "}
            km³
          </div>

          <div className="text-gray-400">Rotation Speed:</div>
          <div>{asteroid.rotation.speed.toFixed(2)} rad/s</div>

          <div className="text-gray-400">Rotation Direction:</div>
          <div>
            {asteroid.rotation.direction === 1 ? "Prograde" : "Retrograde"}
          </div>
        </div>
      </div>

      {/* Orbital Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Orbital Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Distance:</div>
          <div>{asteroid.orbital.distance.toFixed(2)} AU</div>

          <div className="text-gray-400">Speed:</div>
          <div>{asteroid.orbital.speed.toFixed(3)} km/s</div>

          <div className="text-gray-400">Eccentricity:</div>
          <div>{asteroid.orbital.eccentricity.toFixed(3)}</div>

          <div className="text-gray-400">Current Angle:</div>
          <div>{((asteroid.orbital.angle * 180) / Math.PI).toFixed(1)}°</div>
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-blue-200 border-b border-white/10 pb-1">
          Resource Composition
        </h3>
        <div className="text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Primary Material:</span>
            <span className="font-medium capitalize">
              {asteroid.resources.material.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Abundance:</span>
            <span>{asteroid.resources.abundance.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Rare Metals */}
      {asteroid.resources.rareMetals.length > 0 && (
        <div className="space-y-2 mb-3">
          <h3 className="text-sm font-semibold text-yellow-300 border-b border-yellow-300/20 pb-1">
            Rare Metals Detected
          </h3>
          <div className="space-y-1">
            {asteroid.resources.rareMetals.map((metal, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"
              >
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="text-sm font-medium text-yellow-300">
                  {metal}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-yellow-400/80 mt-2">
            High-value materials for mining operations
          </div>
        </div>
      )}

      {/* Mining Potential */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-green-200 border-b border-green-200/20 pb-1">
          Mining Potential
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Difficulty:</div>
          <div className="text-green-300">
            {asteroid.size < 0.005
              ? "Easy"
              : asteroid.size < 0.01
              ? "Medium"
              : "Hard"}
          </div>

          <div className="text-gray-400">Estimated Value:</div>
          <div className="text-green-300">
            {estimatedValue.toLocaleString()} credits
          </div>
        </div>
      </div>

      {/* Technical ID */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-500 font-mono">ID: {asteroid.id}</div>
        <div className="text-xs text-gray-500 font-mono">
          Seed: {asteroid.seed}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Shape Seed: {asteroid.shapeSeed}
        </div>
      </div>
    </div>
  );
};

export default AsteroidDetailsCard;
