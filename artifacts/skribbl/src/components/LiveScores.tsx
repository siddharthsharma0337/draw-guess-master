import { Crown, Pencil, CheckCircle2 } from "lucide-react";
import { useGame } from "@/context/GameContext";

export function LiveScores() {
  const { players, drawerId, hostId, myId } = useGame();
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl shadow-md p-3 space-y-1.5">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1 pb-1">
        Players
      </div>
      {sorted.map((p, i) => {
        const isMe = p.id === myId;
        const isDrawer = p.id === drawerId;
        const isHost = p.id === hostId;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
              isMe ? "bg-blue-50 border-2 border-blue-200" : "bg-slate-50"
            } ${!p.connected ? "opacity-50" : ""}`}
          >
            <span className="w-6 text-sm font-bold text-slate-400">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 truncate">
                  {p.name}
                  {isMe && (
                    <span className="ml-1 text-xs font-medium text-blue-600">
                      (you)
                    </span>
                  )}
                </span>
                {isHost && (
                  <Crown
                    className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
                    aria-label="Host"
                  />
                )}
                {isDrawer && (
                  <Pencil
                    className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                    aria-label="Drawing"
                  />
                )}
              </div>
            </div>
            <span className="font-extrabold text-slate-900 tabular-nums">
              {p.score}
            </span>
            {isDrawer && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}
