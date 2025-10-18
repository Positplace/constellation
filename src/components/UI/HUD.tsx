import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import { generateSolarSystem } from "../../utils/systemFactory";
import PlanetDetailsCard from "./PlanetDetailsCard";

const HUD: React.FC = () => {
  const {
    isPlaying,
    gameTime,
    togglePlayPause,
    activeView,
    solarSystems,
    currentSystemId,
    selectedPlanetId,
    setSelectedPlanet,
  } = useGameStore();
  const { players, isConnected, currentRoom } = useMultiplayerStore();
  const { togglePlayPauseSocket, emitPlanetSelected } = useSocket();

  const currentSystem = solarSystems.find((s) => s.id === currentSystemId);

  // Find selected planet
  const selectedPlanet = selectedPlanetId
    ? currentSystem?.planets.find((p) => p.id === selectedPlanetId)
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
    </>
  );
};

export default HUD;
