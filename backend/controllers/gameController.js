const { loadStore, saveStore } = require("../services/storeService");
const { LADDERS, SNAKES, PLAYER_COLORS, applyMove } = require("../utils/gameEngine");

function getBoardConfigs(req, res) {
  return res.json({
    classic: { name: "Classic Arena", ladders: LADDERS, snakes: SNAKES },
    gauntlet: {
      name: "Cyber Gauntlet",
      ladders: { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 },
      snakes: { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 }
    }
  });
}

function getLeaderboard(req, res) {
  const store = loadStore();
  const ranked = [...store.users]
    .sort((a, b) => (b.totalWins || 0) - (a.totalWins || 0) || (b.totalGames || 0) - (a.totalGames || 0))
    .slice(0, 20)
    .map((u, idx) => ({
      rank: idx + 1,
      username: u.username,
      avatar: u.avatar || "🦊",
      level: u.level || 1,
      totalGames: u.totalGames || 0,
      totalWins: u.totalWins || 0,
      winRate: u.totalGames ? Math.round(((u.totalWins || 0) / u.totalGames) * 100) : 0
    }));
  return res.json({ leaderboard: ranked });
}

function getMatchHistory(req, res) {
  const store = loadStore();
  return res.json({ matches: store.matches.slice(0, 50) });
}

function createRestGame(rooms) {
  return (req, res) => {
    const code = "AR" + Math.floor(1000 + Math.random() * 8999);
    const playerName = req.body.playerName || req.user?.username || "Player 1";
    const room = {
      code,
      isPublic: req.body.isPublic !== false,
      maxPlayers: Math.min(4, Math.max(2, Number(req.body.maxPlayers) || 2)),
      status: "waiting",
      turnIndex: 0,
      consecutiveSixes: 0,
      winner: null,
      startedAt: Date.now(),
      players: [
        {
          socketId: null,
          name: playerName,
          color: PLAYER_COLORS[0],
          position: 0,
          ready: true,
          connected: true
        }
      ]
    };
    rooms.set(code, room);
    return res.status(201).json({ room });
  };
}

function joinRestGame(rooms) {
  return (req, res) => {
    const code = String(req.body.code || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: "Room is full" });

    const idx = room.players.length;
    const playerName = req.body.playerName || `Player ${idx + 1}`;
    room.players.push({
      socketId: null,
      name: playerName,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      position: 0,
      ready: true,
      connected: true
    });
    if (room.players.length >= 2) room.status = "playing";
    return res.json({ room });
  };
}

function getRestGame(rooms) {
  return (req, res) => {
    const code = String(req.params.id || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: "Game room not found" });
    return res.json({ room });
  };
}

function submitRestMove(rooms) {
  return (req, res) => {
    const code = String(req.params.id || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: "Game room not found" });
    if (room.status === "finished") return res.status(400).json({ error: "Game already finished" });

    room.status = "playing";
    const move = applyMove(room, true);
    if (move.winner) {
      const store = loadStore();
      store.matches.unshift({
        id: "M-" + Date.now(),
        mode: "online",
        players: room.players.map((p) => p.name),
        winner: move.winner,
        durationSeconds: Math.round((Date.now() - room.startedAt) / 1000),
        createdAt: new Date().toISOString()
      });
      saveStore(store);
    }
    return res.json({ move, room });
  };
}

module.exports = {
  getBoardConfigs,
  getLeaderboard,
  getMatchHistory,
  createRestGame,
  joinRestGame,
  getRestGame,
  submitRestMove
};
