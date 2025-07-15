# 🎮 Tic Tac Toe

Tic Tac Toe is a **real-time multiplayer web game** where two players can compete in a classic game of Xs and Os.
The app features user authentication, game room creation/joining, time-limited moves, and real-time communication via SignalR.

## 📚 Table of Contents

- [Features](#-features)
- [Built with](#-built-with)
- [Overview](#-overview)
- [How to run](#%EF%B8%8F-how-to-run)

---

## ✨ Features

- User registration and login with JWT authentication 🔐
- Refresh token logic with HttpOnly cookie support 🍪
- Create or join a game room via Game ID 🎲
- Real-time game state updates using SignalR ⚡
- 20-second move timer per player ⏱️
- Game result detection (win/lose/draw) 🎯
- Live turn updates 💬
- Profile view with user stats (wins/losses/draws) 📊
- Responsive and clean UI using React + TailwindCSS 🧩

## 🧰 Built with:

- **Frontend**: React, Tailwind CSS, Axios, Framer Motion
- **Backend**: ASP.NET Core (SignalR + gRPC + REST)
- **Auth**: JWT + Refresh Token (HttpOnly cookie)
- **Database**: Entity Framework Core (In-Memory for testing)
- **Real-time communication**: SignalR

## 📷 Overview:

**Game view**

<img src="GameHub.Client/src/assets/Screenshot 2025-07-15 at 17.43.35.png" width="600" />

## ▶️ How to run:

### 1️⃣ Clone the repository:
```bash
git clone https://github.com/UkrainetsNazar/TicTacToe.git
```

### 2️⃣ Run the backend server:
```bash
cd TicTacToe/GameHub.Server/GameHub.API
dotnet run
```
To install the .NET SDK, visit the [official .NET website](https://dotnet.microsoft.com/en-us/download).

### 3️⃣ Run the React frontend:
```bash
cd TicTacToe/GameHub.Client
npm install
npm start
```

✅ The app should now be running on http://localhost:5173 and backend on http://localhost:5216.
