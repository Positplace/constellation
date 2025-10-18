import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import { useSocket } from "../../hooks/useSocket";
import PlanetLayerControls from "../Globe/PlanetLayerControls";

const HUD: React.FC = () => {
  const {
    isPlaying,
    gameTime,
    selectedCountry,
    togglePlayPause,
    layers,
    toggleLayer,
  } = useGameStore();
  const { players, isConnected } = useMultiplayerStore();
  const { togglePlayPauseSocket } = useSocket();

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

  const handleToggleLayer = (layer: keyof typeof layers) => {
    toggleLayer(layer);
  };

  return (
    <>
      {/* Top Right - Game Controls */}
      <div className="absolute top-4 right-4 z-10">
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
            <div
              className={`text-xs ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          {selectedCountry && (
            <div className="border-t border-white/20 pt-3">
              <div className="text-xs text-white/70">Selected:</div>
              <div className="text-sm font-medium text-white">
                {selectedCountry.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right - Planet Layer Controls */}
      <div className="absolute bottom-4 right-4 z-10" style={{ backgroundColor: 'rgba(0,255,0,0.3)' }}>
        <PlanetLayerControls
          onToggleContinents={(enabled) => handleToggleLayer("continents")}
          onToggleCities={(enabled) => handleToggleLayer("cities")}
          onToggleAtmosphere={(enabled) => handleToggleLayer("atmosphere")}
          onToggleClouds={(enabled) => handleToggleLayer("clouds")}
        />
      </div>
    </>
  );
};

export default HUD;
