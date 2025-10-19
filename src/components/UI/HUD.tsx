import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import { generateSolarSystem } from "../../utils/systemFactory";
import PlanetDetailsCard from "./PlanetDetailsCard";
import AsteroidDetailsCard from "./AsteroidDetailsCard";

const HUD: React.FC = () => {
  const {
    isPlaying,
    gameTime,
    togglePlayPause,
    activeView,
    solarSystems,
    currentSystemId,
    selectedPlanetId,
    selectedAsteroidId,
    setSelectedPlanet,
    setSelectedAsteroid,
  } = useGameStore();
  const { players, isConnected, currentRoom } = useMultiplayerStore();
  const { togglePlayPauseSocket, emitPlanetSelected } = useSocket();

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);

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
                  // Ask SolarSystemView to reset view to center on sun
                  window.dispatchEvent(new CustomEvent("resetSolarView"));
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
                    <button
                      key={`planet-${planet.id}`}
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
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                      <span className="truncate max-w-[160px]">
                        {planet.name}
                      </span>
                    </button>
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
          onClose={() => {
            setSelectedPlanet(null);
            if (isConnected) {
              emitPlanetSelected(null);
            }
          }}
        />
      )}

      {/* Asteroid Details Card - Bottom Left (when asteroid selected) */}
      {selectedAsteroid && (
        <AsteroidDetailsCard
          asteroid={selectedAsteroid}
          onClose={() => {
            setSelectedAsteroid(null);
            // TODO: Add asteroid deselection socket event
          }}
        />
      )}
    </>
  );
};

export default HUD;
