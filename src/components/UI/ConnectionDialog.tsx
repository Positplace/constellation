import React, { useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useMultiplayerStore } from "../../store/multiplayerStore";

const ConnectionDialog: React.FC = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { joinRoom } = useSocket();
  const {
    isConnected,
    showConnectionDialog,
    setPlayerName: setStorePlayerName,
    setCurrentRoom,
    setShowConnectionDialog,
  } = useMultiplayerStore();

  const handleConnect = async () => {
    if (!playerName.trim()) return;

    setIsConnecting(true);
    setStorePlayerName(playerName);
    setCurrentRoom(roomId || "default");

    joinRoom(roomId || "default", playerName);

    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && playerName.trim() && !isConnecting) {
      handleConnect();
    }
  };

  // Hide the dialog if we're connected or not showing
  if (isConnected || !showConnectionDialog) return null;

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
              Room ID (optional)
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Leave empty for default room"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-space-400"
            />
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={!playerName.trim() || isConnecting}
          className="w-full bg-space-600 hover:bg-space-700 disabled:bg-white/10 disabled:text-white/50 text-white py-3 px-4 rounded-md transition-colors font-medium"
        >
          {isConnecting ? "Connecting..." : "Join Game"}
        </button>
      </div>
    </div>
  );
};

export default ConnectionDialog;
