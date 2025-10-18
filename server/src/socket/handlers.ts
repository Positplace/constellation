import { Socket } from "socket.io";
import { GameRoom } from "../game/GameRoom";

export function setupSocketHandlers(
  socket: Socket,
  gameRooms: Map<string, GameRoom>
) {
  // Join or create a game room
  socket.on("join-room", (data: { roomId?: string; playerName: string }) => {
    const { roomId, playerName } = data;
    const targetRoomId = roomId || "default";

    let room = gameRooms.get(targetRoomId);
    if (!room) {
      room = new GameRoom(targetRoomId);
      gameRooms.set(targetRoomId, room);
    }

    const success = room.addPlayer(socket, playerName);
    if (success) {
      socket.join(targetRoomId);
      socket.emit("room-joined", {
        roomId: targetRoomId,
        gameState: room.getGameState(),
      });
      socket
        .to(targetRoomId)
        .emit("player-joined", { player: room.players.get(socket.id) });
    } else {
      socket.emit("room-full", { message: "Room is full" });
    }
  });

  // Handle view changes
  socket.on("change-view", (data: { view: "solar" | "constellation" }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.gameState.activeView = data.view;
      socket.to(room.id).emit("view-changed", { view: data.view });
    }
  });

  // Handle tunnel construction
  socket.on("construct-tunnel", (data: { from: string; to: string }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      const player = room.players.get(socket.id);
      if (player && player.tunnelCapacity > 0) {
        const tunnel = {
          id: `${data.from}-${data.to}`,
          from: data.from,
          to: data.to,
          capacity: 1,
          status: "under_construction" as const,
          controlledBy: socket.id,
        };

        room.addTunnel(tunnel);
        player.tunnelCapacity--;

        socket.to(room.id).emit("tunnel-constructed", { tunnel });
      }
    }
  });

  // Handle turn progression
  socket.on("next-turn", () => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.nextTurn();
      socket
        .to(room.id)
        .emit("turn-progressed", { turn: room.gameState.currentTurn });
    }
  });

  // Handle play/pause toggle
  socket.on("toggle-play-pause", () => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.togglePlayPause();
      socket.to(room.id).emit("play-state-changed", {
        isPlaying: room.gameState.isPlaying,
      });
    }
  });

  // Handle game time updates
  socket.on("update-game-time", (data: { gameTime: number }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.updateGameTime(data.gameTime);
      socket.to(room.id).emit("game-time-updated", {
        gameTime: room.gameState.gameTime,
      });
    }
  });

  // Handle system exploration/generation
  socket.on(
    "system-generated",
    (data: { system: any; fromSystemId: string }) => {
      const room = getPlayerRoom(socket, gameRooms);
      if (room) {
        room.addSolarSystem(data.system);
        socket.to(room.id).emit("system-generated", data);
      }
    }
  );

  // Handle current system change
  socket.on("current-system-changed", (data: { systemId: string }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.gameState.currentSystemId = data.systemId;
      socket.to(room.id).emit("current-system-changed", data);
    }
  });

  // Handle planet selection
  socket.on("planet-selected", (data: { planetId: string | null }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      socket.to(room.id).emit("planet-selected", data);
    }
  });

  // Handle game state sync
  socket.on("sync-game-state", (data: { gameState: any }) => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      // Update the room's game state
      room.gameState = { ...room.gameState, ...data.gameState };
      socket
        .to(room.id)
        .emit("game-state-synced", { gameState: room.gameState });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const room = getPlayerRoom(socket, gameRooms);
    if (room) {
      room.removePlayer(socket.id);
      socket.to(room.id).emit("player-left", { playerId: socket.id });

      // Clean up empty rooms
      if (room.players.size === 0) {
        gameRooms.delete(room.id);
      }
    }
  });
}

function getPlayerRoom(
  socket: Socket,
  gameRooms: Map<string, GameRoom>
): GameRoom | null {
  for (const room of gameRooms.values()) {
    if (room.players.has(socket.id)) {
      return room;
    }
  }
  return null;
}
