const { loadStore, saveStore } = require("../services/storeService");
const { toPublicUser } = require("./authController");
const { sanitizeString } = require("../middleware/validate");

function getAdminStats(req, res) {
  const store = loadStore();
  const openTickets = store.feedback.filter((f) => f.status === "open").length;
  const activeUsers = store.users.filter((u) => !u.banned).length;
  return res.json({
    totalUsers: store.users.length,
    activeUsers,
    totalMatches: store.matches.length,
    openTickets
  });
}

function listUsers(req, res) {
  const store = loadStore();
  return res.json({
    users: store.users.map((u) => ({ ...toPublicUser(u), banned: Boolean(u.banned) }))
  });
}

function toggleUserBan(req, res) {
  const store = loadStore();
  const target = store.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.role === "admin") {
    return res.status(400).json({ error: "Cannot suspend an admin account" });
  }
  target.banned = typeof req.body.banned === "boolean" ? req.body.banned : !target.banned;
  saveStore(store);
  return res.json({ id: target.id, banned: target.banned });
}

function listFeedback(req, res) {
  const store = loadStore();
  return res.json({ feedback: store.feedback });
}

function submitFeedback(req, res) {
  const subject = sanitizeString(req.body.subject, 120);
  const message = sanitizeString(req.body.message, 1000);
  const category = ["feedback", "bug", "report"].includes(req.body.category)
    ? req.body.category
    : "feedback";

  const store = loadStore();
  const ticket = {
    id: "FB-" + Date.now(),
    author: req.body.author || "Guest",
    category,
    subject,
    message,
    status: "open",
    createdAt: new Date().toISOString()
  };
  store.feedback.unshift(ticket);
  saveStore(store);
  return res.status(201).json({ ticket });
}

function resolveFeedback(req, res) {
  const store = loadStore();
  const ticket = store.feedback.find((f) => f.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: "Feedback ticket not found" });
  ticket.status = "resolved";
  saveStore(store);
  return res.json({ ticket });
}

module.exports = {
  getAdminStats,
  listUsers,
  toggleUserBan,
  listFeedback,
  submitFeedback,
  resolveFeedback
};
