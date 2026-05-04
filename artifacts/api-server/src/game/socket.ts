import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { logger } from "../lib/logger";
import {
  createRoom,
  deleteRoom,
  generateRoomCode,
  getRoom,
  playersPublic,
  scoresMap,
} from "./rooms";
import {
  clearBotTimers,
  generateBotId,
  pickBotName,
  pickFakeGuess,
} from "./bots";
import type { Room, StrokeData } from "./types";
import { pickRandomWord } from "./wordBank";

interface JoinRoomPayload {
  roomId?: string;
  playerName: string;
  create?: boolean;
}

interface GameStartPayload {
  rounds?: number;
  drawTime?: number;
}

interface SubmitGuessPayload {
  guess: string;
}

function maskWord(word: string): string {
  return word
    .split("")
    .map((c) => (c === " " ? " " : "_"))
    .join(" ");
}

function clearRoundTimer(room: Room) {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }
}

function calculateGuessScore(position: number): number {
  return Math.max(10, 100 - position * 10);
}

export function setupSocket(server: HttpServer): SocketIOServer {
  const corsOrigin = process.env.CORS_ORIGIN ?? "*";
  const io = new SocketIOServer(server, {
    cors: { origin: corsOrigin, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    let joinedRoomId: string | null = null;

    socket.on("join-room", (payload: JoinRoomPayload, ack?: (res: unknown) => void) => {
      try {
        const playerName = (payload?.playerName || "").trim().slice(0, 20);
        if (!playerName) {
          ack?.({ ok: false, error: "Display name is required" });
          return;
        }

        let roomId = (payload?.roomId || "").trim().toUpperCase();
        let room: Room | undefined;

        if (payload?.create) {
          roomId = generateRoomCode();
          room = createRoom(roomId, socket.id, playerName);
        } else {
          if (!roomId) {
            ack?.({ ok: false, error: "Room code is required" });
            return;
          }
          room = getRoom(roomId);
          if (!room) {
            ack?.({ ok: false, error: "Room not found" });
            return;
          }
          if (room.state !== "lobby") {
            ack?.({ ok: false, error: "Game already in progress" });
            return;
          }
          if (room.players.size >= 12) {
            ack?.({ ok: false, error: "Room is full" });
            return;
          }
          if (
            Array.from(room.players.values()).some(
              (p) => p.name.toLowerCase() === playerName.toLowerCase(),
            )
          ) {
            ack?.({ ok: false, error: "Name is already taken in this room" });
            return;
          }
          room.players.set(socket.id, {
            id: socket.id,
            name: playerName,
            score: 0,
            isHost: false,
            connected: true,
            isBot: false,
          });
        }

        socket.join(roomId);
        joinedRoomId = roomId;

        ack?.({ ok: true, roomId, playerId: socket.id });

        io.to(roomId).emit("player-joined", {
          players: playersPublic(room),
          hostId: room.hostId,
          rounds: room.rounds,
          drawTime: room.drawTime,
        });
      } catch (err) {
        logger.error({ err }, "join-room failed");
        ack?.({ ok: false, error: "Internal error" });
      }
    });

    socket.on(
      "update-settings",
      (payload: { rounds?: number; drawTime?: number }) => {
        if (!joinedRoomId) return;
        const room = getRoom(joinedRoomId);
        if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
        if (typeof payload.rounds === "number" && payload.rounds >= 1 && payload.rounds <= 10) {
          room.rounds = Math.floor(payload.rounds);
        }
        if (
          typeof payload.drawTime === "number" &&
          payload.drawTime >= 30 &&
          payload.drawTime <= 180
        ) {
          room.drawTime = Math.floor(payload.drawTime);
        }
        io.to(room.id).emit("settings-updated", {
          rounds: room.rounds,
          drawTime: room.drawTime,
        });
      },
    );

    socket.on("game-start", (payload: GameStartPayload = {}) => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      if (room.players.size < 2) {
        socket.emit("error-message", { message: "Need at least 2 players to start" });
        return;
      }
      if (typeof payload.rounds === "number" && payload.rounds >= 1 && payload.rounds <= 10) {
        room.rounds = Math.floor(payload.rounds);
      }
      if (
        typeof payload.drawTime === "number" &&
        payload.drawTime >= 30 &&
        payload.drawTime <= 180
      ) {
        room.drawTime = Math.floor(payload.drawTime);
      }

      room.state = "playing";
      room.currentRound = 0;
      room.drawerIndex = -1;
      room.drawerOrder = Array.from(room.players.keys());
      room.usedWords = new Set();
      for (const p of room.players.values()) {
        p.score = 0;
      }

      io.to(room.id).emit("game-start", {
        rounds: room.rounds,
        drawTime: room.drawTime,
      });

      startNextTurn(room);
    });

    socket.on("draw-stroke", (payload: StrokeData) => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.state !== "playing") return;
      if (room.currentDrawerId !== socket.id) return;
      if (
        typeof payload?.x0 !== "number" ||
        typeof payload?.y0 !== "number" ||
        typeof payload?.x1 !== "number" ||
        typeof payload?.y1 !== "number" ||
        typeof payload?.color !== "string" ||
        typeof payload?.size !== "number"
      ) {
        return;
      }
      const stroke: StrokeData = {
        x0: payload.x0,
        y0: payload.y0,
        x1: payload.x1,
        y1: payload.y1,
        color: payload.color,
        size: payload.size,
      };
      room.strokes.push(stroke);
      socket.to(room.id).emit("stroke-broadcast", stroke);
    });

    socket.on("canvas-clear", () => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.state !== "playing") return;
      if (room.currentDrawerId !== socket.id) return;
      room.strokes = [];
      io.to(room.id).emit("canvas-cleared", {});
    });

    socket.on("submit-guess", (payload: SubmitGuessPayload) => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.state !== "playing") return;
      if (room.currentDrawerId === socket.id) return; // drawer can't guess
      const player = room.players.get(socket.id);
      if (!player) return;
      const guess = (payload?.guess || "").trim();
      if (!guess) return;

      const word = room.currentWord;
      if (!word) return;

      // Already guessed correctly
      if (room.guessedPlayers.has(socket.id)) return;

      const isCorrect = guess.toLowerCase() === word.toLowerCase();

      if (isCorrect) {
        room.guessedPlayers.add(socket.id);
        room.guessOrder.push(socket.id);
        const pts = calculateGuessScore(room.guessOrder.length - 1);
        player.score += pts;

        io.to(room.id).emit("guess-result", {
          playerId: player.id,
          playerName: player.name,
          correct: true,
          message: `${player.name} guessed the word!`,
          scores: scoresMap(room),
        });

        const totalGuessers = Array.from(room.players.keys()).filter(
          (id) => id !== room.currentDrawerId,
        ).length;

        if (room.guessedPlayers.size >= totalGuessers && totalGuessers > 0) {
          endRound(room);
        }
      } else {
        io.to(room.id).emit("guess-result", {
          playerId: player.id,
          playerName: player.name,
          correct: false,
          message: guess,
          scores: scoresMap(room),
        });
      }
    });

    socket.on("add-bot", () => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      if (room.players.size >= 12) {
        socket.emit("error-message", { message: "Room is full" });
        return;
      }
      const botId = generateBotId();
      const name = pickBotName(room);
      room.players.set(botId, {
        id: botId,
        name,
        score: 0,
        isHost: false,
        connected: true,
        isBot: true,
      });
      io.to(room.id).emit("player-joined", {
        players: playersPublic(room),
        hostId: room.hostId,
        rounds: room.rounds,
        drawTime: room.drawTime,
      });
    });

    socket.on("remove-bot", (payload: { botId: string }) => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.hostId !== socket.id || room.state !== "lobby") return;
      const target = room.players.get(payload?.botId);
      if (!target?.isBot) return;
      room.players.delete(target.id);
      io.to(room.id).emit("player-left", {
        playerId: target.id,
        players: playersPublic(room),
        hostId: room.hostId,
      });
    });

    socket.on("play-again", () => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room || room.hostId !== socket.id) return;
      if (room.state !== "ended") return;
      resetRoomToLobby(room.id);
      io.to(room.id).emit("returned-to-lobby", {
        players: playersPublic(room),
        hostId: room.hostId,
        rounds: room.rounds,
        drawTime: room.drawTime,
      });
    });

    socket.on("disconnect", () => {
      if (!joinedRoomId) return;
      const room = getRoom(joinedRoomId);
      if (!room) return;
      const wasDrawer = room.currentDrawerId === socket.id;
      const wasHost = room.hostId === socket.id;
      room.players.delete(socket.id);

      if (room.players.size === 0) {
        clearBotTimers(room);
        deleteRoom(room.id);
        return;
      }

      // If only bots remain, tear down the room
      const humans = Array.from(room.players.values()).filter((p) => !p.isBot);
      if (humans.length === 0) {
        clearBotTimers(room);
        clearRoundTimer(room);
        deleteRoom(room.id);
        return;
      }

      // Reassign host to a human
      if (wasHost) {
        const newHost = humans[0]!;
        newHost.isHost = true;
        room.hostId = newHost.id;
      }

      // Remove from drawer order
      room.drawerOrder = room.drawerOrder.filter((id) => id !== socket.id);

      io.to(room.id).emit("player-left", {
        playerId: socket.id,
        players: playersPublic(room),
        hostId: room.hostId,
      });

      if (wasDrawer && room.state === "playing") {
        endRound(room);
      } else if (room.state === "playing") {
        // If only the drawer remains, end round
        const guessers = Array.from(room.players.keys()).filter(
          (id) => id !== room.currentDrawerId,
        );
        if (guessers.length === 0) {
          endRound(room);
        } else {
          // Check if all remaining guessers have guessed
          const allGuessed = guessers.every((id) => room.guessedPlayers.has(id));
          if (allGuessed) {
            endRound(room);
          }
        }
      }
    });
  });

  function startNextTurn(room: Room) {
    clearRoundTimer(room);
    room.strokes = [];
    room.guessedPlayers = new Set();
    room.guessOrder = [];

    // Advance drawer; if we wrapped around, increment round
    room.drawerIndex += 1;
    if (room.drawerIndex >= room.drawerOrder.length) {
      room.currentRound += 1;
      room.drawerIndex = 0;
      // Refresh drawer order for new round in case players left
      room.drawerOrder = Array.from(room.players.keys());
      if (room.drawerOrder.length === 0) {
        endGame(room);
        return;
      }
    } else {
      if (room.currentRound === 0) {
        room.currentRound = 1;
      }
    }

    if (room.currentRound > room.rounds) {
      endGame(room);
      return;
    }

    const drawerId = room.drawerOrder[room.drawerIndex];
    if (!drawerId || !room.players.has(drawerId)) {
      // Try the next one
      startNextTurn(room);
      return;
    }

    room.currentDrawerId = drawerId;
    const word = pickRandomWord(room.usedWords);
    room.usedWords.add(word);
    room.currentWord = word;
    room.roundEndsAt = Date.now() + room.drawTime * 1000;

    const drawer = room.players.get(drawerId)!;

    io.to(room.id).emit("new-round", {
      drawerId,
      drawerName: drawer.name,
      wordLength: word.length,
      maskedWord: maskWord(word),
      roundNumber: room.currentRound,
      totalRounds: room.rounds,
      drawTime: room.drawTime,
      roundEndsAt: room.roundEndsAt,
    });

    io.to(drawerId).emit("secret-word", { word });

    room.roundTimer = setTimeout(() => {
      endRound(room);
    }, room.drawTime * 1000);

    scheduleBotsForRound(room);
  }

  function scheduleBotsForRound(room: Room) {
    clearBotTimers(room);

    const drawer = room.currentDrawerId
      ? room.players.get(room.currentDrawerId)
      : null;
    if (drawer?.isBot) {
      scheduleBotDrawing(room);
    }

    for (const player of room.players.values()) {
      if (player.isBot && player.id !== room.currentDrawerId) {
        scheduleBotGuessing(room, player.id);
      }
    }
  }

  function scheduleBotGuessing(room: Room, botId: string) {
    const attempt = () => {
      if (room.state !== "playing") return;
      if (!room.players.has(botId)) return;
      if (room.guessedPlayers.has(botId)) return;
      const word = room.currentWord;
      if (!word || !room.roundEndsAt) return;

      const totalMs = room.drawTime * 1000;
      const remainingMs = Math.max(0, room.roundEndsAt - Date.now());
      const progress = Math.min(1, 1 - remainingMs / totalMs);
      // Ramp from ~5% at start to ~75% near the end
      const correctChance = 0.05 + progress * 0.7;
      const willGuessCorrect = Math.random() < correctChance;

      const bot = room.players.get(botId)!;

      if (willGuessCorrect) {
        room.guessedPlayers.add(botId);
        room.guessOrder.push(botId);
        const pts = calculateGuessScore(room.guessOrder.length - 1);
        bot.score += pts;
        io.to(room.id).emit("guess-result", {
          playerId: botId,
          playerName: bot.name,
          correct: true,
          message: `${bot.name} guessed the word!`,
          scores: scoresMap(room),
        });
        const totalGuessers = Array.from(room.players.keys()).filter(
          (id) => id !== room.currentDrawerId,
        ).length;
        if (room.guessedPlayers.size >= totalGuessers && totalGuessers > 0) {
          endRound(room);
          return;
        }
      } else {
        const fakeGuess = pickFakeGuess(word);
        io.to(room.id).emit("guess-result", {
          playerId: botId,
          playerName: bot.name,
          correct: false,
          message: fakeGuess,
          scores: scoresMap(room),
        });

        const nextDelay = 3500 + Math.random() * 5000;
        const nextTimer = setTimeout(attempt, nextDelay);
        room.botTimers.push(nextTimer);
      }
    };

    const initialDelay = 4500 + Math.random() * 7000;
    const t = setTimeout(attempt, initialDelay);
    room.botTimers.push(t);
  }

  function scheduleBotDrawing(room: Room) {
    const palette = [
      "#0f172a",
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#a855f7",
      "#ec4899",
    ];
    const color = palette[Math.floor(Math.random() * palette.length)]!;
    const size = 6;
    const startDelay = 800;
    const drawDuration = Math.min(7000, room.drawTime * 1000 * 0.5);
    const totalSegments = 50;
    const intervalMs = drawDuration / totalSegments;

    let lastX = 250 + Math.random() * 300;
    let lastY = 180 + Math.random() * 220;

    for (let i = 0; i < totalSegments; i++) {
      const t = setTimeout(() => {
        if (room.state !== "playing") return;
        if (
          !room.currentDrawerId ||
          !room.players.get(room.currentDrawerId)?.isBot
        ) {
          return;
        }
        const nextX = Math.max(
          20,
          Math.min(780, lastX + (Math.random() - 0.5) * 70),
        );
        const nextY = Math.max(
          20,
          Math.min(580, lastY + (Math.random() - 0.5) * 70),
        );
        const stroke: StrokeData = {
          x0: lastX,
          y0: lastY,
          x1: nextX,
          y1: nextY,
          color,
          size,
        };
        room.strokes.push(stroke);
        io.to(room.id).emit("stroke-broadcast", stroke);
        lastX = nextX;
        lastY = nextY;
      }, startDelay + i * intervalMs);
      room.botTimers.push(t);
    }
  }

  function endRound(room: Room) {
    if (room.state !== "playing") return;
    clearRoundTimer(room);
    clearBotTimers(room);
    room.state = "round-end";

    // Award drawer points
    const totalGuessers = Array.from(room.players.keys()).filter(
      (id) => id !== room.currentDrawerId,
    ).length;
    const correctCount = room.guessOrder.length;
    const drawer = room.currentDrawerId
      ? room.players.get(room.currentDrawerId)
      : null;

    if (drawer && totalGuessers > 0 && correctCount > 0) {
      drawer.score += correctCount === totalGuessers ? 80 : 50;
    }

    const word = room.currentWord || "";

    io.to(room.id).emit("round-end", {
      word,
      scores: scoresMap(room),
      players: playersPublic(room),
    });

    setTimeout(() => {
      const stillExists = getRoom(room.id);
      if (!stillExists) return;
      if (room.players.size === 0) {
        deleteRoom(room.id);
        return;
      }

      // Check if game should end (all rounds complete)
      const isLastDrawer = room.drawerIndex >= room.drawerOrder.length - 1;
      if (room.currentRound >= room.rounds && isLastDrawer) {
        endGame(room);
        return;
      }

      room.state = "playing";
      startNextTurn(room);
    }, 4000);
  }

  function endGame(room: Room) {
    clearRoundTimer(room);
    clearBotTimers(room);
    room.state = "ended";
    room.currentDrawerId = null;
    room.currentWord = null;

    const finalScores = playersPublic(room).sort((a, b) => b.score - a.score);

    io.to(room.id).emit("game-end", { finalScores });
  }

  return io;
}

export function resetRoomToLobby(roomId: string): boolean {
  const room = getRoom(roomId);
  if (!room) return false;
  if (room.roundTimer) clearTimeout(room.roundTimer);
  room.roundTimer = null;
  for (const t of room.botTimers) clearTimeout(t);
  room.botTimers = [];
  room.state = "lobby";
  room.currentRound = 0;
  room.drawerIndex = -1;
  room.drawerOrder = [];
  room.currentDrawerId = null;
  room.currentWord = null;
  room.guessedPlayers = new Set();
  room.guessOrder = [];
  room.usedWords = new Set();
  room.strokes = [];
  for (const p of room.players.values()) {
    p.score = 0;
  }
  return true;
}
