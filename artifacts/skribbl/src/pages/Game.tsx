import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { ChatBox } from "@/components/ChatBox";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { GuessInput } from "@/components/GuessInput";
import { LiveScores } from "@/components/LiveScores";
import { Timer } from "@/components/Timer";
import { ToolBar } from "@/components/ToolBar";
import { WordDisplay } from "@/components/WordDisplay";
import { COLORS } from "@/components/ToolBar";

export default function Game() {
  const params = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const {
    roomId,
    gameState,
    revealedWord,
    drawerName,
    currentRound,
    totalRounds,
    resetClient,
  } = useGame();
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(10);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
    } else if (params?.roomId && params.roomId.toUpperCase() !== roomId) {
      navigate(`/game/${roomId}`);
    }
  }, [roomId, params?.roomId, navigate]);

  useEffect(() => {
    if (gameState === "ended" && roomId) {
      navigate(`/results/${roomId}`);
    }
  }, [gameState, roomId, navigate]);

  useEffect(() => {
    if (gameState === "lobby" && roomId) {
      navigate(`/lobby/${roomId}`);
    }
  }, [gameState, roomId, navigate]);

  const handleLeave = () => {
    resetClient();
    navigate("/");
  };

  const showRoundEndOverlay = gameState === "round-end" && revealedWord;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 p-3 md:p-5">
      <div className="max-w-7xl mx-auto h-[calc(100vh-1.5rem)] md:h-[calc(100vh-2.5rem)] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={handleLeave}
            className="h-10 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Leave
          </button>

          <div className="flex-1 bg-white rounded-2xl shadow-md px-4 py-2 flex items-center gap-3">
            <Timer />
            <div className="flex-1 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Round
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {currentRound} / {totalRounds}
                </div>
              </div>
              <WordDisplay />
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Drawing
                </div>
                <div className="text-xl font-extrabold text-slate-900 truncate max-w-[140px]">
                  {drawerName || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3 min-h-0">
          {/* Canvas + toolbar */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 bg-white rounded-2xl shadow-xl overflow-hidden min-h-0 flex items-center justify-center p-2">
              <div className="relative w-full h-full">
                <DrawingCanvas color={color} size={size} />
                {showRoundEndOverlay && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-2xl animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        The word was
                      </div>
                      <div className="text-4xl md:text-5xl font-extrabold text-emerald-500 mt-1">
                        {revealedWord}
                      </div>
                      <div className="text-sm text-slate-500 font-bold mt-3">
                        Next round starting...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ToolBar color={color} setColor={setColor} size={size} setSize={setSize} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3 min-h-0">
            <LiveScores />
            <ChatBox />
            <GuessInput />
          </div>
        </div>
      </div>
    </div>
  );
}
