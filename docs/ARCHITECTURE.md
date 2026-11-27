# Snake & Ladder Arena — System Architecture

## 1. High-Level Overview
Snake & Ladder Arena is structured as a dual-mode full-stack board gaming platform:
- **Zero-Setup Static Mode**: Opens directly via `index.html` using modular vanilla JS (`ArenaData`, `ArenaAudio`, `ArenaStorage`, `ArenaBoard`, `ArenaGame`, `ArenaApp`) backed by browser `localStorage`.
- **Server-Backed Multiplayer Mode**: Served by `backend/server.js` (Express + Socket.IO + optional MongoDB with JSON store fallback).

## 2. Board Coordinate System
The 10×10 board follows standard boustrophedon (zig-zag) numbering from bottom-left (`1`) to top-left (`100`):
- `rowBottom = Math.floor((cell - 1) / 10)`
- `rowTop = 9 - rowBottom`
- `col = rowBottom % 2 === 0 ? (cell - 1) % 10 : 9 - ((cell - 1) % 10)`
- SVG overlay (`1000 × 1000` viewBox) maps cell centers using `(col + 0.5) * 100` and `(rowTop + 0.5) * 100`.

## 3. Progression & Rewards Loop
1. **Authentication**: Players register/login (or use Demo Player / Admin accounts).
2. **Gameplay**: Single Player (vs Bot), Local Multiplayer (2–4 players), or Lobby Rooms.
3. **Progression**: Completing a match grants Coins (`+80` win / `+25` play), XP (`+100` win / `+35` play), and automatic Level calculation (`Math.floor(xp / 200) + 1`).
4. **Daily Bonus & Skin Shop**: Claim `+100 Coins` daily and unlock/equip token skins (`Classic Neon`, `Cyber Crown`, `Dragon Flame`, `Emerald Gem`) rendered directly on the game board.
5. **Achievements**: 6 milestones auto-evaluated after each match (`FIRST_WIN`, `FIVE_GAMES`, `TEN_WINS`, `LADDER_CLIMBER`, `LUCKY_DICE`, `CHAMPION`).

## 4. Backend Layering
- `backend/middleware/`: JWT verification (`requireAuth`, `requireAdmin`) and payload validation (`requireFields`).
- `backend/controllers/`: `authController`, `userController`, `gameController`, `adminController`.
- `backend/routes/`: Modular Express routers mounted under `/api`.
- `backend/sockets/`: Real-time Socket.IO room lifecycle and server-authoritative `roll-dice` validation.
- `backend/tests/`: Unit tests verifying RNG bounds, snake/ladder tables, exact-100 rule, and turn switching.
