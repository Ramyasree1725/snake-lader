const { loadStore, saveStore } = require("../services/storeService");
const { toPublicUser } = require("./authController");
const { sanitizeString } = require("../middleware/validate");

const SHOP_ITEMS = [
  { id: "classic", name: "Classic Neon", cost: 0, type: "token" },
  { id: "cyber_crown", name: "Cyber Crown", cost: 120, type: "token" },
  { id: "dragon_flame", name: "Dragon Flame", cost: 250, type: "token" },
  { id: "emerald_gem", name: "Emerald Gem", cost: 400, type: "token" }
];

function getProfile(req, res) {
  const store = loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: toPublicUser(user) });
}

function updateProfile(req, res) {
  const store = loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (req.body.username) {
    const clean = sanitizeString(req.body.username, 24);
    if (clean.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    user.username = clean;
  }
  if (req.body.avatar) {
    user.avatar = sanitizeString(req.body.avatar, 8);
  }
  saveStore(store);
  return res.json({ user: toPublicUser(user) });
}

function claimDailyReward(req, res) {
  const store = loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastDailyClaim === today) {
    return res.status(400).json({ error: "Daily reward already claimed today" });
  }

  user.lastDailyClaim = today;
  user.coins = (user.coins || 0) + 100;
  user.xp = (user.xp || 0) + 50;
  user.level = Math.floor(user.xp / 200) + 1;
  saveStore(store);

  return res.json({
    claimed: true,
    coinsAdded: 100,
    xpAdded: 50,
    user: toPublicUser(user)
  });
}

function getShopItems(req, res) {
  return res.json({ items: SHOP_ITEMS });
}

function unlockOrEquipSkin(req, res) {
  const skinId = sanitizeString(req.body.skinId, 40);
  const item = SHOP_ITEMS.find((x) => x.id === skinId);
  if (!item) return res.status(404).json({ error: "Skin item not found" });

  const store = loadStore();
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.unlockedSkins = user.unlockedSkins || ["classic"];
  if (!user.unlockedSkins.includes(skinId)) {
    if ((user.coins || 0) < item.cost) {
      return res.status(400).json({ error: `Need ${item.cost} Arena Coins to unlock ${item.name}` });
    }
    user.coins -= item.cost;
    user.unlockedSkins.push(skinId);
  }

  user.equippedSkin = skinId;
  saveStore(store);
  return res.json({ user: toPublicUser(user) });
}

function getFriends(req, res) {
  const store = loadStore();
  const list = store.friendships.filter(
    (f) => f.requesterId === req.user.id || f.recipientId === req.user.id
  );
  return res.json({ friendships: list });
}

function sendFriendRequest(req, res) {
  const targetName = sanitizeString(req.body.username, 24);
  if (!targetName) return res.status(400).json({ error: "Target username required" });

  const store = loadStore();
  const target = store.users.find((u) => u.username.toLowerCase() === targetName.toLowerCase());
  if (!target) return res.status(404).json({ error: "Player not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });

  const exists = store.friendships.some(
    (f) =>
      (f.requesterId === req.user.id && f.recipientId === target.id) ||
      (f.requesterId === target.id && f.recipientId === req.user.id)
  );
  if (exists) return res.status(409).json({ error: "Friendship or request already exists" });

  const entry = {
    id: "FR-" + Date.now(),
    requesterId: req.user.id,
    requesterName: req.user.username,
    recipientId: target.id,
    recipientName: target.username,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  store.friendships.push(entry);
  saveStore(store);
  return res.status(201).json({ friendship: entry });
}

module.exports = {
  getProfile,
  updateProfile,
  claimDailyReward,
  getShopItems,
  unlockOrEquipSkin,
  getFriends,
  sendFriendRequest
};
