(function () {
  window.ArenaData = {
    LADDERS: {
      2: 38,
      7: 14,
      28: 84,
      51: 67,
      71: 91
    },
    SNAKES: {
      16: 6,
      49: 11,
      62: 18,
      87: 24,
      99: 54
    },
    PLAYER_COLORS: ["#00C9A7", "#FFC857", "#FF5C77", "#7357FF"],
    AVATARS: ["🦊", "🐉", "🦁", "🐼", "⚡", "👾", "🚀", "👑"],
    ACHIEVEMENTS: [
      { id: "FIRST_WIN", icon: "🏆", title: "First Victory", desc: "Win your first Snake & Ladder match." },
      { id: "FIVE_GAMES", icon: "🎮", title: "Five Games Played", desc: "Complete 5 matches in any mode." },
      { id: "TEN_WINS", icon: "🔥", title: "Ten Wins", desc: "Achieve 10 victories across the Arena." },
      { id: "LADDER_CLIMBER", icon: "🪜", title: "Ladder Climber", desc: "Climb 10 ladders across your matches." },
      { id: "LUCKY_DICE", icon: "🎲", title: "Lucky Dice", desc: "Roll 15 sixes across your matches." },
      { id: "CHAMPION", icon: "👑", title: "Arena Champion", desc: "Reach at least a 60% win rate (min 5 games)." }
    ],
    REWARD_SKINS: [
      { id: "classic", name: "Classic Neon", icon: "🟢", cost: 0, desc: "Default glowing arena token." },
      { id: "cyber_crown", name: "Cyber Crown", icon: "👑", cost: 120, desc: "Golden crown emblem for champions." },
      { id: "dragon_flame", name: "Dragon Flame", icon: "🐉", cost: 250, desc: "Fiery dragon crest token." },
      { id: "emerald_gem", name: "Emerald Gem", icon: "💎", cost: 400, desc: "Precious crystal neon token." }
    ],
    SEED_LEADERBOARD: [
      { username: "NeonViper", avatar: "🐍", games: 42, wins: 29, period: "global" },
      { username: "LadderKing", avatar: "👑", games: 35, wins: 24, period: "global" },
      { username: "CyberFox", avatar: "🦊", games: 28, wins: 19, period: "weekly" },
      { username: "DiceWizard", avatar: "⚡", games: 31, wins: 18, period: "monthly" },
      { username: "PixelDragon", avatar: "🐉", games: 22, wins: 14, period: "weekly" },
      { username: "TurboPanda", avatar: "🐼", games: 19, wins: 11, period: "monthly" },
      { username: "NovaKnight", avatar: "🚀", games: 15, wins: 8, period: "global" },
      { username: "ShadowLion", avatar: "🦁", games: 14, wins: 7, period: "weekly" }
    ],
    SEED_PUBLIC_ROOMS: [
      { code: "NEON99", host: "NeonViper", maxPlayers: 4, players: ["NeonViper", "CyberFox"] },
      { code: "CYBER7", host: "LadderKing", maxPlayers: 2, players: ["LadderKing"] },
      { code: "DICE42", host: "DiceWizard", maxPlayers: 4, players: ["DiceWizard", "TurboPanda", "NovaKnight"] }
    ],
    SEED_FRIENDS: [
      { username: "CyberFox", avatar: "🦊", online: true, status: "accepted" },
      { username: "LadderKing", avatar: "👑", online: true, status: "accepted" },
      { username: "PixelDragon", avatar: "🐉", online: false, status: "accepted" },
      { username: "DiceWizard", avatar: "⚡", online: true, status: "pending" }
    ],
    getCellCoords(cell) {
      if (cell <= 0) {
        return { xPct: 3.5, yPct: 96.5, rowTop: 9, col: 0 };
      }
      const clamped = Math.min(100, Math.max(1, cell));
      const rowBottom = Math.floor((clamped - 1) / 10);
      const rowTop = 9 - rowBottom;
      const offset = (clamped - 1) % 10;
      const col = rowBottom % 2 === 0 ? offset : 9 - offset;
      return {
        rowTop,
        col,
        xPct: (col + 0.5) * 10,
        yPct: (rowTop + 0.5) * 10
      };
    }
  };
})();
