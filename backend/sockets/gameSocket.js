const { PLAYER_COLORS, applyMove } = require("../utils/gameEngine");
const { loadStore, saveStore } = require("../services/storeService");

function sanitizeRoom(room) {
  return {
    code: room.code,
    isPublic: room.isPublic,
    maxPlayers: room.maxPlayers,
    status: room.status,
    turnIndex: room.turnIndex,
    winner: room.winner,
    players: room.players.map((p) => ({
      name: p.name,
      color: p.color,
      position: p.position,
      ready: p.ready,
      connected: p.connected
    }))
  };
}

function registerGameSockets(io, rooms) {
  io.on("connection", (socket) => {
    socket.on("create-room", ({ playerName, isPublic = true, maxPlayers = 4 } = {}) => {
      const code = "AR" + Math.floor(1000 + Math.random() * 8999);
      const room = {
        code,
        isPublic: Boolean(isPublic),
        maxPlayers: Math.min(4, Math.max(2, Number(maxPlayers) || 4)),
        status: "waiting",
        turnIndex: 0,
        consecutiveSixes: 0,
        winner: null,
        startedAt: Date.now(),
        players: [
          {
            socketId: socket.id,
            name: playerName || "Player 1",
            color: PLAYER_COLORS[0],
            position: 0,
            ready: true,
            connected: true
          }
        ]
      };
      rooms.set(code, room);
      socket.join(code);
      socket.data.roomCode = code;
      io.to(code).emit("room-state", sanitizeRoom(room));
    });

    socket.on("join-room", ({ code, playerName } = {}) => {
      const clean = String(code || "").trim().toUpperCase();
      const room = rooms.get(clean);
      if (!room) return socket.emit("error-message", "Room not found.");
      if (room.status !== "waiting") return socket.emit("error-message", "Match already started.");
      if (room.players.length >= room.maxPlayers) return socket.emit("error-message", "Room is full.");

      const idx = room.players.length;
      room.players.push({
        socketId: socket.id,
        name: playerName || `Player ${idx + 1}`,
        color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
        position: 0,
        ready: false,
        connected: true
      });
      socket.join(clean);
      socket.data.roomCode = clean;
      io.to(clean).emit("room-state", sanitizeRoom(room));
    });

    socket.on("player-ready", ({ code } = {}) => {
      const room = rooms.get(String(code || socket.data.roomCode || "").toUpperCase());
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) player.ready = !player.ready;
      if (room.players.length >= 2 && room.players.every((p) => p.ready)) {
        room.status = "playing";
        room.startedAt = Date.now();
      }
      io.to(room.code).emit("room-state", sanitizeRoom(room));
    });

    socket.on("roll-dice", ({ code } = {}) => {
      const room = rooms.get(String(code || socket.data.roomCode || "").toUpperCase());
      if (!room || room.status !== "playing") return;
      const currentPlayer = room.players[room.turnIndex];
      if (!currentPlayer || currentPlayer.socketId !== socket.id) {
        return socket.emit("error-message", "Not your turn.");
      }

      const result = applyMove(room, true);
      io.to(room.code).emit("game-update", { room: sanitizeRoom(room), move: result });

      if (result.winner) {
        const store = loadStore();
        store.matches.unshift({
          id: "M-" + Date.now(),
          mode: "online",
          players: room.players.map((p) => p.name),
          winner: result.winner,
          durationSeconds: Math.round((Date.now() - room.startedAt) / 1000),
          createdAt: new Date().toISOString()
        });
        saveStore(store);
        io.to(room.code).emit("game-winner", { winner: result.winner, room: sanitizeRoom(room) });
      }
    });

    socket.on("disconnect", () => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.connected = false;
        io.to(code).emit("player-disconnected", { player: player.name, room: sanitizeRoom(room) });
      }
    });
  });
}

module.exports = { registerGameSockets, sanitizeRoom };
