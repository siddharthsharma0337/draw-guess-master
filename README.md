# 🎨 Doodle Duel — Draw & Guess Multiplayer Game

A real-time multiplayer drawing and guessing game inspired by Skribbl.io, built from scratch with **React**, **Socket.IO**, **Express**, and **TypeScript**.

## ✨ Features

- 🎮 **Real-time multiplayer** — Create or join private rooms with a shareable room code
- 🤖 **AI Bots** — Add bots that draw and guess automatically (host only)
- ⏱️ **Live timer** — Countdown timer per round with color-coded urgency
- 🎨 **Drawing canvas** — Full drawing tools: colors, brush sizes, eraser, clear
- 💬 **Live chat & guesses** — All guesses appear in the chat in real time
- 🏆 **Leaderboard** — Live scores + final results screen
- 🔄 **Play Again** — Host can restart the game without leaving the room
- 📱 **Responsive** — Works on desktop and mobile browsers

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, Wouter (routing) |
| Backend | Node.js, Express 5, Socket.IO 4 |
| Language | TypeScript (end-to-end) |
| Package Manager | pnpm workspaces |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+

### Install
```bash
pnpm install
```

### Run (both server + client together)
```bash
pnpm dev
```

This starts:
- **API Server** at `http://localhost:3001` (Socket.IO + REST)
- **Frontend** at `http://localhost:5173` (Vite dev server with proxy)

### Individual packages
```bash
# API server only (with hot reload)
pnpm --filter @workspace/api-server dev

# Frontend only
pnpm --filter @workspace/skribbl dev
```

## 🏗 Project Structure

```
├── artifacts/
│   ├── api-server/        # Express + Socket.IO backend
│   │   └── src/
│   │       ├── game/      # Core game logic (rooms, socket, bots, word bank)
│   │       ├── lib/       # Logger
│   │       └── routes/    # REST API routes
│   └── skribbl/           # React frontend
│       └── src/
│           ├── components/ # Canvas, toolbar, chat, scores, timer
│           ├── context/    # GameContext (socket state management)
│           ├── hooks/      # useCanvas hook
│           ├── lib/        # Socket client, types
│           └── pages/      # Home, Lobby, Game, Results
├── lib/                   # Shared workspace libraries
└── package.json           # Root workspace (run `pnpm dev` here)
```

## 🎮 How to Play

1. Go to `http://localhost:5173`
2. Enter your display name and click **Create Private Room**
3. Share the **room code** with friends (or add bots)
4. Host clicks **Start Game** when 2+ players are ready
5. Take turns drawing — others try to guess the word!
6. Earn points for correct guesses and for drawing when others guess correctly

## 📝 License

MIT
