import { useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";

export function ChatBox() {
  const { chat, myId } = useGame();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-md p-3 space-y-1.5 min-h-0 scrollbar-thin"
    >
      {chat.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-4">
          Guesses will appear here...
        </p>
      )}
      {chat.map((m) => {
        if (m.type === "system") {
          return (
            <div
              key={m.id}
              className="text-center text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-100 rounded-lg py-1 px-2"
            >
              {m.message}
            </div>
          );
        }
        if (m.type === "correct") {
          return (
            <div
              key={m.id}
              className="text-sm bg-emerald-100 text-emerald-800 font-bold rounded-lg py-1.5 px-3"
            >
              ✓ {m.message}
            </div>
          );
        }
        const mine = m.playerId === myId;
        return (
          <div key={m.id} className="text-sm leading-snug">
            <span
              className={`font-bold ${
                mine ? "text-blue-600" : "text-slate-700"
              }`}
            >
              {m.playerName}
            </span>
            <span className="text-slate-400">: </span>
            <span className="text-slate-800">{m.message}</span>
          </div>
        );
      })}
    </div>
  );
}
