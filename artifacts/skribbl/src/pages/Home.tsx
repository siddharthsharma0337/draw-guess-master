import { useState } from "react";
import { useLocation } from "wouter";
import { Palette, Loader2 } from "lucide-react";
import { useGame } from "@/context/GameContext";

export default function Home() {
  const { joinOrCreate, myName, setMyName, connected } = useGame();
  const [, navigate] = useLocation();
  const [name, setName] = useState(myName);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);

  const trimmed = name.trim();
  const codeUpper = code.trim().toUpperCase();

  const handleCreate = async () => {
    setError("");
    if (!trimmed) {
      setError("Enter a display name");
      return;
    }
    setLoading("create");
    setMyName(trimmed);
    const res = await joinOrCreate(trimmed, null, true);
    setLoading(null);
    if (!res.ok) {
      setError(res.error || "Failed to create room");
      return;
    }
    if (res.roomId) navigate(`/lobby/${res.roomId}`);
  };

  const handleJoin = async () => {
    setError("");
    if (!trimmed) {
      setError("Enter a display name");
      return;
    }
    if (!codeUpper) {
      setError("Enter a room code");
      return;
    }
    setLoading("join");
    setMyName(trimmed);
    const res = await joinOrCreate(trimmed, codeUpper, false);
    setLoading(null);
    if (!res.ok) {
      setError(res.error || "Failed to join room");
      return;
    }
    if (res.roomId) navigate(`/lobby/${res.roomId}`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-3">
            <Palette className="w-9 h-9 text-fuchsia-500" />
          </div>
          <h1 className="text-5xl font-extrabold text-white drop-shadow-md tracking-tight">
            Doodle Duel
          </h1>
          <p className="text-white/90 mt-1 font-bold">
            Draw. Guess. Win.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="Your nickname"
              className="w-full h-12 px-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-fuchsia-500 focus:bg-white focus:outline-none font-bold text-slate-900 text-lg"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!connected || loading !== null}
            className="w-full h-13 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading === "create" && <Loader2 className="w-5 h-5 animate-spin" />}
            Create Private Room
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              or
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ROOM CODE"
              className="flex-1 h-12 px-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-fuchsia-500 focus:bg-white focus:outline-none font-extrabold text-slate-900 text-lg tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={!connected || loading !== null}
              className="px-5 h-12 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-extrabold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading === "join" && <Loader2 className="w-4 h-4 animate-spin" />}
              Join
            </button>
          </div>

          {error && (
            <div className="text-sm font-bold text-rose-600 bg-rose-50 rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          {!connected && (
            <div className="text-sm font-bold text-amber-700 bg-amber-50 rounded-xl p-3 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Connecting to server...
            </div>
          )}
        </div>

        <p className="text-center text-white/80 text-sm mt-6 font-bold">
          Multiplayer drawing game • Up to 12 players
        </p>
      </div>
    </div>
  );
}
