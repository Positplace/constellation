import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import { generateSolarSystem } from "../../utils/systemFactory";
import PlanetDetailsCard from "./PlanetDetailsCard";
import AsteroidDetailsCard from "./AsteroidDetailsCard";
import { MoonDetailsCard } from "./MoonDetailsCard";

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
  } = useGameStore();
  const { players, isConnected, currentRoom } = useMultiplayerStore();
  const { togglePlayPauseSocket } = useSocket();

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);

  // Extract selected IDs for easier access
  const selectedPlanetId =
    selectedObject?.type === "planet" ? selectedObject.id : null;
  const selectedAsteroidId =
    selectedObject?.type === "asteroid" ? selectedObject.id : null;
  const selectedMoonId =
    selectedObject?.type === "moon" ? selectedObject.id : null;

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

  const handleRegenerateSystem = () => {
    if (!currentSystem) return;

    // Generate a new system with the same star type and position
    const newSeed = Date.now();
    const newSystem = generateSolarSystem(
      currentSystem.star.type,
      newSeed,
      currentSystem.position,
      currentSystem.name
    );

    // Preserve important metadata
    newSystem.id = currentSystem.id;
    newSystem.connections = currentSystem.connections;
    newSystem.colonized = currentSystem.colonized;
    newSystem.discovered = currentSystem.discovered;

    // Update the system in the store
    useGameStore.setState((state) => ({
      solarSystems: state.solarSystems.map((s) =>
        s.id === currentSystem.id ? newSystem : s
      ),
    }));

    // Save to localStorage
    useGameStore.getState().saveToLocalStorage();
  };

  return (
    <>
      {/* Bottom Right - System Outline */}
      {activeView === "solar" && currentSystem && (
        <div
          className="fixed bottom-4 right-4 z-[60]"
          style={{ pointerEvents: "auto" }}
        >
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
                            planet.type === "gas_giant"
                              ? "bg-orange-400"
                              : planet.type === "ice_giant"
                              ? "bg-blue-400"
                              : planet.type === "earth_like"
                              ? "bg-green-400"
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
      <div className="absolute top-4 right-4 z-50">
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

            {/* Regenerate System button - only show in solar view */}
            {activeView === "solar" && currentSystem && (
              <div className="mt-2">
                <button
                  onClick={handleRegenerateSystem}
                  className="w-full px-3 py-2 rounded text-sm font-medium transition-colors bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center justify-center gap-2"
                >
                  <span>🔄</span>
                  <span>Regenerate System</span>
                </button>
              </div>
            )}

            <div>Players: {players.length}</div>
            {currentRoom && (
              <div className="text-xs">
                Room: <span className="font-mono">{currentRoom}</span>
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
    </>
  );
};

export default HUD;
