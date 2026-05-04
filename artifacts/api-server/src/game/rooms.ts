import type { Room, Player, PlayerPublic } from "./types";

const rooms: Map<string, Room> = new Map();

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function createRoom(roomId: string, hostId: string, hostName: string): Room {
  const player: Player = {
    id: hostId,
    name: hostName,
    score: 0,
    isHost: true,
    connected: true,
    isBot: false,
  };
  const room: Room = {
    id: roomId,
    hostId,
    players: new Map([[hostId, player]]),
    rounds: 3,
    drawTime: 80,
    state: "lobby",
    currentRound: 0,
    drawerOrder: [],
    drawerIndex: -1,
    currentDrawerId: null,
    currentWord: null,
    guessedPlayers: new Set(),
    guessOrder: [],
    usedWords: new Set(),
    roundTimer: null,
    roundEndsAt: null,
    strokes: [],
    botTimers: [],
  };
  rooms.set(roomId, room);
  return room;
}

export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room?.roundTimer) {
    clearTimeout(room.roundTimer);
  }
  rooms.delete(roomId);
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function playersPublic(room: Room): PlayerPublic[] {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    isHost: p.isHost,
    connected: p.connected,
    isBot: p.isBot,
  }));
}

export function scoresMap(room: Room): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const p of room.players.values()) {
    scores[p.id] = p.score;
  }
  return scores;
}
