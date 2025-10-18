import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../store/gameStore";
import { useMultiplayerStore } from "../store/multiplayerStore";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    setSelectedCountry,
    updateCountry,
    setActiveView,
    togglePlayPause,
    updateGameTime,
  } = useGameStore();
  const { setConnected, setCurrentRoom, addPlayer, removePlayer } =
    useMultiplayerStore();

  useEffect(() => {
    // Connect to server
    socketRef.current = io("http://localhost:3001");

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    // Game events
    socket.on("room-joined", (data) => {
      console.log("Joined room:", data.roomId);
      setCurrentRoom(data.roomId);
      // Update game state with server data
    });

    socket.on("player-joined", (data) => {
      console.log("Player joined:", data.player);
      addPlayer(data.player);
    });

    socket.on("player-left", (data) => {
      console.log("Player left:", data.playerId);
      removePlayer(data.playerId);
    });

    socket.on("country-selected", (data) => {
      console.log("Country selected by player:", data.playerId, data.countryId);
      // Update UI to show other player's selection
    });

    socket.on("country-colonized", (data) => {
      console.log("Country colonized:", data.countryId, data.playerId);
      updateCountry(data.countryId, { controlledBy: data.playerId });
    });

    socket.on("view-changed", (data) => {
      console.log("View changed to:", data.view);
      setActiveView(data.view);
    });

    socket.on("tunnel-constructed", (data) => {
      console.log("Tunnel constructed:", data.tunnel);
      // Add tunnel to game state
    });

    socket.on("turn-progressed", (data) => {
      console.log("Turn progressed to:", data.turn);
      // Update turn counter
    });

    socket.on("play-state-changed", (data) => {
      console.log("Play state changed:", data.isPlaying);
      // Sync play state with server
    });

    socket.on("game-time-updated", (data) => {
      console.log("Game time updated:", data.gameTime);
      updateGameTime(data.gameTime);
    });

    return () => {
      socket.disconnect();
    };
  }, [
    setSelectedCountry,
    updateCountry,
    setActiveView,
    togglePlayPause,
    updateGameTime,
    setConnected,
    setCurrentRoom,
    addPlayer,
    removePlayer,
  ]);

  const joinRoom = (roomId: string, playerName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-room", { roomId, playerName });
    }
  };

  const selectCountry = (countryId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("select-country", { countryId });
    }
  };

  const colonizeCountry = (countryId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("colonize-country", { countryId });
    }
  };

  const changeView = (view: "earth" | "solar" | "constellation") => {
    if (socketRef.current) {
      socketRef.current.emit("change-view", { view });
    }
  };

  const constructTunnel = (from: string, to: string) => {
    if (socketRef.current) {
      socketRef.current.emit("construct-tunnel", { from, to });
    }
  };

  const nextTurn = () => {
    if (socketRef.current) {
      socketRef.current.emit("next-turn");
    }
  };

  const togglePlayPauseSocket = () => {
    if (socketRef.current) {
      socketRef.current.emit("toggle-play-pause");
    }
  };

  const updateGameTimeSocket = (gameTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit("update-game-time", { gameTime });
    }
  };

  return {
    joinRoom,
    selectCountry,
    colonizeCountry,
    changeView,
    constructTunnel,
    nextTurn,
    togglePlayPauseSocket,
    updateGameTimeSocket,
    isConnected: socketRef.current?.connected || false,
  };
};
