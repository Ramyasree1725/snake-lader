const bcrypt = require("bcryptjs");
const { loadStore, saveStore } = require("../services/storeService");
const { signToken } = require("../middleware/auth");
const { sanitizeString } = require("../middleware/validate");

async function register(req, res) {
  const username = sanitizeString(req.body.username, 24);
  const email = sanitizeString(req.body.email, 80).toLowerCase();
  const password = String(req.body.password || "");

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }

  const store = loadStore();
  const duplicate = store.users.some(
    (u) => u.email === email || u.username.toLowerCase() === username.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ error: "Username or email is already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: "U-" + Date.now(),
    username,
    email,
    passwordHash,
    avatar: "🦊",
    role: "player",
    banned: false,
    coins: 150,
    xp: 0,
    level: 1,
    totalGames: 0,
    totalWins: 0,
    unlockedSkins: ["classic"],
    equippedSkin: "classic",
    achievements: [],
    createdAt: new Date().toISOString()
  };

  store.users.push(user);
  saveStore(store);

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: toPublicUser(user)
  });
}

async function login(req, res) {
  const identifier = sanitizeString(req.body.email, 80).toLowerCase();
  const password = String(req.body.password || "");

  const store = loadStore();
  const user = store.users.find(
    (u) => u.email === identifier || u.username.toLowerCase() === identifier
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.banned) {
    return res.status(403).json({ error: "Account is suspended" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: toPublicUser(user)
  });
}

function getMe(req, res) {
  const store = loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: toPublicUser(user) });
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    coins: user.coins || 0,
    xp: user.xp || 0,
    level: user.level || 1,
    totalGames: user.totalGames || 0,
    totalWins: user.totalWins || 0,
    unlockedSkins: user.unlockedSkins || ["classic"],
    equippedSkin: user.equippedSkin || "classic",
    achievements: user.achievements || [],
    createdAt: user.createdAt
  };
}

module.exports = { register, login, getMe, toPublicUser };
