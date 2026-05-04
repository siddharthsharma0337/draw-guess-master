export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  isBot: boolean;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName?: string;
  message: string;
  type: "system" | "guess" | "correct" | "self";
  scoreChange?: number;
}

export interface StrokeData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}
