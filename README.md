# 🐍 Snake & Ladder Arena

A simple, unique, zero-setup **Dark Neon Snake & Ladder Gaming Website** inspired by the 15-module Snake & Ladder Arena blueprint.

## ✨ What's Included

- **15 Integrated Views**:
  1. **Splash Screen** — Animated neon logo, loader, and instant launch
  2. **Home Page** — Hero showcase, 3D mini-board art, features & top-4 leaderboard preview
  3. **Login & Registration** — Validation, show/hide password, demo Player & Admin quick sign-in
  4. **Player Dashboard** — Games, wins, win percentage, recent matches, and badge preview
  5. **Game Lobby** — Create Public/Private room codes, join rooms, add AI bots, ready toggle
  6. **Game Mode Selection** — Single Player vs AI Bot, Local Multiplayer (2–4 players), Room Arena
  7. **Main 10×10 Game Board** — Exact 1–100 zig-zag grid, glowing SVG ladders & curved snakes, animated 9-pip dice, step-by-step hopping tokens, timer, pause/restart, and confetti winner modal
  8. **Leaderboard** — Global, Weekly, and Monthly rankings
  9. **My Profile** — Custom display name, avatar picker, and lifetime snake/ladder/six stats
  10. **Game History** — Searchable and filterable match logs
  11. **Achievements** — 6 auto-unlocking neon badges
  12. **Friends System** — Add friends, accept/reject requests, and launch quick challenges
  13. **Settings** — Synthesized SFX toggle, ambient synth music, Extra-Turn-on-6 rule toggle, 3 visual themes (*Dark Neon Cyber*, *Emerald Jungle*, *Royal Gold*), and English/Tenglish labels
  14. **Admin Panel** — User moderation (suspend/unban) and support/feedback ticket management
  15. **How to Play & Support** — Rules, snake/ladder coordinate chips, and ticket submission

## 🚀 How to Run

### Option 1: Instant Zero-Setup (Static Frontend)
No installation or build step is required:
1. Open `index.html` directly in Chrome, Edge, or Firefox (double-click it), **or**
2. Serve the folder with any static server (e.g., VS Code Live Server or `npx serve .`).

### Option 2: Full-Stack Server (Node.js + Express + Socket.IO + MongoDB optional)
```bash
cd backend
npm install
npm start
```
Then open `http://localhost:5000` in your browser.
- If `MONGO_URI` is omitted in `backend/.env`, the server automatically uses a local JSON fallback store (`backend/data/store.json`).

### Demo Credentials
- **Player Demo**: `player@arena.gg` / `demo123` (or click **Player Demo** on the Login page)
- **Admin Demo**: `admin@arena.gg` / `admin123` (or click **Admin Demo** on the Login page)

## 📁 File Structure

```text
snake lader/
├── index.html          # Main application shell & all 15 views
├── package.json        # Root scripts (start / build)
├── css/
│   └── styles.css      # Dark Neon, Emerald Jungle, and Royal Gold themes + 3D dice & board
├── js/
│   ├── data.js         # 10x10 zig-zag coordinates, snakes/ladders, achievements, seed data
│   ├── audio.js        # Procedural Web Audio API SFX & optional ambient synth
│   ├── storage.js      # localStorage persistence for auth, matches, friends, settings, tickets
│   ├── board.js        # 10x10 grid builder, SVG snakes/ladders renderer, tokens & confetti
│   ├── game.js         # Turn engine, AI bot, step-by-step animations, exact-100 & bonus-6 rules
│   └── app.js          # Hash router & UI controllers for all 15 modules
├── backend/
│   ├── config/db.js    # MongoDB connection with JSON fallback
│   ├── models/schemas.js # Mongoose schemas (User, Game, Match, Friendship, Achievement, Feedback)
│   ├── utils/gameEngine.js # Server-authoritative dice & movement logic
│   ├── server.js       # Express REST APIs, Socket.IO real-time rooms, & static hosting
│   ├── .env.example    # Environment variable template
│   └── package.json    # Backend dependencies
└── README.md
```
