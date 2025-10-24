import { Socket } from "socket.io";
import { GameGalaxy } from "../game/GameGalaxy";

export function setupSocketHandlers(
  socket: Socket,
  galaxies: Map<string, GameGalaxy>
) {
  // Join or create a galaxy
  socket.on(
    "join-galaxy",
    (data: { galaxyId?: string; playerName: string; playerUUID: string }) => {
      const { galaxyId, playerName, playerUUID: clientPlayerUUID } = data;
      const targetGalaxyId = galaxyId || "default";

      let galaxy = galaxies.get(targetGalaxyId);
      if (!galaxy) {
        galaxy = new GameGalaxy(targetGalaxyId);
        galaxies.set(targetGalaxyId, galaxy);
      }

      const success = galaxy.addPlayer(socket, playerName, clientPlayerUUID);
      if (success) {
        socket.join(targetGalaxyId);
        const player = galaxy.players.get(socket.id);
        console.log(
          `👤 Player joined galaxy "${targetGalaxyId}": ${socket.id} - ${playerName} (UUID: ${clientPlayerUUID})`
        );

        // Get full game state
        const fullGameState = galaxy.getGameState();

        // Filter systems based on player exploration (fog of war)
        const playerUUID = player?.uuid;
        const visibleSystems = fullGameState.solarSystems.filter((system) => {
          return (
            system.exploredBy && system.exploredBy.includes(playerUUID || "")
          );
        });

        // Filter tunnels to only show connections between visible systems
        const visibleSystemIds = new Set(visibleSystems.map((s) => s.id));
        const visibleTunnels = (fullGameState.tunnels || []).filter(
          (tunnel) =>
            visibleSystemIds.has(tunnel.from) && visibleSystemIds.has(tunnel.to)
        );

        console.log(
          `👁️  Player ${playerName} can see ${visibleSystems.length}/${fullGameState.solarSystems.length} systems`
        );

        // For initial load, only send player's home system for faster loading
        const homeSystemId = player?.homeSystemId;
        const homeSystem = visibleSystems.find((s) => s.id === homeSystemId);

        // Create optimized initial game state with only home system
        const initialGameState = {
          ...fullGameState,
          solarSystems: homeSystem ? [homeSystem] : [],
          tunnels: [], // Send tunnels separately later
        };

        // Send initial minimal game state for fast loading
        socket.emit("galaxy-joined", {
          galaxyId: targetGalaxyId,
          gameState: initialGameState,
          playerHomeSystemId: player?.homeSystemId,
        });

        // Send the rest of the visible systems in a separate event after a short delay
        // This allows the UI to render the home system first
        setTimeout(() => {
          if (visibleSystems.length > 1) {
            const otherSystems = visibleSystems.filter(
              (s) => s.id !== homeSystemId
            );
            socket.emit("additional-systems-loaded", {
              solarSystems: otherSystems,
              tunnels: visibleTunnels,
            });
            console.log(
              `📦 Sent ${otherSystems.length} additional visible systems to ${playerName}`
            );
          }
        }, 100); // Small delay to ensure first system renders first

        socket.to(targetGalaxyId).emit("player-joined", { player });
      } else {
        console.log(
          `❌ Galaxy "${targetGalaxyId}" is full, rejected ${socket.id} - ${playerName}`
        );
        socket.emit("galaxy-full", { message: "Galaxy is full" });
      }
    }
  );

  // Handle view changes
  socket.on("change-view", (data: { view: "solar" | "constellation" }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      galaxy.gameState.activeView = data.view;
      socket.to(galaxy.id).emit("view-changed", { view: data.view });
    }
  });

  // Handle tunnel construction
  socket.on("construct-tunnel", (data: { from: string; to: string }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      const player = galaxy.players.get(socket.id);
      if (player && player.tunnelCapacity > 0) {
        const tunnel = {
          id: `${data.from}-${data.to}`,
          from: data.from,
          to: data.to,
          capacity: 1,
          status: "under_construction" as const,
          controlledBy: socket.id,
        };

        galaxy.addTunnel(tunnel);
        player.tunnelCapacity--;

        socket.to(galaxy.id).emit("tunnel-constructed", { tunnel });
      }
    }
  });

  // Handle play/pause toggle
  socket.on("toggle-play-pause", () => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      galaxy.togglePlayPause();
      socket.to(galaxy.id).emit("play-state-changed", {
        isPlaying: galaxy.gameState.isPlaying,
      });
    }
  });

  // Handle game time updates
  socket.on("update-game-time", (data: { gameTime: number }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      galaxy.updateGameTime(data.gameTime);
      socket.to(galaxy.id).emit("game-time-updated", {
        gameTime: galaxy.gameState.gameTime,
      });
    }
  });

  // Handle system generation request (server generates)
  socket.on(
    "generate-system",
    (data: { fromSystemId?: string; starType?: string }) => {
      const galaxy = getPlayerGalaxy(socket, galaxies);
      if (galaxy) {
        try {
          const player = galaxy.players.get(socket.id);
          const newSystem = galaxy.generateSystem(
            data.fromSystemId,
            data.starType as any,
            player?.uuid
          );

          // Find the tunnel and updated source system
          const tunnel = data.fromSystemId
            ? galaxy.gameState.tunnels.find(
                (t) => t.to === newSystem.id || t.from === newSystem.id
              )
            : undefined;

          const sourceSystem = data.fromSystemId
            ? galaxy.gameState.solarSystems.find(
                (s) => s.id === data.fromSystemId
              )
            : undefined;

          // Broadcast complete generation info to all clients in galaxy (including requester)
          const generationData = {
            system: newSystem,
            tunnel: tunnel,
            updatedSourceSystem: sourceSystem, // Source system now has updated connections array
          };

          console.log(`📡 Broadcasting system generation:`);
          console.log(`   New System: ${newSystem.name}`);
          if (tunnel) console.log(`   Tunnel: ${tunnel.from} → ${tunnel.to}`);
          if (sourceSystem)
            console.log(
              `   Updated Source: ${sourceSystem.name} (${sourceSystem.connections.length} connections)`
            );

          socket.emit("system-generated", generationData);
          socket.to(galaxy.id).emit("system-generated", generationData);
        } catch (error: any) {
          socket.emit("error", { message: error.message });
        }
      }
    }
  );

  // Handle current system change
  socket.on("current-system-changed", (data: { systemId: string }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      galaxy.gameState.currentSystemId = data.systemId;
      socket.to(galaxy.id).emit("current-system-changed", data);
    }
  });

  // Handle planet selection
  socket.on("planet-selected", (data: { planetId: string | null }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      socket.to(galaxy.id).emit("planet-selected", data);
    }
  });

  // Handle game state sync
  socket.on("sync-game-state", (data: { gameState: any }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      // Update the galaxy's game state
      galaxy.gameState = { ...galaxy.gameState, ...data.gameState };
      socket
        .to(galaxy.id)
        .emit("game-state-synced", { gameState: galaxy.gameState });
    }
  });

  // Handle spaceship launch
  socket.on(
    "launch-spaceship",
    (data: {
      fromId: string;
      fromType: string;
      toId: string;
      toType: string;
      spaceship: any;
    }) => {
      const galaxy = getPlayerGalaxy(socket, galaxies);
      if (galaxy) {
        // Add spaceship to game state
        if (!galaxy.gameState.spaceships) {
          galaxy.gameState.spaceships = [];
        }
        galaxy.gameState.spaceships.push(data.spaceship);

        // Broadcast to all clients
        socket.emit("spaceship-launched", { spaceship: data.spaceship });
        socket
          .to(galaxy.id)
          .emit("spaceship-launched", { spaceship: data.spaceship });
      }
    }
  );

  // Handle spaceship destination change
  socket.on(
    "change-spaceship-destination",
    (data: {
      spaceshipId: string;
      newDestination: { id: string; type: string };
    }) => {
      const galaxy = getPlayerGalaxy(socket, galaxies);
      if (galaxy) {
        // Update spaceship in game state
        if (galaxy.gameState.spaceships) {
          const spaceship = galaxy.gameState.spaceships.find(
            (s: any) => s.id === data.spaceshipId
          );
          if (spaceship) {
            spaceship.destination = data.newDestination;

            // Broadcast to all clients
            socket.emit("spaceship-destination-changed", data);
            socket.to(galaxy.id).emit("spaceship-destination-changed", data);
          }
        }
      }
    }
  );

  // Handle spaceship removal
  socket.on("remove-spaceship", (data: { spaceshipId: string }) => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      // Remove spaceship from game state
      if (galaxy.gameState.spaceships) {
        galaxy.gameState.spaceships = galaxy.gameState.spaceships.filter(
          (s: any) => s.id !== data.spaceshipId
        );

        // Broadcast to all clients
        socket.emit("spaceship-removed", data);
        socket.to(galaxy.id).emit("spaceship-removed", data);
      }
    }
  });

  // Request full game state (for reconnections)
  socket.on("request-full-sync", () => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      socket.emit("game-state-full-sync", { gameState: galaxy.gameState });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const galaxy = getPlayerGalaxy(socket, galaxies);
    if (galaxy) {
      const player = galaxy.players.get(socket.id);
      const playerName = player ? player.name : "Unknown";
      console.log(
        `👋 Player left galaxy "${galaxy.id}": ${socket.id} - ${playerName}`
      );

      galaxy.removePlayer(socket.id);
      socket.to(galaxy.id).emit("player-left", { playerId: socket.id });

      // Clean up empty galaxies
      if (galaxy.players.size === 0) {
        console.log(`🗑️  Deleted empty galaxy: ${galaxy.id}`);
        galaxies.delete(galaxy.id);
      }
    }
  });
}

function getPlayerGalaxy(
  socket: Socket,
  galaxies: Map<string, GameGalaxy>
): GameGalaxy | null {
  for (const galaxy of galaxies.values()) {
    if (galaxy.players.has(socket.id)) {
      return galaxy;
    }
  }
  return null;
}
