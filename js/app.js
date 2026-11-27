(function () {
  let activeLobbyRoom = null;
  let publicRooms = window.ArenaData.SEED_PUBLIC_ROOMS.map((r) => ({ ...r, players: [...r.players] }));
  let currentRoute = "home";
  let leaderboardPeriod = "global";

  function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  function applySettingsToDOM() {
    const s = window.ArenaStorage.getSettings();
    document.body.setAttribute("data-theme", s.theme || "neon");
    const soundBtn = document.getElementById("sound-quick-toggle");
    if (soundBtn) soundBtn.textContent = s.sfx ? "🔊" : "🔇";

    const sfxEl = document.getElementById("setting-sfx");
    const musicEl = document.getElementById("setting-music");
    const extraEl = document.getElementById("setting-extra-six");
    const themeEl = document.getElementById("setting-theme");
    const langEl = document.getElementById("setting-language");
    if (sfxEl) sfxEl.checked = s.sfx;
    if (musicEl) musicEl.checked = s.music;
    if (extraEl) extraEl.checked = s.extraSix;
    if (themeEl) themeEl.value = s.theme || "neon";
    if (langEl) langEl.value = s.language || "en";

    const isTe = s.language === "te";
    const rollBtn = document.getElementById("roll-dice-btn");
    if (rollBtn) rollBtn.textContent = isTe ? "🎲 Dice Veyyandi" : "🎲 Roll Dice";
    const enterBtn = document.getElementById("enter-arena-btn");
    if (enterBtn) enterBtn.textContent = isTe ? "Arena Lo Ki Randi" : "Enter Arena";
  }

  function navigate(route) {
    if (route === "game-quick") {
      startQuickBotGame();
      return;
    }

    const pageId = route === "login" || route === "register" ? "auth" : route;
    const targetEl = document.getElementById(`page-${pageId}`);
    if (!targetEl) return;

    currentRoute = pageId;
    document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
    targetEl.classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === pageId);
    });
    document.getElementById("main-nav")?.classList.remove("open");

    if (route === "register") toggleAuthTab("register");
    else if (route === "login") toggleAuthTab("login");

    refreshAllViews();
    window.location.hash = pageId;
  }

  function enterApp(route = "home") {
    document.getElementById("splash-screen")?.classList.add("hidden");
    document.getElementById("app-shell")?.classList.remove("hidden");
    navigate(route);
  }

  function toggleAuthTab(tab) {
    const isReg = tab === "register";
    document.getElementById("tab-login")?.classList.toggle("active", !isReg);
    document.getElementById("tab-register")?.classList.toggle("active", isReg);
    document.getElementById("login-form")?.classList.toggle("hidden", isReg);
    document.getElementById("register-form")?.classList.toggle("hidden", !isReg);
  }

  function renderNavAuth() {
    const area = document.getElementById("nav-auth-area");
    if (!area) return;
    const user = window.ArenaStorage.getCurrentUser();
    if (!user) {
      area.innerHTML = `<button class="btn btn-primary btn-sm" id="nav-login-btn">Login</button>`;
      document.getElementById("nav-login-btn")?.addEventListener("click", () => navigate("auth"));
      return;
    }

    area.innerHTML = `
      ${user.role === "admin" ? `<button class="btn btn-gold btn-sm" id="nav-admin-btn">Admin</button>` : ""}
      <button class="user-pill" id="nav-profile-btn">
        <span>${user.avatar}</span>
        <strong>${user.username}</strong>
      </button>
      <button class="btn btn-ghost btn-sm" id="nav-logout-btn">Logout</button>
    `;
    document.getElementById("nav-profile-btn")?.addEventListener("click", () => navigate("profile"));
    document.getElementById("nav-admin-btn")?.addEventListener("click", () => navigate("admin"));
    document.getElementById("nav-logout-btn")?.addEventListener("click", () => {
      window.ArenaStorage.logout();
      showToast("Logged out successfully.");
      renderNavAuth();
      navigate("home");
    });
  }

  function getLeaderboardRows(period) {
    const state = window.ArenaStorage.getState();
    const realUsers = state.users.map((u) => ({
      username: u.username,
      avatar: u.avatar,
      games: u.stats.totalGames,
      wins: u.stats.totalWins,
      period: "global"
    }));
    const seeded = window.ArenaData.SEED_LEADERBOARD.filter(
      (s) => period === "global" || s.period === period
    );
    const merged = [...realUsers, ...seeded];
    merged.sort((a, b) => b.wins - a.wins || b.games - a.games);
    return merged.slice(0, 10);
  }

  function renderHome() {
    const topEl = document.getElementById("home-top-players");
    if (topEl) {
      const top = getLeaderboardRows("global").slice(0, 4);
      topEl.innerHTML = top
        .map((p, i) => {
          const pct = p.games ? Math.round((p.wins / p.games) * 100) : 0;
          return `
            <div class="top-player-chip">
              <span style="font-size:1.5rem;">${p.avatar}</span>
              <div>
                <strong>#${i + 1} ${p.username}</strong>
                <div class="muted">${p.wins} wins · ${pct}%</div>
              </div>
            </div>`;
        })
        .join("");
    }
    const state = window.ArenaStorage.getState();
    const matchesStat = document.getElementById("home-stat-matches");
    if (matchesStat) matchesStat.textContent = `${8950 + state.matches.length}+`;
  }

  function renderDashboard() {
    const user = window.ArenaStorage.getCurrentUser();
    const state = window.ArenaStorage.getState();
    const name = user ? user.username : "Guest Challenger";
    const avatar = user ? user.avatar : "🎲";
    const stats = user ? user.stats : { totalGames: 0, totalWins: 0 };
    const badges = user ? user.achievements : [];
    const winPct = stats.totalGames ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;

    document.getElementById("dash-avatar").textContent = avatar;
    document.getElementById("dash-welcome").textContent = `Welcome, ${name}!`;
    document.getElementById("dash-player-id").textContent = `Player ID: #${user ? user.id : "GUEST"}`;
    document.getElementById("dash-total-games").textContent = stats.totalGames;
    document.getElementById("dash-total-wins").textContent = stats.totalWins;
    document.getElementById("dash-win-rate").textContent = `${winPct}%`;
    document.getElementById("dash-badges-count").textContent = `${badges.length} / ${window.ArenaData.ACHIEVEMENTS.length}`;

    const recentEl = document.getElementById("dash-recent-matches");
    if (recentEl) {
      const rec = state.matches.slice(0, 4);
      recentEl.innerHTML = rec.length
        ? rec
            .map(
              (m) => `
              <div class="list-item">
                <div>
                  <strong>${m.players.join(" vs ")}</strong>
                  <div class="muted">${m.date} · ${m.mode.toUpperCase()}</div>
                </div>
                <span class="pill pill-secondary">🏆 ${m.winner}</span>
              </div>`
            )
            .join("")
        : `<p class="muted">No matches yet. Roll the dice to start!</p>`;
    }

    const badgePrev = document.getElementById("dash-badges-preview");
    if (badgePrev) {
      badgePrev.innerHTML = window.ArenaData.ACHIEVEMENTS.slice(0, 4)
        .map((a) => {
          const unlocked = badges.includes(a.id);
          return `
            <div class="badge-card ${unlocked ? "unlocked" : ""}">
              <span class="badge-icon">${a.icon}</span>
              <div>
                <strong>${a.title}</strong>
                <div class="muted">${unlocked ? "Unlocked" : "Locked"}</div>
              </div>
            </div>`;
        })
        .join("");
    }
  }

  function renderProfile() {
    const user = window.ArenaStorage.getCurrentUser();
    const avatarEl = document.getElementById("profile-avatar-display");
    const nameEl = document.getElementById("profile-username-display");
    const idEl = document.getElementById("profile-id-display");
    const joinEl = document.getElementById("profile-joined-display");
    const editInput = document.getElementById("edit-username");

    if (!user) {
      if (nameEl) nameEl.textContent = "Guest Mode (Login to Save)";
      if (idEl) idEl.textContent = "ID: #GUEST";
      if (joinEl) joinEl.textContent = "Joined: —";
      return;
    }

    avatarEl.textContent = user.avatar;
    nameEl.textContent = user.username;
    idEl.textContent = `ID: #${user.id}`;
    joinEl.textContent = `Joined: ${user.joinedAt}`;
    if (editInput) editInput.value = user.username;

    document.getElementById("prof-ladders").textContent = user.stats.laddersClimbed || 0;
    document.getElementById("prof-snakes").textContent = user.stats.snakesBitten || 0;
    document.getElementById("prof-sixes").textContent = user.stats.sixesRolled || 0;
    const pct = user.stats.totalGames ? Math.round((user.stats.totalWins / user.stats.totalGames) * 100) : 0;
    document.getElementById("prof-winrate").textContent = `${pct}%`;

    const picker = document.getElementById("avatar-picker");
    if (picker) {
      picker.innerHTML = window.ArenaData.AVATARS.map(
        (av) => `<button type="button" class="avatar-opt ${av === user.avatar ? "selected" : ""}" data-avatar="${av}">${av}</button>`
      ).join("");
      picker.querySelectorAll(".avatar-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.ArenaStorage.updateProfile({ avatar: btn.dataset.avatar });
          renderProfile();
          renderNavAuth();
          showToast("Avatar updated!");
        });
      });
    }
  }

  function renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-tbody");
    if (!tbody) return;
    const rows = getLeaderboardRows(leaderboardPeriod);
    tbody.innerHTML = rows
      .map((p, idx) => {
        const pct = p.games ? Math.round((p.wins / p.games) * 100) : 0;
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
        return `
          <tr>
            <td><strong>${medal}</strong></td>
            <td>${p.avatar} ${p.username}</td>
            <td>${p.games}</td>
            <td><strong>${p.wins}</strong></td>
            <td>${pct}%</td>
          </tr>`;
      })
      .join("");
  }

  function renderHistory() {
    const tbody = document.getElementById("history-tbody");
    if (!tbody) return;
    const q = (document.getElementById("history-search")?.value || "").trim().toLowerCase();
    const modeFilter = document.getElementById("history-mode-filter")?.value || "all";
    const matches = window.ArenaStorage.getState().matches.filter((m) => {
      const modeOk = modeFilter === "all" || m.mode === modeFilter;
      const qOk =
        !q ||
        m.winner.toLowerCase().includes(q) ||
        m.players.some((p) => p.toLowerCase().includes(q));
      return modeOk && qOk;
    });

    tbody.innerHTML = matches.length
      ? matches
          .map(
            (m) => `
            <tr>
              <td>${m.date}</td>
              <td><span class="pill pill-accent">${m.mode}</span></td>
              <td>${m.players.join(", ")}</td>
              <td><strong>🏆 ${m.winner}</strong></td>
              <td>${m.duration}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="5" class="muted">No matching games found.</td></tr>`;
  }

  function renderAchievements() {
    const user = window.ArenaStorage.getCurrentUser();
    const coinsEl = document.getElementById("rewards-coins");
    const levelEl = document.getElementById("rewards-level");
    const xpEl = document.getElementById("rewards-xp");
    const eqEl = document.getElementById("rewards-equipped");
    const shopGrid = document.getElementById("rewards-shop-grid");
    const grid = document.getElementById("achievements-grid");

    const coins = user ? user.coins || 0 : 0;
    const xp = user ? user.xp || 0 : 0;
    const level = user ? user.level || 1 : 1;
    const unlockedSkins = user && user.unlockedSkins ? user.unlockedSkins : ["classic"];
    const equippedSkinId = user && user.equippedSkin ? user.equippedSkin : "classic";
    const eqSkinObj = window.ArenaData.REWARD_SKINS.find((s) => s.id === equippedSkinId) || window.ArenaData.REWARD_SKINS[0];

    if (coinsEl) coinsEl.textContent = `${coins} 🪙`;
    if (levelEl) levelEl.textContent = `Lv ${level}`;
    if (xpEl) xpEl.textContent = `${xp} XP`;
    if (eqEl) eqEl.textContent = `${eqSkinObj.icon} ${eqSkinObj.name}`;

    if (shopGrid) {
      shopGrid.innerHTML = window.ArenaData.REWARD_SKINS.map((skin) => {
        const owned = unlockedSkins.includes(skin.id);
        const equipped = equippedSkinId === skin.id;
        return `
          <div class="badge-card ${owned ? "unlocked" : ""}">
            <div class="badge-icon">${skin.icon}</div>
            <div style="flex:1;">
              <strong>${skin.name}</strong>
              <p class="muted">${skin.desc}</p>
              <button class="btn btn-sm ${equipped ? "btn-ghost" : owned ? "btn-secondary" : "btn-gold"} shop-action-btn"
                      data-skin="${skin.id}" ${equipped ? "disabled" : ""} style="margin-top:0.45rem;">
                ${equipped ? "Equipped ✓" : owned ? "Equip" : `Unlock (${skin.cost} 🪙)`}
              </button>
            </div>
          </div>`;
      }).join("");

      shopGrid.querySelectorAll(".shop-action-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const res = window.ArenaStorage.unlockOrEquipSkin(btn.dataset.skin);
          if (!res.ok) {
            showToast(res.error);
            return;
          }
          renderAchievements();
          showToast("Token skin updated!");
        });
      });
    }

    if (!grid) return;
    const unlocked = user ? user.achievements : [];
    grid.innerHTML = window.ArenaData.ACHIEVEMENTS.map((a) => {
      const has = unlocked.includes(a.id);
      return `
        <div class="badge-card ${has ? "unlocked" : ""}">
          <div class="badge-icon">${a.icon}</div>
          <div>
            <strong>${a.title}</strong>
            <p class="muted">${a.desc}</p>
            <span class="pill ${has ? "pill-secondary" : "pill-accent"}" style="margin-top:0.35rem;">
              ${has ? "Unlocked" : "Locked"}
            </span>
          </div>
        </div>`;
    }).join("");
  }

  function renderFriends() {
    const state = window.ArenaStorage.getState();
    const reqEl = document.getElementById("friend-requests-section");
    const listEl = document.getElementById("friends-list");

    const pending = state.friends.filter((f) => f.status === "pending");
    const accepted = state.friends.filter((f) => f.status === "accepted");

    if (reqEl) {
      reqEl.innerHTML = pending.length
        ? `<h3>Pending Requests</h3>` +
          pending
            .map(
              (f) => `
              <div class="list-item">
                <span>${f.avatar} <strong>${f.username}</strong></span>
                <div style="display:flex;gap:0.4rem;">
                  <button class="btn btn-secondary btn-sm accept-friend-btn" data-name="${f.username}">Accept</button>
                  <button class="btn btn-ghost btn-sm reject-friend-btn" data-name="${f.username}">Reject</button>
                </div>
              </div>`
            )
            .join("")
        : "";

      reqEl.querySelectorAll(".accept-friend-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const st = window.ArenaStorage.getState();
          const target = st.friends.find((x) => x.username === btn.dataset.name);
          if (target) target.status = "accepted";
          window.ArenaStorage.saveState(st);
          renderFriends();
          showToast(`${btn.dataset.name} added to Friends!`);
        });
      });

      reqEl.querySelectorAll(".reject-friend-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const st = window.ArenaStorage.getState();
          st.friends = st.friends.filter((x) => x.username !== btn.dataset.name);
          window.ArenaStorage.saveState(st);
          renderFriends();
        });
      });
    }

    if (listEl) {
      listEl.innerHTML = accepted.length
        ? accepted
            .map(
              (f) => `
              <div class="list-item">
                <div>
                  <span>${f.avatar} <strong>${f.username}</strong></span>
                  <div class="muted">${f.online ? "🟢 Online" : "⚫ Offline"}</div>
                </div>
                <button class="btn btn-primary btn-sm challenge-friend-btn" data-name="${f.username}">Invite to Match</button>
              </div>`
            )
            .join("")
        : `<p class="muted">No friends yet. Add a player by name!</p>`;

      listEl.querySelectorAll(".challenge-friend-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const user = window.ArenaStorage.getCurrentUser();
          const me = user ? user.username : "Player 1";
          navigate("game");
          window.ArenaGame.startNewMatch({
            mode: "local",
            players: [{ name: me }, { name: btn.dataset.name }]
          });
          showToast(`Match started with ${btn.dataset.name}!`);
        });
      });
    }
  }

  function renderAdmin() {
    const state = window.ArenaStorage.getState();
    document.getElementById("admin-users-count").textContent = state.users.length;
    document.getElementById("admin-online-count").textContent = state.users.filter((u) => !u.banned).length;
    document.getElementById("admin-matches-count").textContent = state.matches.length;
    document.getElementById("admin-reports-count").textContent = state.feedback.filter((f) => f.status === "open").length;

    const usersList = document.getElementById("admin-users-list");
    if (usersList) {
      usersList.innerHTML = state.users
        .map(
          (u) => `
          <div class="list-item">
            <div>
              <strong>${u.avatar} ${u.username}</strong> <span class="pill pill-accent">${u.role}</span>
              <div class="muted">${u.email} · Wins: ${u.stats.totalWins}</div>
            </div>
            ${
              u.role !== "admin"
                ? `<button class="btn btn-sm ${u.banned ? "btn-secondary" : "btn-danger"} ban-toggle-btn" data-id="${u.id}">
                    ${u.banned ? "Unban" : "Suspend"}
                  </button>`
                : `<span class="muted">Protected</span>`
            }
          </div>`
        )
        .join("");

      usersList.querySelectorAll(".ban-toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const st = window.ArenaStorage.getState();
          const target = st.users.find((x) => x.id === btn.dataset.id);
          if (target) target.banned = !target.banned;
          window.ArenaStorage.saveState(st);
          renderAdmin();
          showToast("User moderation status updated.");
        });
      });
    }

    const fbList = document.getElementById("admin-feedback-list");
    if (fbList) {
      fbList.innerHTML = state.feedback.length
        ? state.feedback
            .map(
              (f) => `
              <div class="list-item">
                <div>
                  <strong>[${f.category.toUpperCase()}] ${f.subject}</strong>
                  <div class="muted">${f.author} · ${f.createdAt} — ${f.message}</div>
                </div>
                <button class="btn btn-sm ${f.status === "resolved" ? "btn-ghost" : "btn-secondary"} resolve-fb-btn" data-id="${f.id}">
                  ${f.status === "resolved" ? "Resolved" : "Mark Done"}
                </button>
              </div>`
            )
            .join("")
        : `<p class="muted">No feedback tickets yet.</p>`;

      fbList.querySelectorAll(".resolve-fb-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const st = window.ArenaStorage.getState();
          const item = st.feedback.find((x) => x.id === btn.dataset.id);
          if (item) item.status = "resolved";
          window.ArenaStorage.saveState(st);
          renderAdmin();
        });
      });
    }
  }

  function renderLocalPlayerInputs() {
    const count = Number(document.getElementById("local-player-count")?.value || 2);
    const wrap = document.getElementById("local-player-names");
    if (!wrap) return;
    const user = window.ArenaStorage.getCurrentUser();
    const defaultFirst = user ? user.username : "Player 1";
    wrap.innerHTML = Array.from({ length: count }, (_, idx) => {
      const val = idx === 0 ? defaultFirst : `Player ${idx + 1}`;
      return `<input type="text" class="local-name-input" value="${val}" maxlength="16" placeholder="Player ${idx + 1}" />`;
    }).join("");
  }

  function renderLobby() {
    const codePill = document.getElementById("lobby-room-code-pill");
    const area = document.getElementById("lobby-waiting-area");
    const addBotBtn = document.getElementById("lobby-add-bot-btn");
    const readyBtn = document.getElementById("lobby-ready-btn");
    const startBtn = document.getElementById("lobby-start-btn");

    if (!activeLobbyRoom) {
      if (codePill) codePill.textContent = "NO ROOM";
      if (area) area.innerHTML = `<p class="muted">Create or join a room to view players and ready status.</p>`;
      if (addBotBtn) addBotBtn.disabled = true;
      if (readyBtn) readyBtn.disabled = true;
      if (startBtn) startBtn.disabled = true;
    } else {
      if (codePill) codePill.textContent = `ROOM: ${activeLobbyRoom.code} (${activeLobbyRoom.type.toUpperCase()})`;
      if (area) {
        area.innerHTML = `<div class="list-stack">` + activeLobbyRoom.players
          .map(
            (p) => `
            <div class="list-item">
              <span>${p.isBot ? "🤖" : "🎮"} <strong>${p.name}</strong></span>
              <span class="pill ${p.ready ? "pill-secondary" : "pill-gold"}">${p.ready ? "Ready" : "Waiting"}</span>
            </div>`
          )
          .join("") + `</div>`;
      }
      if (addBotBtn) addBotBtn.disabled = activeLobbyRoom.players.length >= activeLobbyRoom.maxPlayers;
      if (readyBtn) readyBtn.disabled = false;
      if (startBtn) {
        const allReady = activeLobbyRoom.players.length >= 2 && activeLobbyRoom.players.every((p) => p.ready);
        startBtn.disabled = !allReady;
      }
    }

    const pubEl = document.getElementById("public-rooms-list");
    if (pubEl) {
      pubEl.innerHTML = publicRooms
        .map(
          (r) => `
          <div class="list-item">
            <div>
              <strong>Room ${r.code}</strong>
              <div class="muted">Host: ${r.host} · ${r.players.length}/${r.maxPlayers} players</div>
            </div>
            <button class="btn btn-secondary btn-sm join-public-btn" data-code="${r.code}">Join</button>
          </div>`
        )
        .join("");

      pubEl.querySelectorAll(".join-public-btn").forEach((btn) => {
        btn.addEventListener("click", () => joinLobbyCode(btn.dataset.code));
      });
    }
  }

  function joinLobbyCode(code) {
    const clean = (code || "").trim().toUpperCase();
    if (!clean) return;
    const found = publicRooms.find((r) => r.code === clean);
    const user = window.ArenaStorage.getCurrentUser();
    const myName = user ? user.username : "Guest";

    if (found) {
      activeLobbyRoom = {
        code: found.code,
        type: "public",
        maxPlayers: found.maxPlayers,
        players: [
          ...found.players.slice(0, found.maxPlayers - 1).map((name) => ({ name, isBot: true, ready: true })),
          { name: myName, isBot: false, ready: true }
        ]
      };
      showToast(`Joined Room ${clean}!`);
    } else {
      activeLobbyRoom = {
        code: clean,
        type: "private",
        maxPlayers: 4,
        players: [
          { name: myName, isBot: false, ready: true },
          { name: "Arena Bot", isBot: true, ready: true }
        ]
      };
      showToast(`Joined Private Room ${clean} with Arena Bot!`);
    }
    renderLobby();
  }

  function startQuickBotGame() {
    const user = window.ArenaStorage.getCurrentUser();
    const me = user ? user.username : "Player 1";
    enterApp("game");
    window.ArenaGame.startNewMatch({
      mode: "single",
      players: [
        { name: me, isBot: false },
        { name: "Arena Bot", isBot: true }
      ]
    });
  }

  function refreshAllViews() {
    renderNavAuth();
    renderHome();
    renderDashboard();
    renderProfile();
    renderLeaderboard();
    renderHistory();
    renderAchievements();
    renderFriends();
    renderLobby();
    renderAdmin();
  }

  function bindEvents() {
    // Splash screen
    const progressEl = document.getElementById("splash-progress");
    let pct = 0;
    const splashTimer = setInterval(() => {
      pct += 25;
      if (progressEl) progressEl.style.width = `${Math.min(100, pct)}%`;
      if (pct >= 100) clearInterval(splashTimer);
    }, 220);

    document.getElementById("enter-arena-btn")?.addEventListener("click", () => enterApp("home"));
    document.getElementById("quick-play-splash-btn")?.addEventListener("click", () => startQuickBotGame());

    // Mobile nav toggle & route links
    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      document.getElementById("main-nav")?.classList.toggle("open");
    });

    document.querySelectorAll("[data-route]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(el.dataset.route);
      });
    });

    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => navigate(el.dataset.nav));
    });

    // Quick sound toggle
    document.getElementById("sound-quick-toggle")?.addEventListener("click", () => {
      const s = window.ArenaStorage.getSettings();
      window.ArenaStorage.updateSettings({ sfx: !s.sfx });
      applySettingsToDOM();
      showToast(!s.sfx ? "Sound Effects On 🔊" : "Sound Effects Muted 🔇");
    });

    // Auth forms
    document.getElementById("tab-login")?.addEventListener("click", () => toggleAuthTab("login"));
    document.getElementById("tab-register")?.addEventListener("click", () => toggleAuthTab("register"));
    document.querySelectorAll(".toggle-pass").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) input.type = input.type === "password" ? "text" : "password";
      });
    });

    document.getElementById("demo-player-btn")?.addEventListener("click", () => {
      window.ArenaStorage.login("player@arena.gg", "demo123");
      showToast("Signed in as PlayerOne!");
      navigate("dashboard");
    });
    document.getElementById("demo-admin-btn")?.addEventListener("click", () => {
      window.ArenaStorage.login("admin@arena.gg", "admin123");
      showToast("Signed in as ArenaAdmin!");
      navigate("admin");
    });

    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("login-email").value;
      const pw = document.getElementById("login-password").value;
      const res = window.ArenaStorage.login(id, pw);
      const err = document.getElementById("login-error");
      if (!res.ok) {
        if (err) err.textContent = res.error;
        return;
      }
      if (err) err.textContent = "";
      showToast(`Welcome back, ${res.user.username}!`);
      navigate("dashboard");
    });

    document.getElementById("register-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("reg-username").value;
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const confirm = document.getElementById("reg-confirm").value;
      const err = document.getElementById("reg-error");
      if (password !== confirm) {
        if (err) err.textContent = "Passwords do not match.";
        return;
      }
      const res = window.ArenaStorage.register({ username, email, password });
      if (!res.ok) {
        if (err) err.textContent = res.error;
        return;
      }
      if (err) err.textContent = "";
      showToast(`Account created for ${res.user.username}!`);
      navigate("dashboard");
    });

    // Mode Selection
    document.getElementById("local-player-count")?.addEventListener("change", renderLocalPlayerInputs);
    document.querySelectorAll(".start-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (mode === "single") {
          startQuickBotGame();
        } else if (mode === "local") {
          const names = [...document.querySelectorAll(".local-name-input")].map(
            (inp, idx) => inp.value.trim() || `Player ${idx + 1}`
          );
          navigate("game");
          window.ArenaGame.startNewMatch({
            mode: "local",
            players: names.map((name) => ({ name, isBot: false }))
          });
        }
      });
    });

    // Lobby controls
    document.getElementById("create-room-btn")?.addEventListener("click", () => {
      const type = document.getElementById("lobby-room-type").value;
      const maxPlayers = Number(document.getElementById("lobby-max-players").value);
      const user = window.ArenaStorage.getCurrentUser();
      const myName = user ? user.username : "HostPlayer";
      const code = "AR" + Math.floor(1000 + Math.random() * 8999);
      activeLobbyRoom = {
        code,
        type,
        maxPlayers,
        players: [{ name: myName, isBot: false, ready: true }]
      };
      if (type === "public") {
        publicRooms.unshift({ code, host: myName, maxPlayers, players: [myName] });
      }
      renderLobby();
      showToast(`Created ${type} room: ${code}`);
    });

    document.getElementById("join-room-btn")?.addEventListener("click", () => {
      joinLobbyCode(document.getElementById("join-room-code").value);
    });

    document.getElementById("lobby-add-bot-btn")?.addEventListener("click", () => {
      if (!activeLobbyRoom || activeLobbyRoom.players.length >= activeLobbyRoom.maxPlayers) return;
      const botNum = activeLobbyRoom.players.filter((p) => p.isBot).length + 1;
      activeLobbyRoom.players.push({ name: `Bot-${botNum}`, isBot: true, ready: true });
      renderLobby();
    });

    document.getElementById("lobby-ready-btn")?.addEventListener("click", () => {
      if (!activeLobbyRoom) return;
      const human = activeLobbyRoom.players.find((p) => !p.isBot);
      if (human) human.ready = !human.ready;
      renderLobby();
    });

    document.getElementById("lobby-start-btn")?.addEventListener("click", () => {
      if (!activeLobbyRoom) return;
      const roomCode = activeLobbyRoom.code;
      const players = activeLobbyRoom.players.map((p) => ({ name: p.name, isBot: p.isBot }));
      navigate("game");
      window.ArenaGame.startNewMatch({ mode: "lobby", players, roomCode });
    });

    // Game board controls
    document.getElementById("roll-dice-btn")?.addEventListener("click", () => window.ArenaGame.roll());
    document.getElementById("pause-game-btn")?.addEventListener("click", () => window.ArenaGame.togglePause(true));
    document.getElementById("resume-game-btn")?.addEventListener("click", () => window.ArenaGame.togglePause(false));
    document.getElementById("restart-game-btn")?.addEventListener("click", () => window.ArenaGame.restart());
    document.getElementById("exit-game-btn")?.addEventListener("click", () => {
      window.ArenaGame.stop();
      navigate("modes");
    });
    document.getElementById("quit-pause-btn")?.addEventListener("click", () => {
      document.getElementById("pause-modal")?.classList.add("hidden");
      window.ArenaGame.stop();
      navigate("modes");
    });

    document.getElementById("play-again-btn")?.addEventListener("click", () => window.ArenaGame.restart());
    document.getElementById("winner-dashboard-btn")?.addEventListener("click", () => {
      document.getElementById("winner-modal")?.classList.add("hidden");
      navigate("dashboard");
    });

    // Keyboard spacebar roll on game page
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && currentRoute === "game") {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
        e.preventDefault();
        const btn = document.getElementById("roll-dice-btn");
        if (btn && !btn.disabled) window.ArenaGame.roll();
      }
    });

    // Leaderboard filters
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        leaderboardPeriod = tab.dataset.period;
        renderLeaderboard();
      });
    });

    // Profile form
    document.getElementById("edit-profile-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("edit-username").value;
      const updated = window.ArenaStorage.updateProfile({ username: val });
      const msg = document.getElementById("profile-save-msg");
      if (!updated) {
        if (msg) msg.textContent = "Please login first!";
        return;
      }
      if (msg) msg.textContent = "Saved!";
      refreshAllViews();
      setTimeout(() => { if (msg) msg.textContent = ""; }, 2000);
    });

    // History filters
    document.getElementById("history-search")?.addEventListener("input", renderHistory);
    document.getElementById("history-mode-filter")?.addEventListener("change", renderHistory);

    // Friends add
    document.getElementById("friend-add-btn")?.addEventListener("click", () => {
      const inp = document.getElementById("friend-search-input");
      const name = (inp?.value || "").trim();
      if (!name) return;
      const st = window.ArenaStorage.getState();
      if (st.friends.some((f) => f.username.toLowerCase() === name.toLowerCase())) {
        showToast("Player already in your friends list!");
        return;
      }
      st.friends.push({ username: name, avatar: "🎮", online: true, status: "accepted" });
      window.ArenaStorage.saveState(st);
      if (inp) inp.value = "";
      renderFriends();
      showToast(`Added ${name} as a friend!`);
    });

    // Settings
    document.getElementById("setting-sfx")?.addEventListener("change", (e) => {
      window.ArenaStorage.updateSettings({ sfx: e.target.checked });
      applySettingsToDOM();
    });
    document.getElementById("setting-music")?.addEventListener("change", (e) => {
      window.ArenaStorage.updateSettings({ music: e.target.checked });
      window.ArenaAudio.syncMusic(e.target.checked);
    });
    document.getElementById("setting-extra-six")?.addEventListener("change", (e) => {
      window.ArenaStorage.updateSettings({ extraSix: e.target.checked });
    });
    document.getElementById("setting-theme")?.addEventListener("change", (e) => {
      window.ArenaStorage.updateSettings({ theme: e.target.value });
      applySettingsToDOM();
      showToast("Theme updated!");
    });
    document.getElementById("setting-language")?.addEventListener("change", (e) => {
      window.ArenaStorage.updateSettings({ language: e.target.value });
      applySettingsToDOM();
      showToast("Language preference saved!");
    });
    document.getElementById("reset-data-btn")?.addEventListener("click", () => {
      window.ArenaStorage.resetAll();
      applySettingsToDOM();
      refreshAllViews();
      showToast("Local arena data restored to defaults.");
    });

    // Support ticket submission
    document.getElementById("support-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const cat = document.getElementById("support-category").value;
      const subject = document.getElementById("support-subject").value;
      const message = document.getElementById("support-message").value;
      const user = window.ArenaStorage.getCurrentUser();
      const st = window.ArenaStorage.getState();
      st.feedback.unshift({
        id: "FB-" + Date.now().toString().slice(-4),
        author: user ? user.username : "Guest",
        category: cat,
        subject,
        message,
        status: "open",
        createdAt: new Date().toISOString().slice(0, 10)
      });
      window.ArenaStorage.saveState(st);
      e.target.reset();
      const msgEl = document.getElementById("support-status-msg");
      if (msgEl) msgEl.textContent = "Ticket submitted! Viewable in Admin Panel.";
      renderAdmin();
      setTimeout(() => { if (msgEl) msgEl.textContent = ""; }, 3000);
    });

    document.getElementById("claim-daily-btn")?.addEventListener("click", () => {
      const res = window.ArenaStorage.claimDailyReward();
      if (!res.ok) {
        showToast(res.error);
        return;
      }
      renderAchievements();
      showToast("Claimed +100 Arena Coins & +50 XP! 🎁");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applySettingsToDOM();
    renderLocalPlayerInputs();
    window.ArenaBoard.renderBoard();
    bindEvents();
    refreshAllViews();

    // Respect deep hash links if user opens directly with #home or #modes
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(`page-${hash}`)) {
      enterApp(hash);
    }
  });

  window.ArenaApp = { refreshAllViews, navigate };
})();
