const mongoose = require("mongoose");

let mongoConnected = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("[DB] MONGO_URI not set — running with local JSON fallback store.");
    return false;
  }
  try {
    await mongoose.connect(uri);
    mongoConnected = true;
    console.log("[DB] Connected to MongoDB.");
    return true;
  } catch (err) {
    console.warn("[DB] MongoDB connection failed, falling back to local JSON store:", err.message);
    return false;
  }
}

function isMongoReady() {
  return mongoConnected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isMongoReady };
