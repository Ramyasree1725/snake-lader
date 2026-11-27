(function () {
  const KEY = "snake_ladder_arena_v1";

  function createDefaultState() {
    return {
      users: [
        {
          id: "ARENA-101",
          username: "PlayerOne",
          email: "player@arena.gg",
          passwordHash: btoa("demo123"),
          avatar: "🦊",
          role: "player",
          banned: false,
          joinedAt: "2026-10-12",
          stats: { totalGames: 4, totalWins: 2, laddersClimbed: 7, snakesBitten: 3, sixesRolled: 9 },
          coins: 200,
          xp: 240,
          level: 2,
          unlockedSkins: ["classic"],
          equippedSkin: "classic",
          achievements: ["FIRST_WIN"]
        },
        {
          id: "ARENA-001",
          username: "ArenaAdmin",
          email: "admin@arena.gg",
          passwordHash: btoa("admin123"),
          avatar: "👑",
          role: "admin",
          banned: false,
          joinedAt: "2026-09-01",
          stats: { totalGames: 12, totalWins: 8, laddersClimbed: 16, snakesBitten: 5, sixesRolled: 20 },
          coins: 500,
          xp: 820,
          level: 5,
          unlockedSkins: ["classic", "cyber_crown"],
          equippedSkin: "cyber_crown",
          achievements: ["FIRST_WIN", "FIVE_GAMES", "LADDER_CLIMBER", "LUCKY_DICE", "CHAMPION"]
        }
      ],
      currentUserId: "ARENA-101",
      matches: [
        {
          id: "M-1001",
          date: "2026-11-25 18:40",
          mode: "single",
          players: ["PlayerOne", "Arena Bot"],
          winner: "PlayerOne",
          duration: "02:14"
        },
        {
          id: "M-1002",
          date: "2026-11-26 14:15",
          mode: "local",
          players: ["PlayerOne", "CyberFox"],
          winner: "CyberFox",
          duration: "03:05"
        }
      ],
      friends: window.ArenaData.SEED_FRIENDS.map((f) => ({ ...f })),
      feedback: [
        {
          id: "FB-101",
          author: "PlayerOne",
          category: "feedback",
          subject: "Love the Neon Ladders!",
          message: "The animated dice and glow effects feel super smooth.",
          status: "reviewed",
          createdAt: "2026-11-24"
        }
      ],
      settings: {
        sfx: true,
        music: false,
        extraSix: true,
        theme: "neon",
        language: "en"
      }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const init = createDefaultState();
        save(init);
        return init;
      }
      return JSON.parse(raw);
    } catch {
      const init = createDefaultState();
      save(init);
      return init;
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in restricted browsers
    }
  }

  function evaluateAchievements(user) {
    const unlocked = new Set(user.achievements || []);
    const s = user.stats;
    if (s.totalWins >= 1) unlocked.add("FIRST_WIN");
    if (s.totalGames >= 5) unlocked.add("FIVE_GAMES");
    if (s.totalWins >= 10) unlocked.add("TEN_WINS");
    if (s.laddersClimbed >= 10) unlocked.add("LADDER_CLIMBER");
    if (s.sixesRolled >= 15) unlocked.add("LUCKY_DICE");
    if (s.totalGames >= 5 && s.totalWins / s.totalGames >= 0.6) unlocked.add("CHAMPION");
    const newlyUnlocked = [...unlocked].filter((id) => !(user.achievements || []).includes(id));
    user.achievements = [...unlocked];
    return newlyUnlocked;
  }

  window.ArenaStorage = {
    getState: load,
    saveState: save,
    getCurrentUser() {
      const state = load();
      return state.users.find((u) => u.id === state.currentUserId) || null;
    },
    getSettings() {
      return load().settings;
    },
    updateSettings(partial) {
      const state = load();
      state.settings = { ...state.settings, ...partial };
      save(state);
      return state.settings;
    },
    login(identifier, password) {
      const state = load();
      const lower = identifier.trim().toLowerCase();
      const user = state.users.find(
        (u) => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
      );
      if (!user) return { ok: false, error: "Account not found." };
      if (user.banned) return { ok: false, error: "This account is currently suspended." };
      if (user.passwordHash !== btoa(password)) return { ok: false, error: "Invalid password." };
      state.currentUserId = user.id;
      save(state);
      return { ok: true, user };
    },
    register({ username, email, password }) {
      const state = load();
      const exists = state.users.some(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() ||
          u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (exists) return { ok: false, error: "Username or email already exists." };
      const newUser = {
        id: "ARENA-" + Math.floor(200 + Math.random() * 799),
        username: username.trim(),
        email: email.trim(),
        passwordHash: btoa(password),
        avatar: "⚡",
        role: "player",
        banned: false,
        joinedAt: new Date().toISOString().slice(0, 10),
        stats: { totalGames: 0, totalWins: 0, laddersClimbed: 0, snakesBitten: 0, sixesRolled: 0 },
        achievements: []
      };
      state.users.push(newUser);
      state.currentUserId = newUser.id;
      save(state);
      return { ok: true, user: newUser };
    },
    logout() {
      const state = load();
      state.currentUserId = null;
      save(state);
    },
    updateProfile({ username, avatar }) {
      const state = load();
      const user = state.users.find((u) => u.id === state.currentUserId);
      if (!user) return null;
      if (username) user.username = username.trim();
      if (avatar) user.avatar = avatar;
      save(state);
      return user;
    },
    recordMatch({ mode, players, winnerName, duration, userMetrics }) {
      const state = load();
      const now = new Date();
      const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
      state.matches.unshift({
        id: "M-" + Date.now().toString().slice(-4),
        date: stamp,
        mode,
        players,
        winner: winnerName,
        duration
      });
      state.matches = state.matches.slice(0, 50);

      let newBadges = [];
      const user = state.users.find((u) => u.id === state.currentUserId);
      if (user) {
        user.stats.totalGames += 1;
        const won = winnerName === user.username;
        if (won) user.stats.totalWins += 1;
        user.coins = (user.coins || 0) + (won ? 80 : 25);
        user.xp = (user.xp || 0) + (won ? 100 : 35);
        user.level = Math.floor(user.xp / 200) + 1;
        if (userMetrics) {
          user.stats.laddersClimbed += userMetrics.ladders || 0;
          user.stats.snakesBitten += userMetrics.snakes || 0;
          user.stats.sixesRolled += userMetrics.sixes || 0;
        }
        newBadges = evaluateAchievements(user);
      }
      save(state);
      return newBadges;
    },
    claimDailyReward() {
      const state = load();
      const user = state.users.find((u) => u.id === state.currentUserId);
      if (!user) return { ok: false, error: "Please login first to claim daily rewards." };
      const today = new Date().toISOString().slice(0, 10);
      if (user.lastDailyClaim === today) {
        return { ok: false, error: "Today's daily bonus is already claimed!" };
      }
      user.lastDailyClaim = today;
      user.coins = (user.coins || 0) + 100;
      user.xp = (user.xp || 0) + 50;
      user.level = Math.floor(user.xp / 200) + 1;
      save(state);
      return { ok: true, coins: user.coins, xp: user.xp, level: user.level };
    },
    unlockOrEquipSkin(skinId) {
      const skin = window.ArenaData.REWARD_SKINS.find((s) => s.id === skinId);
      if (!skin) return { ok: false, error: "Skin not found." };
      const state = load();
      const user = state.users.find((u) => u.id === state.currentUserId);
      if (!user) return { ok: false, error: "Please login first." };
      user.unlockedSkins = user.unlockedSkins || ["classic"];
      if (!user.unlockedSkins.includes(skinId)) {
        if ((user.coins || 0) < skin.cost) {
          return { ok: false, error: `Need ${skin.cost} Arena Coins to unlock ${skin.name}.` };
        }
        user.coins -= skin.cost;
        user.unlockedSkins.push(skinId);
      }
      user.equippedSkin = skinId;
      save(state);
      return { ok: true, user };
    },
    resetAll() {
      const fresh = createDefaultState();
      save(fresh);
      return fresh;
    }
  };
})();
