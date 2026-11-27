# Snake & Ladder Arena — REST API & Socket.IO Specification

## REST Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — `{ username, email, password }` → `201 { token, user }`
- `POST /api/auth/login` — `{ email, password }` → `200 { token, user }`
- `GET /api/auth/me` — Bearer token required → `200 { user }`

### Users, Rewards & Shop (`/api/users`)
- `GET /api/users/profile` — Bearer token required
- `PUT /api/users/profile` — Update `username` / `avatar`
- `POST /api/users/rewards/daily` — Claim daily `+100` coins & `+50` XP
- `GET /api/users/shop` — List unlockable token skins
- `POST /api/users/shop/equip` — `{ skinId }` unlock (if affordable) & equip token skin
- `GET /api/users/friends` — List user friendships
- `POST /api/users/friends/request` — `{ username }` send friend request

### Games, Leaderboard & History (`/api`)
- `GET /api/boards` — Retrieve Classic & Cyber Gauntlet board snake/ladder tables
- `GET /api/leaderboard` — Top 20 players sorted by wins & games
- `GET /api/matches/history` — Recent 50 matches
- `POST /api/games/create` — Create REST game room
- `POST /api/games/join` — `{ code, playerName }` join room
- `GET /api/games/:id` — Get room state
- `POST /api/games/:id/move` — Execute server-authoritative dice roll & move

### Support & Admin (`/api`)
- `POST /api/feedback` — Submit support/bug/feedback ticket
- `GET /api/admin/stats` — Admin only: platform KPIs
- `GET /api/admin/users` — Admin only: list users
- `PATCH /api/admin/users/:id/ban` — Admin only: suspend/unban user
- `GET /api/admin/feedback` — Admin only: list support tickets
- `PATCH /api/admin/feedback/:id` — Admin only: mark ticket resolved

## Socket.IO Events
- Client → Server: `create-room`, `join-room`, `player-ready`, `roll-dice`
- Server → Client: `room-state`, `game-update`, `game-winner`, `player-disconnected`, `error-message`
