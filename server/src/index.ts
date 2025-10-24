import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { GameGalaxy } from "./game/GameGalaxy";
import { setupSocketHandlers } from "./socket/handlers";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  // Enable compression for large payloads
  perMessageDeflate: {
    threshold: 1024, // Compress messages larger than 1KB
  },
  // Increase max HTTP buffer size for large game states
  maxHttpBufferSize: 10e6, // 10MB
});

// Middleware
app.use(cors());
app.use(express.json());

// Galaxies management
const galaxies = new Map<string, GameGalaxy>();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  setupSocketHandlers(socket, galaxies);

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n🌌 Constellation Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🚀 Ready to accept connections\n`);
});
