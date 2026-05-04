import { useEffect, useState } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { Crown, Copy, Check, Play, ArrowLeft, Bot, Plus, X } from "lucide-react";
import { useGame } from "@/context/GameContext";

export default function Lobby() {
  const params = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const [, route] = useRoute("/lobby/:roomId");
  void route;
  const {
    roomId,
    players,
    hostId,
    myId,
    rounds,
    drawTime,
    gameState,
    startGame,
    updateSettings,
    joinOrCreate,
    myName,
    connected,
    resetClient,
    addBot,
    removeBot,
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const targetRoom = params?.roomId?.toUpperCase();

  // If user navigates directly to /lobby/:id without joining, attempt to join (if has a name).
  useEffect(() => {
    if (!targetRoom) return;
    if (roomId === targetRoom) return;
    if (joining) return;
    if (!connected) return;
    if (!myName) {
      navigate("/");
      return;
    }
    setJoining(true);
    joinOrCreate(myName, targetRoom, false).then((res) => {
      setJoining(false);
      if (!res.ok) {
        setJoinError(res.error || "Could not join room");
      }
    });
  }, [targetRoom, roomId, myName, connected, joining, joinOrCreate, navigate]);

  useEffect(() => {
    if (gameState === "playing" && roomId) {
      navigate(`/game/${roomId}`);
    }
  }, [gameState, roomId, navigate]);

  const isHost = myId !== null && hostId === myId;
  const canStart = players.length >= 2;

  const copyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleStart = () => {
    if (!isHost || !canStart) return;
    startGame(rounds, drawTime);
  };

  const handleSettingChange = (r: number, d: number) => {
    if (!isHost) return;
    updateSettings(r, d);
  };

  const handleLeave = () => {
    resetClient();
    navigate("/");
  };

  if (joinError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-rose-600">Couldn't join</h2>
          <p className="text-slate-600 font-bold">{joinError}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 h-12 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-extrabold shadow-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 flex items-center justify-center text-white font-extrabold text-2xl">
        Joining room...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={handleLeave}
          className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Leave
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Room Code
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="group inline-flex items-center gap-3 mt-1 px-5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-[0.3em]">
                {roomId}
              </span>
              {copied ? (
                <Check className="w-6 h-6 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              )}
            </button>
            <p className="text-sm text-slate-500 mt-1 font-bold">
              Share this code with friends to invite them
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Players ({players.length}/12)
                </h3>
                {isHost && players.length < 12 && (
                  <button
                    type="button"
                    onClick={addBot}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 font-extrabold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Bot className="w-3.5 h-3.5" />
                    Add Bot
                  </button>
                )}
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                      p.id === myId
                        ? "bg-blue-50 border-2 border-blue-200"
                        : p.isBot
                        ? "bg-violet-50"
                        : "bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-sm ${
                        p.isBot
                          ? "bg-gradient-to-br from-violet-400 to-indigo-500"
                          : "bg-gradient-to-br from-fuchsia-400 to-violet-500"
                      }`}
                    >
                      {p.isBot ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        p.name[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="flex-1 font-bold text-slate-900 flex items-center gap-1.5">
                      {p.name}
                      {p.id === myId && (
                        <span className="text-xs font-medium text-blue-600">
                          (you)
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-200 text-violet-700">
                          Bot
                        </span>
                      )}
                    </span>
                    {p.id === hostId && (
                      <Crown className="w-4 h-4 text-amber-500" />
                    )}
                    {isHost && p.isBot && (
                      <button
                        type="button"
                        onClick={() => removeBot(p.id)}
                        aria-label={`Remove ${p.name}`}
                        className="ml-1 w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Rounds
                </label>
                <div className="flex gap-2">
                  {[2, 3, 5, 8].map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleSettingChange(r, drawTime)}
                      className={`flex-1 h-11 rounded-xl font-extrabold transition-colors ${
                        rounds === r
                          ? "bg-fuchsia-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      } ${!isHost ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Draw Time (sec)
                </label>
                <div className="flex gap-2">
                  {[40, 60, 80, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleSettingChange(rounds, d)}
                      className={`flex-1 h-11 rounded-xl font-extrabold transition-colors ${
                        drawTime === d
                          ? "bg-fuchsia-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      } ${!isHost ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {isHost ? (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!canStart}
                  className="w-full h-13 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {canStart ? "Start Game" : "Need 2+ players"}
                </button>
              ) : (
                <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 px-4 py-3 text-center text-amber-800 font-bold text-sm">
                  Waiting for the host to start the game...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
