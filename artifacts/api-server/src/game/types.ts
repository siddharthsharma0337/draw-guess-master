export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  isBot: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  rounds: number;
  drawTime: number;
  state: "lobby" | "playing" | "round-end" | "ended";
  currentRound: number;
  drawerOrder: string[];
  drawerIndex: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  guessedPlayers: Set<string>;
  guessOrder: string[];
  usedWords: Set<string>;
  roundTimer: NodeJS.Timeout | null;
  roundEndsAt: number | null;
  strokes: StrokeData[];
  botTimers: NodeJS.Timeout[];
}

export interface StrokeData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}

export interface PlayerPublic {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  isBot: boolean;
}
