(function () {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let match = null;
  let timerInterval = null;

  function formatDuration(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function addLog(text, kind = "") {
    const logEl = document.getElementById("game-log");
    if (!logEl) return;
    const item = document.createElement("div");
    item.className = `log-entry ${kind}`;
    item.textContent = text;
    logEl.prepend(item);
  }

  function updateHUD() {
    if (!match) return;
    const current = match.players[match.turnIndex];
    const dot = document.getElementById("turn-dot");
    const turnLabel = document.getElementById("turn-label");
    const modeBadge = document.getElementById("game-mode-badge");
    const rollBtn = document.getElementById("roll-dice-btn");

    if (dot) dot.style.background = current.color;
    if (turnLabel) turnLabel.textContent = `${current.name}'s Turn${current.isBot ? " (Bot)" : ""}`;
    if (modeBadge) {
      const labels = { single: "Single Player", local: "Local Multiplayer", lobby: `Room ${match.roomCode || "Arena"}` };
      modeBadge.textContent = labels[match.mode] || "Arena Match";
    }
    if (rollBtn) {
      rollBtn.disabled = match.isAnimating || match.paused || match.finished || current.isBot;
    }

    const listEl = document.getElementById("game-players-list");
    if (listEl) {
      listEl.innerHTML = match.players
        .map(
          (p, i) => `
          <div class="player-score-row ${i === match.turnIndex ? "active" : ""}">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="player-dot" style="background:${p.color}"></span>
              <strong>${p.name}</strong>
              ${p.isBot ? '<span class="pill pill-accent">BOT</span>' : ""}
            </div>
            <span>Square <strong>${p.position}</strong>/100</span>
          </div>`
        )
        .join("");
    }
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (!match || match.paused || match.finished) return;
      match.elapsedSeconds += 1;
      const timerEl = document.getElementById("game-timer");
      if (timerEl) timerEl.textContent = `⏱ ${formatDuration(match.elapsedSeconds)}`;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  async function executeTurn() {
    if (!match || match.isAnimating || match.paused || match.finished) return;
    match.isAnimating = true;
    updateHUD();

    const player = match.players[match.turnIndex];
    const diceBox = document.getElementById("dice-box");
    const resultText = document.getElementById("dice-result-text");
    const statusText = document.getElementById("move-status-text");

    window.ArenaAudio.playDice();
    if (diceBox) diceBox.classList.add("rolling");
    if (resultText) resultText.textContent = `${player.name} is rolling...`;

    for (let i = 0; i < 6; i++) {
      if (diceBox) diceBox.setAttribute("data-face", String(1 + Math.floor(Math.random() * 6)));
      await sleep(75);
    }

    const roll = 1 + Math.floor(Math.random() * 6);
    if (diceBox) {
      diceBox.classList.remove("rolling");
      diceBox.setAttribute("data-face", String(roll));
    }
    if (resultText) resultText.textContent = `Rolled a ${roll}!`;

    if (roll === 6 && player.isHumanUser) {
      match.userMetrics.sixes += 1;
    }

    // Check 3 consecutive sixes safety
    const settings = window.ArenaStorage.getSettings();
    if (roll === 6) {
      match.consecutiveSixes += 1;
    } else {
      match.consecutiveSixes = 0;
    }

    if (settings.extraSix && match.consecutiveSixes >= 3) {
      match.consecutiveSixes = 0;
      addLog(`⚠️ ${player.name} rolled three 6s in a row! Turn forfeited.`);
      if (statusText) statusText.textContent = "Three 6s in a row — turn passes!";
      await sleep(550);
      advanceTurn(false);
      return;
    }

    const target = player.position + roll;
    if (target > 100) {
      addLog(`🎲 ${player.name} rolled ${roll}, needs exact ${100 - player.position} to win.`);
      if (statusText) statusText.textContent = `Too high! Need exact ${100 - player.position}.`;
      await sleep(550);
      advanceTurn(roll === 6 && settings.extraSix);
      return;
    }

    // Step-by-step hop animation
    if (statusText) statusText.textContent = `Moving ${roll} step${roll > 1 ? "s" : ""}...`;
    for (let step = player.position + 1; step <= target; step++) {
      player.position = step;
      window.ArenaAudio.playHop();
      window.ArenaBoard.renderTokens(match.players, match.turnIndex, false);
      updateHUD();
      await sleep(165);
    }

    // Check ladder or snake
    const ladderTop = window.ArenaData.LADDERS[player.position];
    const snakeTail = window.ArenaData.SNAKES[player.position];

    if (ladderTop) {
      const from = player.position;
      if (statusText) statusText.textContent = `🪜 Ladder! Climbing ${from} → ${ladderTop}!`;
      addLog(`🪜 ${player.name} climbed a ladder from ${from} to ${ladderTop}!`, "ladder");
      window.ArenaAudio.playLadder();
      if (player.isHumanUser) match.userMetrics.ladders += 1;
      await sleep(220);
      player.position = ladderTop;
      window.ArenaBoard.renderTokens(match.players, match.turnIndex, true);
      updateHUD();
      await sleep(680);
    } else if (snakeTail) {
      const from = player.position;
      if (statusText) statusText.textContent = `🐍 Snake! Sliding ${from} → ${snakeTail}!`;
      addLog(`🐍 ${player.name} got bitten at ${from} and slid to ${snakeTail}!`, "snake");
      window.ArenaAudio.playSnake();
      if (player.isHumanUser) match.userMetrics.snakes += 1;
      await sleep(220);
      player.position = snakeTail;
      window.ArenaBoard.renderTokens(match.players, match.turnIndex, true);
      updateHUD();
      await sleep(680);
    } else {
      addLog(`🎲 ${player.name} rolled ${roll} → square ${player.position}.`);
    }

    // Check victory
    if (player.position === 100) {
      handleWin(player);
      return;
    }

    const extraTurn = roll === 6 && settings.extraSix;
    if (extraTurn && statusText) {
      statusText.textContent = `🔥 Rolled 6! ${player.name} gets a bonus turn!`;
      addLog(`🔥 ${player.name} rolled a 6 and earned a bonus roll!`);
    }
    advanceTurn(extraTurn);
  }

  function advanceTurn(keepSamePlayer) {
    if (!match || match.finished) return;
    if (!keepSamePlayer) {
      match.turnIndex = (match.turnIndex + 1) % match.players.length;
      match.consecutiveSixes = 0;
    }
    match.isAnimating = false;
    updateHUD();
    window.ArenaBoard.renderTokens(match.players, match.turnIndex, false);

    const nextPlayer = match.players[match.turnIndex];
    if (nextPlayer.isBot && !match.paused && !match.finished) {
      setTimeout(() => {
        if (match && !match.paused && !match.finished && match.players[match.turnIndex].isBot) {
          executeTurn();
        }
      }, 650);
    }
  }

  function handleWin(winner) {
    match.finished = true;
    match.isAnimating = false;
    stopTimer();
    window.ArenaAudio.playWin();
    addLog(`🏆 ${winner.name} reached square 100 and WON the match!`, "win");
    updateHUD();

    const durationStr = formatDuration(match.elapsedSeconds);
    const newBadges = window.ArenaStorage.recordMatch({
      mode: match.mode,
      players: match.players.map((p) => p.name),
      winnerName: winner.name,
      duration: durationStr,
      userMetrics: match.userMetrics
    });

    const modal = document.getElementById("winner-modal");
    const titleEl = document.getElementById("winner-title");
    const subEl = document.getElementById("winner-subtitle");
    const sumEl = document.getElementById("winner-stats-summary");

    if (titleEl) titleEl.textContent = `${winner.name} Wins! 🎉`;
    if (subEl) subEl.textContent = `Reached square 100 in ${durationStr}`;
    if (sumEl) {
      const badgeNote = newBadges.length
        ? `<div class="pill pill-secondary" style="margin:0.4rem auto;">🏅 New Badge Unlocked!</div>`
        : "";
      sumEl.innerHTML = `
        <div>Mode: <strong>${match.mode.toUpperCase()}</strong></div>
        <div>Ladders Climbed: <strong>${match.userMetrics.ladders}</strong> · Sixes: <strong>${match.userMetrics.sixes}</strong></div>
        ${badgeNote}
      `;
    }
    if (modal) modal.classList.remove("hidden");
    window.ArenaBoard.launchConfetti();
    if (window.ArenaApp && window.ArenaApp.refreshAllViews) {
      window.ArenaApp.refreshAllViews();
    }
  }

  window.ArenaGame = {
    startNewMatch({ mode, players, roomCode = null }) {
      stopTimer();
      window.ArenaBoard.renderBoard();
      window.ArenaBoard.clearTokens();

      const currentUser = window.ArenaStorage.getCurrentUser();
      const skinObj =
        currentUser && currentUser.equippedSkin && currentUser.equippedSkin !== "classic"
          ? window.ArenaData.REWARD_SKINS.find((s) => s.id === currentUser.equippedSkin)
          : null;
      const normalized = players.map((p, idx) => {
        const isHuman = !p.isBot && (currentUser ? p.name === currentUser.username || idx === 0 : idx === 0);
        return {
          name: p.name,
          shortLabel: p.isBot ? "🤖" : isHuman && skinObj ? skinObj.icon : p.name.slice(0, 2).toUpperCase(),
          color: p.color || window.ArenaData.PLAYER_COLORS[idx % window.ArenaData.PLAYER_COLORS.length],
          position: 0,
          isBot: Boolean(p.isBot),
          isHumanUser: isHuman
        };
      });

      match = {
        mode,
        roomCode,
        players: normalized,
        turnIndex: 0,
        consecutiveSixes: 0,
        elapsedSeconds: 0,
        isAnimating: false,
        paused: false,
        finished: false,
        lastConfig: { mode, players, roomCode },
        userMetrics: { ladders: 0, snakes: 0, sixes: 0 }
      };

      const logEl = document.getElementById("game-log");
      if (logEl) logEl.innerHTML = "";
      const timerEl = document.getElementById("game-timer");
      if (timerEl) timerEl.textContent = "⏱ 00:00";
      const resultText = document.getElementById("dice-result-text");
      if (resultText) resultText.textContent = "Roll to Start!";
      const statusText = document.getElementById("move-status-text");
      if (statusText) statusText.textContent = "Press Space or click Roll";

      addLog(`🎮 Match started (${normalized.map((p) => p.name).join(" vs ")})`);
      window.ArenaBoard.renderTokens(match.players, 0, false);
      updateHUD();
      startTimer();

      if (match.players[0].isBot) {
        setTimeout(() => executeTurn(), 650);
      }
    },

    roll() {
      executeTurn();
    },

    togglePause(forcePause) {
      if (!match || match.finished) return;
      match.paused = typeof forcePause === "boolean" ? forcePause : !match.paused;
      const pauseModal = document.getElementById("pause-modal");
      if (pauseModal) pauseModal.classList.toggle("hidden", !match.paused);
      updateHUD();
      if (!match.paused && match.players[match.turnIndex].isBot && !match.isAnimating) {
        setTimeout(() => executeTurn(), 500);
      }
    },

    restart() {
      if (!match) return;
      const cfg = match.lastConfig;
      document.getElementById("winner-modal")?.classList.add("hidden");
      document.getElementById("pause-modal")?.classList.add("hidden");
      this.startNewMatch(cfg);
    },

    stop() {
      stopTimer();
      match = null;
    },

    isActive() {
      return Boolean(match && !match.finished);
    }
  };
})();
