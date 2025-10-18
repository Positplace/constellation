import React from "react";
import { useGameStore } from "../../store/gameStore";
import { useMultiplayerStore } from "../../store/multiplayerStore";

const HUD: React.FC = () => {
  const { currentTurn, selectedCountry } = useGameStore();
  const { players, isConnected } = useMultiplayerStore();

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="glass-panel p-4 space-y-3">
        <div className="text-sm text-white/70">
          <div className="font-semibold text-white">Turn {currentTurn}</div>
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
  );
};

export default HUD;
