import { Crown } from "lucide-react";
import type { Player } from "@/lib/types";

interface Props {
  players: Player[];
  myId: string | null;
}

export function FinalLeaderboard({ players, myId }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const runners = sorted.slice(1);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {winner && (
        <div className="bg-gradient-to-br from-amber-300 to-amber-500 rounded-3xl p-8 text-center shadow-xl border-4 border-amber-200">
          <Crown className="w-16 h-16 text-white mx-auto mb-2 drop-shadow-lg" />
          <div className="text-sm font-bold uppercase tracking-widest text-amber-900">
            Winner
          </div>
          <div className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md mt-1">
            {winner.name}
            {winner.id === myId && " (You!)"}
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">
            {winner.score} pts
          </div>
        </div>
      )}

      {runners.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            Final Standings
          </div>
          {runners.map((p, idx) => {
            const rank = idx + 2;
            const medal =
              rank === 2 ? "bg-slate-300" : rank === 3 ? "bg-amber-700" : "bg-slate-200";
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  p.id === myId ? "bg-blue-50 border-2 border-blue-200" : "bg-slate-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${medal} text-white font-extrabold flex items-center justify-center`}
                >
                  {rank}
                </div>
                <span className="flex-1 font-bold text-slate-900">
                  {p.name}
                  {p.id === myId && (
                    <span className="ml-1 text-xs font-medium text-blue-600">
                      (you)
                    </span>
                  )}
                </span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {p.score}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
