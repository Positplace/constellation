import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../store/gameStore";
import { useMultiplayerStore } from "../store/multiplayerStore";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { setActiveView, togglePlayPause, updateGameTime } = useGameStore();
  const {
    setConnected,
    setCurrentRoom,
    addPlayer,
    removePlayer,
    showConnectionDialog,
  } = useMultiplayerStore();

  useEffect(() => {
    // Always connect to server for multiplayer
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
      if (data.gameState) {
        // Sync full game state from server
        if (data.gameState.players) {
          data.gameState.players.forEach((player: any) => {
            addPlayer(player);
          });
        }
        if (
          data.gameState.solarSystems &&
          data.gameState.solarSystems.length > 0
        ) {
          // Update solar systems from server
          useGameStore.setState({
            solarSystems: data.gameState.solarSystems,
            tunnels: data.gameState.tunnels || [],
            currentSystemId:
              data.gameState.currentSystemId ||
              data.gameState.solarSystems[0]?.id,
          });
        }
      }
    });

    socket.on("player-joined", (data) => {
      console.log("Player joined:", data.player);
      addPlayer(data.player);
    });

    socket.on("player-left", (data) => {
      console.log("Player left:", data.playerId);
      removePlayer(data.playerId);
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

    socket.on("system-generated", (data) => {
      console.log("System generated:", data.system);
      // Add the system to the game state
      useGameStore.getState().addSolarSystem(data.system);
    });

    socket.on("current-system-changed", (data) => {
      console.log("Current system changed:", data.systemId);
      useGameStore.getState().setCurrentSystem(data.systemId);
    });

    socket.on("planet-selected", (data) => {
      console.log("Planet selected:", data.planetId);
      if (data.planetId) {
        useGameStore
          .getState()
          .setSelectedObject({ id: data.planetId, type: "planet" });
      } else {
        useGameStore.getState().setSelectedObject(null);
      }
    });

    socket.on("game-state-synced", (data) => {
      console.log("Game state synced from server");
      // Sync the entire game state
      useGameStore.setState(data.gameState);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [
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

  const changeView = (view: "solar" | "constellation") => {
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

  const emitSystemGenerated = (system: any, fromSystemId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("system-generated", { system, fromSystemId });
    }
  };

  const emitCurrentSystemChanged = (systemId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("current-system-changed", { systemId });
    }
  };

  const emitPlanetSelected = (planetId: string | null) => {
    if (socketRef.current) {
      socketRef.current.emit("planet-selected", { planetId });
    }
  };

  const syncGameState = (gameState: any) => {
    if (socketRef.current) {
      socketRef.current.emit("sync-game-state", { gameState });
    }
  };

  return {
    joinRoom,
    changeView,
    constructTunnel,
    nextTurn,
    togglePlayPauseSocket,
    updateGameTimeSocket,
    emitSystemGenerated,
    emitCurrentSystemChanged,
    emitPlanetSelected,
    syncGameState,
  };
};
