import React, { useState } from "react";
import { SpaceshipData } from "../../types/spaceship.types";
import { useGameStore } from "../../store/gameStore";
import { SolarSystem } from "../../types/game.types";
import { ObjectType } from "../../types/spaceship.types";

interface SpaceshipDetailsCardProps {
  spaceship: SpaceshipData;
  onClose?: () => void;
  onLaunchShip?: (origin: {
    id: string;
    type: ObjectType;
    name: string;
  }) => void;
}

export const SpaceshipDetailsCard: React.FC<SpaceshipDetailsCardProps> = ({
  spaceship,
  onClose,
  onLaunchShip,
}) => {
  const {
    solarSystems,
    currentSystemId,
    launchShip,
    changeSpaceshipDestination,
  } = useGameStore();
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{
    id: string;
    type: ObjectType;
    name: string;
  } | null>(null);

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);

  // Helper function to get object name by ID and type
  const getObjectName = (id: string, type: ObjectType): string => {
    if (!currentSystem) return id;

    switch (type) {
      case "planet":
        const planet = currentSystem.planets.find((p) => p.id === id);
        return planet ? planet.name : id;
      case "moon":
        for (const planet of currentSystem.planets) {
          if (planet.moons) {
            const moon = planet.moons.find((m) => m.id === id);
            if (moon) return `${moon.name} (${planet.name})`;
          }
        }
        return id;
      case "asteroid":
        for (const belt of currentSystem.asteroidBelts || []) {
          const asteroid = belt.asteroids.find((a) => a.id === id);
          if (asteroid) return `${asteroid.name} (${belt.name})`;
        }
        return id;
      case "sun":
        return currentSystem.star.name;
      default:
        return id;
    }
  };

  const handleChangeDestination = (destination: {
    id: string;
    type: ObjectType;
    name: string;
  }) => {
    // Change the destination of the existing spaceship
    changeSpaceshipDestination(spaceship.id, {
      id: destination.id,
      type: destination.type,
    });
    setShowDestinationDialog(false);
    setSelectedDestination(null);
  };

  const getAvailableDestinations = () => {
    if (!currentSystem) return [];

    const destinations: Array<{ id: string; type: ObjectType; name: string }> =
      [];

    // Add planets
    currentSystem.planets.forEach((p) => {
      destinations.push({
        id: p.id,
        type: "planet",
        name: p.name,
      });
    });

    // Add moons
    currentSystem.planets
      .filter((p) => p.moons)
      .forEach((p) => {
        p.moons?.forEach((moon) => {
          destinations.push({
            id: moon.id,
            type: "moon",
            name: `${moon.name} (${p.name})`,
          });
        });
      });

    // Add asteroids
    currentSystem.asteroidBelts?.forEach((belt) => {
      belt.asteroids.forEach((asteroid) => {
        destinations.push({
          id: asteroid.id,
          type: "asteroid",
          name: `${asteroid.name} (${belt.name})`,
        });
      });
    });

    return destinations;
  };

  const getStatusInfo = () => {
    const { gameTime, isPlaying } = useGameStore();
    const now = Date.now();
    const stateElapsed = (now - spaceship.stateStartTime) / 1000;

    // For progress calculation, use different approaches based on state
    let progress = 0;
    let eta = null;

    switch (spaceship.state) {
      case "launching":
        progress = Math.min(stateElapsed / 2.0, 1);
        break;
      case "traveling": {
        // For traveling, calculate progress based on distance traveled
        // This is more accurate than time-based progress
        const totalDistance = spaceship.totalFlightTime || 10; // fallback to 10 seconds
        progress = Math.min(stateElapsed / totalDistance, 1);
        eta = "Calculating...";
        break;
      }
      case "orbiting":
        progress = Math.min(stateElapsed / 1.0, 1);
        break;
      case "landing":
        progress = Math.min(stateElapsed / 2.0, 1);
        break;
      case "waiting":
        progress = 1; // Always 100% when waiting
        break;
      default:
        progress = 0;
    }

    // If game is paused, don't update progress
    if (!isPlaying && spaceship.state !== "waiting") {
      progress = Math.max(0, progress - 0.1); // Slightly reduce to show it's paused
    }

    return {
      status:
        spaceship.state.charAt(0).toUpperCase() + spaceship.state.slice(1),
      description: getStatusDescription(spaceship.state),
      progress: Math.max(0, Math.min(1, progress)),
      eta,
    };
  };

  const getStatusDescription = (state: string) => {
    switch (state) {
      case "launching":
        return "Taking off from origin";
      case "traveling":
        return `En route to ${getObjectName(
          spaceship.destination.id,
          spaceship.destination.type
        )}`;
      case "orbiting":
        return `Orbiting ${getObjectName(
          spaceship.destination.id,
          spaceship.destination.type
        )}`;
      case "landing":
        return `Landing on ${getObjectName(
          spaceship.destination.id,
          spaceship.destination.type
        )}`;
      case "waiting":
        return `Waiting in orbit around ${getObjectName(
          spaceship.destination.id,
          spaceship.destination.type
        )}`;
      default:
        return "Status unknown";
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-black/90 border border-white/20 rounded-lg p-4 text-white shadow-2xl z-50 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-cyan-300">Spaceship Status</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Ship Info */}
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-400">Ship ID</div>
          <div className="font-mono text-sm">{spaceship.id}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Current Status</div>
          <div className="text-cyan-300 font-semibold">{statusInfo.status}</div>
          <div className="text-sm text-gray-300">{statusInfo.description}</div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Progress</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${statusInfo.progress * 100}%` }}
            />
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-400">Origin</div>
            <div className="text-sm">
              {getObjectName(spaceship.origin.id, spaceship.origin.type)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Destination</div>
            <div className="text-sm">
              {getObjectName(
                spaceship.destination.id,
                spaceship.destination.type
              )}
            </div>
          </div>
        </div>

        {/* ETA */}
        {statusInfo.eta && (
          <div>
            <div className="text-sm text-gray-400">ETA</div>
            <div className="text-sm text-yellow-300">{statusInfo.eta}</div>
          </div>
        )}

        {/* Change Destination Button */}
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={() => {
              if (onLaunchShip) {
                onLaunchShip({
                  id: spaceship.id,
                  type: "spaceship",
                  name: `Spaceship ${spaceship.id.slice(-6)}`,
                });
              } else {
                setShowDestinationDialog(true);
              }
            }}
            className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded text-sm font-medium transition-colors"
          >
            Change Destination
          </button>
        </div>
      </div>

      {/* Change Destination Dialog */}
      {showDestinationDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]">
          <div
            className="bg-black/90 border border-white/20 rounded-lg p-6 w-96 max-h-[80vh] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-300">
                Change Destination
              </h3>
              <button
                onClick={() => setShowDestinationDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-3">
                Select a new destination for this spaceship:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {getAvailableDestinations().map((dest, index) => (
                  <button
                    key={`${dest.type}-${dest.id}-${index}`}
                    onClick={() => setSelectedDestination(dest)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedDestination?.id === dest.id
                        ? "bg-blue-500/30 border border-blue-500/50"
                        : "hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">
                        {dest.type}:
                      </span>
                      <span>{dest.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDestinationDialog(false)}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  selectedDestination &&
                  handleChangeDestination(selectedDestination)
                }
                disabled={!selectedDestination}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Change Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceshipDetailsCard;
