import type { Room } from "./types";
import { WORD_BANK } from "./wordBank";

const BOT_NAMES = [
  "BotBob",
  "BotZoe",
  "BotMax",
  "BotPip",
  "BotKai",
  "BotEli",
  "BotNico",
  "BotJoy",
  "BotRex",
  "BotMia",
  "BotLuna",
];

export function generateBotId(): string {
  return "bot-" + Math.random().toString(36).slice(2, 10);
}

export function pickBotName(room: Room): string {
  const used = new Set(
    Array.from(room.players.values()).map((p) => p.name.toLowerCase()),
  );
  for (const name of BOT_NAMES) {
    if (!used.has(name.toLowerCase())) return name;
  }
  for (let i = 1; i < 100; i++) {
    const candidate = `Bot${i}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
  return "Bot";
}

export function pickFakeGuess(currentWord: string): string {
  const candidates = WORD_BANK.filter(
    (w) => w.toLowerCase() !== currentWord.toLowerCase(),
  );
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx] || "thing";
}

export function clearBotTimers(room: Room) {
  for (const t of room.botTimers) clearTimeout(t);
  room.botTimers = [];
}
