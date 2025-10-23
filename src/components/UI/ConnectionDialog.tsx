import React, { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";
import {
  getPlayerUUID,
  getStoredPlayerName,
  storePlayerName,
} from "../../utils/playerIdentity";

const ConnectionDialog: React.FC = () => {
  const [playerName, setPlayerName] = useState("");
  const [galaxyId, setGalaxyId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [playerUUID] = useState(getPlayerUUID()); // Get or generate UUID on mount

  const { joinGalaxy } = useSocket();

  // Load stored player name on mount
  useEffect(() => {
    const storedName = getStoredPlayerName();
    if (storedName) {
      setPlayerName(storedName);
      console.log(`👤 Loaded stored player name: ${storedName}`);
    }
  }, []);
  const {
    currentGalaxy,
    showConnectionDialog,
    setPlayerName: setStorePlayerName,
    setShowConnectionDialog,
  } = useMultiplayerStore();

  const handleConnect = async () => {
    if (!playerName.trim()) return;

    setIsConnecting(true);
    setStorePlayerName(playerName);
    storePlayerName(playerName); // Save name to localStorage

    // Send join request to server with UUID
    console.log(`🚀 Joining galaxy with UUID: ${playerUUID}`);
    joinGalaxy(galaxyId || "default", playerName, playerUUID);

    // Wait a bit then stop the loading state
    // The dialog will close automatically when currentGalaxy is set by the server
    setTimeout(() => {
      setIsConnecting(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && playerName.trim() && !isConnecting) {
      handleConnect();
    }
  };

  // Hide the dialog if we've joined a galaxy or dialog is manually hidden
  if (currentGalaxy || !showConnectionDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
      <div
        className="glass-panel p-8 w-96 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Constellation</h1>
          <p className="text-white/70">Join multiplayer game</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-space-400"
              maxLength={20}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Galaxy ID (optional)
            </label>
            <input
              type="text"
              value={galaxyId}
              onChange={(e) => setGalaxyId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Leave empty for default galaxy"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-space-400"
            />
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={!playerName.trim() || isConnecting}
          className="w-full bg-space-600 hover:bg-space-700 disabled:bg-white/10 disabled:text-white/50 text-white py-3 px-4 rounded-md transition-colors font-medium"
        >
          {isConnecting ? "Joining Galaxy..." : "Join Game"}
        </button>
      </div>
    </div>
  );
};

export default ConnectionDialog;
