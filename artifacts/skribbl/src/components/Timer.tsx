import { useEffect, useState } from "react";
import { useGame } from "@/context/GameContext";

export function Timer() {
  const { roundEndsAt, drawTime, gameState } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  if (gameState !== "playing" || !roundEndsAt) {
    return (
      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-400">—</span>
      </div>
    );
  }

  const remainingMs = Math.max(0, roundEndsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const total = drawTime;
  const progress = Math.max(0, Math.min(1, remainingMs / (total * 1000)));
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  const color =
    remaining <= 10 ? "#ef4444" : remaining <= 25 ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative w-16 h-16">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#e2e8f0" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 250ms linear, stroke 200ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-extrabold text-slate-900">{remaining}</span>
      </div>
    </div>
  );
}
