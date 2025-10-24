import React, { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import PlanetDetailsCard from "./PlanetDetailsCard";
import AsteroidDetailsCard from "./AsteroidDetailsCard";
import { MoonDetailsCard } from "./MoonDetailsCard";
import { SpaceshipDetailsCard } from "./SpaceshipDetailsCard";
import CometDetailsCard from "./CometDetailsCard";
import { ObjectType } from "../../types/spaceship.types";

const HUD: React.FC = () => {
  const {
    isPlaying,
    gameTime,
    togglePlayPause,
    activeView,
    solarSystems,
    currentSystemId,
    selectedObject,
    setSelectedObject,
    spaceships,
    launchShip,
    changeSpaceshipDestination,
  } = useGameStore();
  const { players, isConnected, currentGalaxy } = useMultiplayerStore();
  const { togglePlayPauseSocket } = useSocket();

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);

  // Launch dialog state
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [launchOrigin, setLaunchOrigin] = useState<{
    id: string;
    type: ObjectType;
    name: string;
  } | null>(null);
  const [dialogMode, setDialogMode] = useState<"launch" | "changeDestination">(
    "launch"
  );
  const [spaceshipToChange, setSpaceshipToChange] = useState<string | null>(
    null
  );

  // Launch dialog functions
  const handleLaunchShip = (destination: {
    id: string;
    type: ObjectType;
    name: string;
  }) => {
    if (dialogMode === "launch" && launchOrigin) {
      launchShip(
        launchOrigin.id,
        launchOrigin.type,
        destination.id,
        destination.type
      );
    } else if (dialogMode === "changeDestination" && spaceshipToChange) {
      changeSpaceshipDestination(spaceshipToChange, {
        id: destination.id,
        type: destination.type,
      });
    }

    setShowLaunchDialog(false);
    setLaunchOrigin(null);
    setSpaceshipToChange(null);
    setDialogMode("launch");
  };

  const getAvailableDestinations = () => {
    if (!currentSystem) return [];

    const destinations: Array<{ id: string; type: ObjectType; name: string }> =
      [];

    // Add other planets
    currentSystem.planets
      .filter((p) => !launchOrigin || p.id !== launchOrigin.id)
      .forEach((p) => {
        destinations.push({
          id: p.id,
          type: "planet",
          name: p.name,
        });
      });

    // Add moons
    currentSystem.planets.forEach((planet) => {
      if (planet.moons) {
        planet.moons.forEach((moon) => {
          destinations.push({
            id: moon.id,
            type: "moon",
            name: `${moon.name} (${planet.name})`,
          });
        });
      }
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

  // Function to trigger launch dialog
  const triggerLaunchDialog = (origin: {
    id: string;
    type: ObjectType;
    name: string;
  }) => {
    setLaunchOrigin(origin);
    setDialogMode("launch");
    setShowLaunchDialog(true);
  };

  // Function to trigger destination change dialog
  const triggerDestinationChangeDialog = (spaceshipId: string) => {
    setSpaceshipToChange(spaceshipId);
    setDialogMode("changeDestination");
    setShowLaunchDialog(true);
  };

  // Extract selected IDs for easier access
  const selectedPlanetId =
    selectedObject?.type === "planet" ? selectedObject.id : null;
  const selectedAsteroidId =
    selectedObject?.type === "asteroid" ? selectedObject.id : null;
  const selectedMoonId =
    selectedObject?.type === "moon" ? selectedObject.id : null;
  const selectedCometId =
    selectedObject?.type === "comet" ? selectedObject.id : null;

  // Create a combined sorted list of planets and asteroid belts by orbital distance
  type SystemObject =
    | { type: "planet"; data: any; orbitalDistance: number }
    | { type: "asteroidBelt"; data: any; orbitalDistance: number };

  const sortedSystemObjects: SystemObject[] = [];

  if (currentSystem) {
    // Add planets
    currentSystem.planets.forEach((planet) => {
      sortedSystemObjects.push({
        type: "planet",
        data: planet,
        orbitalDistance: planet.orbitalDistance || 0,
      });
    });

    // Add asteroid belts (use the middle of the belt as orbital distance)
    currentSystem.asteroidBelts?.forEach((belt) => {
      const middleDistance = (belt.innerRadius + belt.outerRadius) / 2;
      sortedSystemObjects.push({
        type: "asteroidBelt",
        data: belt,
        orbitalDistance: middleDistance,
      });
    });

    // Sort all objects by orbital distance
    sortedSystemObjects.sort((a, b) => a.orbitalDistance - b.orbitalDistance);
  }

  // Find selected planet
  const selectedPlanet = selectedPlanetId
    ? currentSystem?.planets.find((p) => p.id === selectedPlanetId)
    : null;

  // Find selected asteroid
  const selectedAsteroid = selectedAsteroidId
    ? currentSystem?.asteroidBelts
        ?.flatMap((belt) => belt.asteroids)
        .find((a) => a.id === selectedAsteroidId)
    : null;

  // Find selected comet
  const selectedComet = selectedCometId
    ? currentSystem?.comets?.find((c) => c.id === selectedCometId)
    : null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    togglePlayPause();
    if (isConnected) {
      togglePlayPauseSocket();
    }
  };

  return (
    <>
      {/* Bottom Right - System Outline */}
      {activeView === "solar" && currentSystem && (
        <div className="fixed bottom-4 right-4 z-[60] pointer-events-auto">
          <div className="bg-black/90 border-2 border-cyan-500 rounded px-3 py-2 text-xs text-white shadow-2xl max-h-[40vh] overflow-y-auto min-w-[200px] max-w-[250px]">
            <div className="space-y-0.5">
              {/* Sun */}
              <button
                className="flex items-center gap-2 w-full text-left hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  // Select the sun to show orbital paths and reset view
                  setSelectedObject({
                    id: currentSystem.star.id,
                    type: "sun",
                  });
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                <span className="truncate max-w-[160px]">
                  {currentSystem.star.name}
                </span>
              </button>
              <div className="h-px bg-white/10 my-1" />

              {/* Planets and Asteroid Belts sorted by orbital distance */}
              {sortedSystemObjects.map((obj) => {
                if (obj.type === "planet") {
                  const planet = obj.data;
                  return (
                    <div key={`planet-${planet.id}`}>
                      <button
                        className="flex items-center gap-2 w-full text-left hover:text-white transition-colors cursor-pointer"
                        onClick={() => {
                          // Ask SolarSystemView to focus this planet
                          window.dispatchEvent(
                            new CustomEvent("focusPlanet", {
                              detail: { planetId: planet.id },
                            })
                          );
                        }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            // Planets with life (cities) show as bright green
                            planet.surface?.cities?.length > 0
                              ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]"
                              : planet.type === "gas_giant"
                              ? "bg-orange-400"
                              : planet.type === "ice_giant"
                              ? "bg-blue-400"
                              : planet.type === "earth_like"
                              ? "bg-green-300"
                              : planet.type === "ocean_world"
                              ? "bg-cyan-400"
                              : planet.type === "desert_world"
                              ? "bg-yellow-400"
                              : planet.type === "ice_world"
                              ? "bg-blue-200"
                              : planet.type === "lava_world"
                              ? "bg-red-400"
                              : planet.type === "dwarf_planet"
                              ? "bg-gray-400"
                              : "bg-white/70"
                          }`}
                        />
                        <span className="truncate max-w-[160px]">
                          {planet.name} -{" "}
                          {planet.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </button>

                      {/* Moons display */}
                      {planet.moons && planet.moons.length > 0 && (
                        <div className="ml-4 mt-1">
                          <button
                            className="text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                            onClick={() => {
                              // Cycle through moons or focus on single moon
                              if (planet.moons.length === 1) {
                                // Single moon - go directly to it
                                window.dispatchEvent(
                                  new CustomEvent("focusMoon", {
                                    detail: { moonId: planet.moons[0].id },
                                  })
                                );
                              } else {
                                // Multiple moons - cycle through them
                                window.dispatchEvent(
                                  new CustomEvent("cycleMoons", {
                                    detail: { planetId: planet.id },
                                  })
                                );
                              }
                            }}
                          >
                            -{" "}
                            {planet.moons.length === 1
                              ? "Moon"
                              : `Moons (${planet.moons.length})`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Asteroid belt
                  const belt = obj.data;
                  return (
                    <button
                      key={`belt-${belt.id}`}
                      className="flex items-center gap-2 w-full text-left hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        // Ask SolarSystemView to focus a random asteroid from this belt
                        window.dispatchEvent(
                          new CustomEvent("focusAsteroidBelt", {
                            detail: { beltId: belt.id },
                          })
                        );
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                      <span className="truncate max-w-[160px]">
                        {belt.name} ({belt.asteroids.length})
                      </span>
                    </button>
                  );
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Right - Game Controls */}
      <div className="absolute top-4 right-4 z-50 pointer-events-auto">
        <div className="glass-panel p-4 space-y-3">
          <div className="text-sm text-white/70">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePlayPause}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isPlaying
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isPlaying ? "⏸️ Pause" : "▶️ Play"}
              </button>
              <div className="font-mono text-white">{formatTime(gameTime)}</div>
            </div>

            <div>Players: {players.length}</div>
            {currentGalaxy && (
              <div className="text-xs">
                Galaxy: <span className="font-mono">{currentGalaxy}</span>
              </div>
            )}
            <div
              className={`text-xs ${
                isConnected ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </div>
          </div>
        </div>
      </div>

      {/* Planet Details Card - Bottom Left */}
      {selectedPlanet && (
        <PlanetDetailsCard
          planet={selectedPlanet}
          selectedMoonId={selectedMoonId}
          onMoonSelect={(moonId) => {
            setSelectedObject({ id: moonId, type: "moon" });
            // Emit moon selection to server if connected
            if (isConnected) {
              // TODO: Add moon selection socket event
            }
          }}
          onLaunchShip={triggerLaunchDialog}
          onClose={() => {
            // Clear selection to close the details card
            setSelectedObject(null);
          }}
        />
      )}

      {/* Asteroid Details Card - Bottom Left (when asteroid selected) */}
      {selectedAsteroid && (
        <AsteroidDetailsCard
          asteroid={selectedAsteroid}
          onClose={() => {
            setSelectedObject(null);
            // TODO: Add asteroid deselection socket event
          }}
        />
      )}

      {/* Moon Details Card - Bottom Left (when moon selected) */}
      {selectedMoonId &&
        currentSystem &&
        (() => {
          // Find the selected moon and its parent planet
          let selectedMoon = null;
          let parentPlanet = null;

          for (const planet of currentSystem.planets) {
            if (planet.moons) {
              const moon = planet.moons.find((m) => m.id === selectedMoonId);
              if (moon) {
                selectedMoon = moon;
                parentPlanet = planet;
                break;
              }
            }
          }

          return selectedMoon && parentPlanet ? (
            <MoonDetailsCard
              moon={selectedMoon}
              parentPlanetName={parentPlanet.name}
              onClose={() => {
                setSelectedObject(null);
                // TODO: Add moon deselection socket event
              }}
            />
          ) : null;
        })()}

      {/* Spaceship Details Card - Top Right (when spaceship selected) */}
      {selectedObject?.type === "spaceship" &&
        (() => {
          const selectedSpaceship = spaceships.find(
            (s) => s.id === selectedObject.id
          );
          return selectedSpaceship ? (
            <SpaceshipDetailsCard
              spaceship={selectedSpaceship}
              onLaunchShip={(origin) => {
                if (origin.id.startsWith("spaceship-")) {
                  triggerDestinationChangeDialog(origin.id);
                } else {
                  triggerLaunchDialog(origin);
                }
              }}
              onClose={() => {
                setSelectedObject(null);
              }}
            />
          ) : null;
        })()}

      {/* Comet Details Card - Bottom Left (when comet selected) */}
      {selectedComet && (
        <CometDetailsCard
          comet={selectedComet}
          onClose={() => {
            setSelectedObject(null);
            // TODO: Add comet deselection socket event
          }}
        />
      )}

      {/* Launch Ship Dialog - Full Screen Modal */}
      {showLaunchDialog && (
        <LaunchShipDialog
          isOpen={showLaunchDialog}
          onClose={() => {
            setShowLaunchDialog(false);
            setLaunchOrigin(null);
            setSpaceshipToChange(null);
            setDialogMode("launch");
          }}
          originName={launchOrigin?.name || "Spaceship"}
          dialogMode={dialogMode}
          onLaunch={handleLaunchShip}
          availableDestinations={getAvailableDestinations()}
        />
      )}
    </>
  );
};

// Launch Ship Dialog Component
const LaunchShipDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  originName: string;
  dialogMode: "launch" | "changeDestination";
  onLaunch: (destination: {
    id: string;
    type: ObjectType;
    name: string;
  }) => void;
  availableDestinations: Array<{ id: string; type: ObjectType; name: string }>;
}> = ({
  isOpen,
  onClose,
  originName,
  dialogMode,
  onLaunch,
  availableDestinations,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<{
    id: string;
    type: ObjectType;
    name: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter destinations based on search term
  const filteredDestinations = availableDestinations.filter((dest) =>
    dest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
      <div
        className="bg-gray-900 border border-white/20 rounded-lg p-4 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            {dialogMode === "launch"
              ? `Launch Ship from ${originName}`
              : `Change Destination for ${originName}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Destinations List */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-3">
          {filteredDestinations.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No destinations found
            </div>
          ) : (
            filteredDestinations.map((destination, index) => (
              <button
                key={`${destination.type}-${destination.id}-${index}`}
                onClick={() => setSelectedDestination(destination)}
                className={`w-full text-left p-2 rounded border transition-colors ${
                  selectedDestination?.id === destination.id
                    ? "bg-cyan-600 border-cyan-400 text-white"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <div className="font-medium text-sm">{destination.name}</div>
                <div className="text-xs text-gray-400 capitalize">
                  {destination.type}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedDestination) {
                onLaunch(selectedDestination);
              }
            }}
            disabled={!selectedDestination}
            className="flex-1 px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {dialogMode === "launch" ? "Launch Ship" : "Change Destination"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HUD;
