(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function toSvgXY(cell) {
    const { xPct, yPct } = window.ArenaData.getCellCoords(cell);
    return { x: xPct * 10, y: yPct * 10 };
  }

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  function drawLadders(svg) {
    Object.entries(window.ArenaData.LADDERS).forEach(([fromStr, to]) => {
      const from = Number(fromStr);
      const a = toSvgXY(from);
      const b = toSvgXY(to);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const nx = (-dy / len) * 14;
      const ny = (dx / len) * 14;

      const group = createSvgEl("g", { opacity: "0.92" });
      // Two side rails
      group.appendChild(createSvgEl("line", {
        x1: a.x + nx, y1: a.y + ny, x2: b.x + nx, y2: b.y + ny,
        stroke: "#00C9A7", "stroke-width": 7, "stroke-linecap": "round"
      }));
      group.appendChild(createSvgEl("line", {
        x1: a.x - nx, y1: a.y - ny, x2: b.x - nx, y2: b.y - ny,
        stroke: "#00C9A7", "stroke-width": 7, "stroke-linecap": "round"
      }));

      // Rungs along the ladder
      const steps = Math.max(4, Math.floor(len / 34));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const cx = a.x + dx * t;
        const cy = a.y + dy * t;
        group.appendChild(createSvgEl("line", {
          x1: cx + nx, y1: cy + ny, x2: cx - nx, y2: cy - ny,
          stroke: "#FFC857", "stroke-width": 5, "stroke-linecap": "round"
        }));
      }
      svg.appendChild(group);
    });
  }

  function drawSnakes(svg) {
    const palette = ["#FF5C77", "#F97316", "#EC4899", "#E11D48", "#FB7185"];
    Object.entries(window.ArenaData.SNAKES).forEach(([fromStr, to], index) => {
      const head = toSvgXY(Number(fromStr));
      const tail = toSvgXY(to);
      const dx = tail.x - head.x;
      const dy = tail.y - head.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = (-dy / len) * 42;
      const py = (dx / len) * 42;

      const c1x = head.x + dx * 0.33 + px;
      const c1y = head.y + dy * 0.33 + py;
      const c2x = head.x + dx * 0.66 - px;
      const c2y = head.y + dy * 0.66 - py;
      const color = palette[index % palette.length];
      const d = `M ${head.x} ${head.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tail.x} ${tail.y}`;

      const g = createSvgEl("g", { opacity: "0.94" });
      g.appendChild(createSvgEl("path", {
        d, fill: "none", stroke: "rgba(0,0,0,0.45)", "stroke-width": 17, "stroke-linecap": "round"
      }));
      g.appendChild(createSvgEl("path", {
        d, fill: "none", stroke: color, "stroke-width": 11, "stroke-linecap": "round"
      }));
      g.appendChild(createSvgEl("path", {
        d, fill: "none", stroke: "#FFE4E9", "stroke-width": 3, "stroke-dasharray": "8 12", "stroke-linecap": "round"
      }));

      // Serpent head
      g.appendChild(createSvgEl("circle", { cx: head.x, cy: head.y, r: 14, fill: color, stroke: "#fff", "stroke-width": 2.5 }));
      g.appendChild(createSvgEl("circle", { cx: head.x - 4.5, cy: head.y - 3, r: 2.5, fill: "#10152B" }));
      g.appendChild(createSvgEl("circle", { cx: head.x + 4.5, cy: head.y - 3, r: 2.5, fill: "#10152B" }));
      svg.appendChild(g);
    });
  }

  window.ArenaBoard = {
    renderBoard() {
      const boardEl = document.getElementById("game-board");
      const overlayEl = document.getElementById("board-overlay");
      if (!boardEl || !overlayEl) return;

      boardEl.innerHTML = "";
      overlayEl.innerHTML = "";

      for (let rowTop = 0; rowTop < 10; rowTop++) {
        const rowBottom = 9 - rowTop;
        for (let col = 0; col < 10; col++) {
          const offset = rowBottom % 2 === 0 ? col + 1 : 10 - col;
          const cellNum = rowBottom * 10 + offset;
          const cell = document.createElement("div");
          const isEven = (rowTop + col) % 2 === 0;
          cell.className = `board-cell ${isEven ? "even" : "odd"}`;
          if (cellNum === 1) cell.classList.add("cell-1");
          if (cellNum === 100) cell.classList.add("cell-100");
          if (window.ArenaData.LADDERS[cellNum]) cell.classList.add("cell-ladder");
          if (window.ArenaData.SNAKES[cellNum]) cell.classList.add("cell-snake");

          const numSpan = document.createElement("span");
          numSpan.textContent = cellNum;
          cell.appendChild(numSpan);

          if (cellNum === 100) {
            const tag = document.createElement("span");
            tag.className = "cell-tag";
            tag.textContent = "🏆";
            cell.appendChild(tag);
          } else if (window.ArenaData.LADDERS[cellNum]) {
            const tag = document.createElement("span");
            tag.className = "cell-tag";
            tag.textContent = `↑${window.ArenaData.LADDERS[cellNum]}`;
            cell.appendChild(tag);
          } else if (window.ArenaData.SNAKES[cellNum]) {
            const tag = document.createElement("span");
            tag.className = "cell-tag";
            tag.textContent = `↓${window.ArenaData.SNAKES[cellNum]}`;
            cell.appendChild(tag);
          }
          boardEl.appendChild(cell);
        }
      }

      drawLadders(overlayEl);
      drawSnakes(overlayEl);
    },

    renderTokens(players, activeIndex, glideMode = false) {
      const layer = document.getElementById("tokens-layer");
      if (!layer) return;

      // Group players by position so overlapping tokens fan out cleanly
      const groups = {};
      players.forEach((p, i) => {
        const key = p.position;
        if (!groups[key]) groups[key] = [];
        groups[key].push(i);
      });

      const offsets = [
        { dx: -1.6, dy: -1.6 },
        { dx: 1.6, dy: -1.6 },
        { dx: -1.6, dy: 1.6 },
        { dx: 1.6, dy: 1.6 }
      ];

      players.forEach((player, idx) => {
        let tokenEl = layer.querySelector(`[data-player-idx="${idx}"]`);
        if (!tokenEl) {
          tokenEl = document.createElement("div");
          tokenEl.className = "board-token";
          tokenEl.dataset.playerIdx = String(idx);
          tokenEl.textContent = player.shortLabel || `P${idx + 1}`;
          tokenEl.style.background = player.color;
          layer.appendChild(tokenEl);
        }

        tokenEl.classList.toggle("active-turn", idx === activeIndex);
        tokenEl.classList.toggle("glide", glideMode);

        const coords = window.ArenaData.getCellCoords(player.position);
        const bucket = groups[player.position] || [idx];
        const slot = bucket.indexOf(idx);
        const shift = bucket.length > 1 ? offsets[slot % offsets.length] : { dx: 0, dy: 0 };

        tokenEl.style.left = `${coords.xPct + shift.dx}%`;
        tokenEl.style.top = `${coords.yPct + shift.dy}%`;
      });
    },

    clearTokens() {
      const layer = document.getElementById("tokens-layer");
      if (layer) layer.innerHTML = "";
    },

    launchConfetti() {
      const canvas = document.getElementById("confetti-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ["#7357FF", "#00C9A7", "#FFC857", "#FF5C77", "#FFFFFF"];
      const particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vy: 2.5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360
      }));

      let frames = 0;
      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += 4;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });
        frames++;
        if (frames < 180) requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      tick();
    }
  };
})();
