import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "../store/gameStore";
import { useMultiplayerStore } from "../store/multiplayerStore";

// Global socket instance - shared across all hook calls
let globalSocket: Socket | null = null;
let listenersRegistered = false;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { setActiveView, togglePlayPause, updateGameTime } = useGameStore();
  const {
    setConnected,
    setCurrentGalaxy,
    addPlayer,
    removePlayer,
    showConnectionDialog,
  } = useMultiplayerStore();

  useEffect(() => {
    // Use existing global socket if available, otherwise create new one
    if (!globalSocket) {
      console.log("🔌 Creating new socket connection");
      globalSocket = io("http://localhost:3001");
    }

    socketRef.current = globalSocket;
    const socket = socketRef.current;

    // Only register event listeners once
    if (!listenersRegistered) {
      listenersRegistered = true;

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
      socket.on("galaxy-joined", (data) => {
        const startTime = performance.now();
        console.log("🌌 Joined galaxy:", data.galaxyId);
        console.log("🎮 Game state received:", data.gameState);
        console.log("👥 Players in galaxy:", data.gameState?.players);
        console.log("🏠 Player home system:", data.playerHomeSystemId);

        setCurrentGalaxy(data.galaxyId);
        // Close the connection dialog immediately
        useMultiplayerStore.getState().setShowConnectionDialog(false);

        console.log(
          `⏱️  Galaxy data received in ${(
            performance.now() - startTime
          ).toFixed(2)}ms`
        );

        // Store player's home system and planet IDs
        if (data.playerHomeSystemId) {
          useMultiplayerStore
            .getState()
            .setPlayerHomeSystemId(data.playerHomeSystemId);

          // Find the home planet ID from the home system
          const homeSystem = data.gameState?.solarSystems?.find(
            (s: any) => s.id === data.playerHomeSystemId
          );
          if (homeSystem) {
            const homePlanet = homeSystem.planets?.find(
              (p: any) => p.hasLife || p.type === "earth_like"
            );
            if (homePlanet) {
              useMultiplayerStore
                .getState()
                .setPlayerHomePlanetId(homePlanet.id);
              console.log("🏠 Home planet:", homePlanet.name, homePlanet.id);
            }
          }
        }

        // Update game state with server data
        if (data.gameState) {
          // Sync full game state from server
          if (data.gameState.players) {
            // Clear existing players first, then add all players from server
            useMultiplayerStore.setState({ players: [] });
            data.gameState.players.forEach((player: any) => {
              console.log("➕ Adding player:", player);
              addPlayer(player);
            });
          }
          if (
            data.gameState.solarSystems &&
            data.gameState.solarSystems.length > 0
          ) {
            // Update solar systems from server
            // Use player's home system as starting point
            const startingSystemId =
              data.playerHomeSystemId ||
              data.gameState.currentSystemId ||
              data.gameState.solarSystems[0]?.id;

            console.log("🎯 Starting in system:", startingSystemId);

            useGameStore.setState({
              solarSystems: data.gameState.solarSystems,
              tunnels: data.gameState.tunnels || [],
              currentSystemId: startingSystemId,
            });
          }
        }
      });

      socket.on("additional-systems-loaded", (data) => {
        console.log(
          `📦 Received ${data.solarSystems.length} additional systems`
        );

        // Merge additional systems into existing game state
        const currentState = useGameStore.getState();
        const existingSystemIds = new Set(
          currentState.solarSystems.map((s) => s.id)
        );

        // Only add systems that don't already exist
        const newSystems = data.solarSystems.filter(
          (s: any) => !existingSystemIds.has(s.id)
        );

        if (newSystems.length > 0) {
          useGameStore.setState({
            solarSystems: [...currentState.solarSystems, ...newSystems],
            tunnels: [...currentState.tunnels, ...(data.tunnels || [])],
          });
          console.log(
            `✅ Added ${newSystems.length} systems to game state (total: ${
              currentState.solarSystems.length + newSystems.length
            })`
          );
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

      socket.on("play-state-changed", (data) => {
        console.log("Play state changed:", data.isPlaying);
        // Sync play state with server
      });

      socket.on("game-time-updated", (data) => {
        console.log("Game time updated:", data.gameTime);
        updateGameTime(data.gameTime);
      });

      socket.on(
        "system-generated",
        (data: { system: any; tunnel?: any; updatedSourceSystem?: any }) => {
          console.log("📡 System generated:", data.system.name);
          console.log(
            `   New system connections: [${data.system.connections.join(", ")}]`
          );

          // Get current state
          let state = useGameStore.getState();

          // Check if system already exists (when connecting to existing system)
          const systemExists = state.solarSystems.some(
            (s) => s.id === data.system.id
          );

          if (!systemExists) {
            // Only add if it's a new system
            console.log("✨ Adding new system:", data.system.name);
            console.log(
              `   System ${data.system.name} has ${
                data.system.connections.length
              } connections: [${data.system.connections.join(", ")}]`
            );
            useGameStore.getState().addSolarSystem(data.system);
          } else {
            // Update existing system with new connections and exploredBy data
            console.log(
              `🔗 Connecting to existing system: ${data.system.name}`
            );
            console.log(
              `   Updating existing system connections: [${data.system.connections.join(
                ", "
              )}]`
            );
            const updatedSystems = state.solarSystems.map((sys) =>
              sys.id === data.system.id ? data.system : sys
            );
            useGameStore.setState({ solarSystems: updatedSystems });
          }

          // Refresh state after potential system addition
          state = useGameStore.getState();

          // Add the tunnel if it exists and not already present
          if (data.tunnel) {
            const tunnelExists = state.tunnels.some(
              (t) => t.id === data.tunnel.id
            );
            if (!tunnelExists) {
              console.log(
                `🔗 Adding tunnel: ${data.tunnel.from} → ${data.tunnel.to}`
              );
              useGameStore.getState().addTunnel(data.tunnel);
            } else {
              console.log("   Tunnel already exists:", data.tunnel.id);
            }
          }

          // Update the source system with new connections
          if (data.updatedSourceSystem) {
            console.log(
              `🔄 Updating source system: ${data.updatedSourceSystem.name}`
            );
            console.log(
              `   Source system now has ${
                data.updatedSourceSystem.connections.length
              } connections: [${data.updatedSourceSystem.connections.join(
                ", "
              )}]`
            );
            // Refresh state again
            state = useGameStore.getState();
            const updatedSystems = state.solarSystems.map((sys) =>
              sys.id === data.updatedSourceSystem.id
                ? data.updatedSourceSystem
                : sys
            );
            useGameStore.setState({ solarSystems: updatedSystems });

            // Verify the update worked
            const verifyState = useGameStore.getState();
            const verifySystem = verifyState.solarSystems.find(
              (s) => s.id === data.updatedSourceSystem.id
            );
            console.log(
              `✅ Verified source system connections: [${verifySystem?.connections.join(
                ", "
              )}]`
            );
          }
        }
      );

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

      // Spaceship events
      socket.on("spaceship-launched", (data) => {
        console.log("Spaceship launched:", data.spaceship);
        const state = useGameStore.getState();
        useGameStore.setState({
          spaceships: [...state.spaceships, data.spaceship],
        });
      });

      socket.on("spaceship-destination-changed", (data) => {
        console.log("Spaceship destination changed:", data);
        const state = useGameStore.getState();
        const updatedSpaceships = state.spaceships.map((ship) =>
          ship.id === data.spaceshipId
            ? { ...ship, destination: data.newDestination }
            : ship
        );
        useGameStore.setState({ spaceships: updatedSpaceships });
      });

      socket.on("spaceship-removed", (data) => {
        console.log("Spaceship removed:", data.spaceshipId);
        const state = useGameStore.getState();
        const updatedSpaceships = state.spaceships.filter(
          (ship) => ship.id !== data.spaceshipId
        );
        useGameStore.setState({ spaceships: updatedSpaceships });
      });

      // Full state sync (for reconnections)
      socket.on("game-state-full-sync", (data) => {
        console.log("Full game state sync received");
        useGameStore.setState(data.gameState);
      });
    } // End of listenersRegistered check

    // Don't disconnect on cleanup since socket is shared globally
    return () => {
      // Socket persists across component unmounts
      // Only disconnect when the entire app unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - socket and listeners are created once globally

  const joinGalaxy = (
    galaxyId: string,
    playerName: string,
    playerUUID: string
  ) => {
    if (socketRef.current) {
      socketRef.current.emit("join-galaxy", {
        galaxyId,
        playerName,
        playerUUID,
      });
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

  const emitGenerateSystem = (fromSystemId?: string, starType?: string) => {
    if (socketRef.current) {
      socketRef.current.emit("generate-system", { fromSystemId, starType });
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

  const emitLaunchSpaceship = (
    fromId: string,
    fromType: string,
    toId: string,
    toType: string,
    spaceship: any
  ) => {
    if (socketRef.current) {
      socketRef.current.emit("launch-spaceship", {
        fromId,
        fromType,
        toId,
        toType,
        spaceship,
      });
    }
  };

  const emitChangeSpaceshipDestination = (
    spaceshipId: string,
    newDestination: { id: string; type: string }
  ) => {
    if (socketRef.current) {
      socketRef.current.emit("change-spaceship-destination", {
        spaceshipId,
        newDestination,
      });
    }
  };

  const emitRemoveSpaceship = (spaceshipId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("remove-spaceship", { spaceshipId });
    }
  };

  const requestFullSync = () => {
    if (socketRef.current) {
      socketRef.current.emit("request-full-sync");
    }
  };

  return {
    joinGalaxy,
    changeView,
    constructTunnel,
    togglePlayPauseSocket,
    updateGameTimeSocket,
    emitGenerateSystem,
    emitCurrentSystemChanged,
    emitPlanetSelected,
    syncGameState,
    emitLaunchSpaceship,
    emitChangeSpaceshipDestination,
    emitRemoveSpaceship,
    requestFullSync,
  };
};
