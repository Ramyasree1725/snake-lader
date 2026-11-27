const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "store.json");

function createInitialStore() {
  return {
    users: [],
    matches: [],
    friendships: [],
    feedback: [],
    rewards: []
  };
}

function loadStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const init = createInitialStore();
      fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...createInitialStore(), ...parsed };
  } catch {
    return createInitialStore();
  }
}

function saveStore(store) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {
    // Ignore disk write failure in read-only environments
  }
}

module.exports = { loadStore, saveStore };
