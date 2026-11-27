const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: "🦊" },
    role: { type: String, enum: ["player", "admin"], default: "player" },
    banned: { type: Boolean, default: false },
    totalGames: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const gameSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    mode: { type: String, enum: ["single", "local", "online", "private"], default: "online" },
    isPublic: { type: Boolean, default: true },
    status: { type: String, enum: ["waiting", "playing", "finished"], default: "waiting" },
    players: [
      {
        name: String,
        socketId: String,
        color: String,
        position: { type: Number, default: 0 },
        ready: { type: Boolean, default: false }
      }
    ],
    turnIndex: { type: Number, default: 0 },
    winner: { type: String, default: null }
  },
  { timestamps: true }
);

const matchSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true },
    players: [{ type: String }],
    winner: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const friendshipSchema = new mongoose.Schema(
  {
    requester: { type: String, required: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

const achievementSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    badgeCode: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
achievementSchema.index({ username: 1, badgeCode: 1 }, { unique: true });

const feedbackSchema = new mongoose.Schema(
  {
    author: { type: String, default: "Guest" },
    category: { type: String, enum: ["feedback", "bug", "report"], default: "feedback" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "reviewed", "resolved"], default: "open" }
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Game: mongoose.models.Game || mongoose.model("Game", gameSchema),
  Match: mongoose.models.Match || mongoose.model("Match", matchSchema),
  Friendship: mongoose.models.Friendship || mongoose.model("Friendship", friendshipSchema),
  Achievement: mongoose.models.Achievement || mongoose.model("Achievement", achievementSchema),
  Feedback: mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema)
};
