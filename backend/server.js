require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const createGameRouter = require("./routes/gameRoutes");
const { registerGameSockets } = require("./sockets/gameSocket");

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" }
});

app.use(cors());
app.use(express.json());

// Serve static frontend from workspace root
const ROOT_DIR = path.resolve(__dirname, "..");
app.use(express.static(ROOT_DIR));

const rooms = new Map();

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "snake-ladder-arena", activeRooms: rooms.size });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", adminRoutes);
app.use("/api", createGameRouter(rooms));

registerGameSockets(io, rooms);

connectDB().finally(() => {
  server.listen(PORT, () => {
    console.log(`[Server] Snake & Ladder Arena running at http://localhost:${PORT}`);
  });
});
