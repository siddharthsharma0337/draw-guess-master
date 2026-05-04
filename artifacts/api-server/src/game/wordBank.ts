export const WORD_BANK: string[] = [
  "dog",
  "cat",
  "pizza",
  "tree",
  "house",
  "car",
  "sun",
  "guitar",
  "umbrella",
  "mountain",
  "bicycle",
  "fire",
  "crown",
  "robot",
  "dolphin",
  "elephant",
  "burger",
  "rainbow",
  "castle",
  "rocket",
  "banana",
  "shark",
  "airplane",
  "cookie",
  "snowman",
  "butterfly",
  "donut",
  "lighthouse",
  "skateboard",
  "telescope",
  "cactus",
  "penguin",
  "spaceship",
  "volcano",
  "octopus",
  "windmill",
  "dragon",
  "anchor",
  "balloon",
  "campfire",
];

export function pickRandomWord(exclude: Set<string>): string {
  const available = WORD_BANK.filter((w) => !exclude.has(w));
  const pool = available.length > 0 ? available : WORD_BANK;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx]!;
}
