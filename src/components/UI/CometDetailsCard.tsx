import React from "react";
import { CometData } from "../../types/comet.types";

interface CometDetailsCardProps {
  comet: CometData;
  onClose?: () => void;
}

export const CometDetailsCard: React.FC<CometDetailsCardProps> = ({
  comet,
  onClose,
}) => {
  // Get comet type display name
  const getCometTypeDisplay = (type: string): string => {
    switch (type) {
      case "short_period":
        return "Short-Period Comet";
      case "long_period":
        return "Long-Period Comet";
      case "halley_type":
        return "Halley-Type Comet";
      default:
        return "Comet";
    }
  };

  // Get dominant composition color
  const getCompositionColor = (): string => {
    if (comet.composition.ice > 60) return "#e6f0ff";
    if (comet.composition.dust > 40) return "#ffd700";
    return "#8B7355";
  };

  // Calculate distance from star
  const currentDistance = Math.sqrt(
    comet.position[0] ** 2 + comet.position[1] ** 2 + comet.position[2] ** 2
  );

  // Determine activity level based on distance
  const getActivityLevel = (): string => {
    if (currentDistance < comet.orbital.perihelion * 1.5)
      return "Highly Active";
    if (currentDistance < comet.orbital.semiMajorAxis)
      return "Moderately Active";
    if (currentDistance < comet.orbital.aphelion * 0.7)
      return "Slightly Active";
    return "Dormant";
  };

  const activityColor =
    currentDistance < comet.orbital.perihelion * 1.5
      ? "text-orange-400"
      : currentDistance < comet.orbital.semiMajorAxis
      ? "text-yellow-400"
      : currentDistance < comet.orbital.aphelion * 0.7
      ? "text-blue-400"
      : "text-gray-400";

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 w-96 max-h-[70vh] text-white shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      style={{ pointerEvents: "auto" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-300">{comet.name}</h2>
          <p className="text-sm text-gray-400">
            {getCometTypeDisplay(comet.type)}
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

      {/* Activity Status */}
      <div className="mb-3 p-3 bg-white/5 rounded border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Activity Status:</span>
          <span className={`text-sm font-bold ${activityColor}`}>
            {getActivityLevel()}
          </span>
        </div>
        {comet.tail.intensity > 0.3 && (
          <div className="mt-2 text-xs text-cyan-300">
            ⭐ Visible tail detected!
          </div>
        )}
      </div>

      {/* Composition */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-cyan-200 border-b border-white/10 pb-1">
          Composition
        </h3>
        <div className="space-y-1">
          {/* Ice */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Ice (H₂O, CO₂, NH₃)</span>
              <span className="text-cyan-300">
                {comet.composition.ice.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-cyan-400 h-2 rounded-full"
                style={{ width: `${comet.composition.ice}%` }}
              />
            </div>
          </div>

          {/* Dust */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Dust & Organic Material</span>
              <span className="text-yellow-300">
                {comet.composition.dust.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${comet.composition.dust}%` }}
              />
            </div>
          </div>

          {/* Rock */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Rock & Minerals</span>
              <span className="text-orange-300">
                {comet.composition.rock.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${comet.composition.rock}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-cyan-200 border-b border-white/10 pb-1">
          Nucleus Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Nucleus Size:</div>
          <div>{comet.nucleusSize.toFixed(1)} km</div>

          <div className="text-gray-400">Rotation Speed:</div>
          <div>{comet.rotation.speed.toFixed(2)} rad/s</div>

          <div className="text-gray-400">Rotation Direction:</div>
          <div>
            {comet.rotation.direction === 1 ? "Prograde" : "Retrograde"}
          </div>
        </div>
      </div>

      {/* Orbital Properties */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-cyan-200 border-b border-white/10 pb-1">
          Orbital Properties
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-gray-400">Current Distance:</div>
          <div>{currentDistance.toFixed(2)} AU</div>

          <div className="text-gray-400">Perihelion (closest):</div>
          <div className="text-orange-300">
            {comet.orbital.perihelion.toFixed(2)} AU
          </div>

          <div className="text-gray-400">Aphelion (farthest):</div>
          <div className="text-blue-300">
            {comet.orbital.aphelion.toFixed(2)} AU
          </div>

          <div className="text-gray-400">Semi-Major Axis:</div>
          <div>{comet.orbital.semiMajorAxis.toFixed(2)} AU</div>

          <div className="text-gray-400">Eccentricity:</div>
          <div>{comet.orbital.eccentricity.toFixed(3)}</div>

          <div className="text-gray-400">Inclination:</div>
          <div>{((comet.orbital.inclination * 180) / Math.PI).toFixed(1)}°</div>

          <div className="text-gray-400">Orbital Period:</div>
          <div>{comet.orbital.period.toFixed(1)} years</div>

          <div className="text-gray-400">Current Speed:</div>
          <div>{(comet.orbital.speed * 1000).toFixed(1)} km/s</div>
        </div>
      </div>

      {/* Tail Properties */}
      {comet.tail.intensity > 0.05 && (
        <div className="space-y-2 mb-3">
          <h3 className="text-sm font-semibold text-cyan-300 border-b border-cyan-300/20 pb-1">
            Tail Characteristics
          </h3>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-cyan-300">
                Luminous Tail
              </span>
              <span className="text-xs text-cyan-400">
                {(comet.tail.intensity * 100).toFixed(0)}% active
              </span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Length: ~{(comet.tail.length * 100000).toFixed(0)} km</div>
              <div className="text-gray-400">
                Beautiful plume of gas and dust ionized by solar radiation, pointing away from the star
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scientific Notes */}
      <div className="space-y-2 mb-3">
        <h3 className="text-sm font-semibold text-purple-200 border-b border-purple-200/20 pb-1">
          Scientific Notes
        </h3>
        <div className="text-xs text-gray-300 space-y-1">
          {comet.type === "long_period" && (
            <p>
              • Long-period comets originate from the distant Oort cloud and
              take centuries to complete their orbits.
            </p>
          )}
          {comet.type === "short_period" && (
            <p>
              • Short-period comets typically orbit within the inner solar
              system, completing their paths in just a few years.
            </p>
          )}
          {comet.type === "halley_type" && (
            <p>
              • Halley-type comets have intermediate orbital periods, often
              displaying spectacular tails during perihelion passage.
            </p>
          )}
          {comet.composition.ice > 70 && (
            <p>
              • High ice content suggests this comet is relatively pristine,
              having experienced few solar approaches.
            </p>
          )}
          {currentDistance < comet.orbital.perihelion * 1.2 && (
            <p className="text-orange-400">
              • Currently near perihelion - maximum tail development and
              activity!
            </p>
          )}
        </div>
      </div>

      {/* Technical ID */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs text-gray-500 font-mono">ID: {comet.id}</div>
        <div className="text-xs text-gray-500 font-mono">
          Seed: {comet.seed}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Discovered: {comet.discovered ? "Yes" : "Awaiting Discovery"}
        </div>
      </div>
    </div>
  );
};

export default CometDetailsCard;
