import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, BarChart2, MessageSquare } from "lucide-react";
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
  const [mobileTab, setMobileTab] = useState<"scores" | "chat">("chat");

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
    <div className="w-full h-[100dvh] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 flex flex-col overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-3">
        <button
          type="button"
          onClick={handleLeave}
          className="h-9 md:h-10 px-2.5 md:px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>

        <div className="flex-1 bg-white rounded-2xl shadow-md px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 min-w-0">
          <Timer />
          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
            {/* Round counter */}
            <div className="shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none">
                Round
              </div>
              <div className="text-base md:text-xl font-extrabold text-slate-900 leading-tight">
                {currentRound}/{totalRounds}
              </div>
            </div>

            {/* Word display - center */}
            <div className="flex-1 min-w-0 flex justify-center">
              <WordDisplay />
            </div>

            {/* Drawer name - hidden on very small screens */}
            <div className="shrink-0 text-right hidden xs:block">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none">
                Drawing
              </div>
              <div className="text-base md:text-xl font-extrabold text-slate-900 truncate max-w-[100px] md:max-w-[140px] leading-tight">
                {drawerName || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (< md) ────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 md:hidden">
        {/* Canvas */}
        <div className="flex-shrink-0 px-3 relative">
          <div className="relative w-full aspect-[4/3] bg-white rounded-2xl shadow-xl overflow-hidden">
            <DrawingCanvas color={color} size={size} />
            {showRoundEndOverlay && (
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="bg-white rounded-3xl p-6 text-center shadow-2xl mx-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    The word was
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-500 mt-1">
                    {revealedWord}
                  </div>
                  <div className="text-sm text-slate-500 font-bold mt-2">
                    Next round starting...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex-shrink-0 px-3 pt-2">
          <ToolBar color={color} setColor={setColor} size={size} setSize={setSize} />
        </div>

        {/* Tab switcher */}
        <div className="flex-shrink-0 flex gap-0 px-3 pt-2">
          <button
            type="button"
            onClick={() => setMobileTab("scores")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-l-xl text-sm font-bold transition-colors ${
              mobileTab === "scores"
                ? "bg-white text-fuchsia-600 shadow"
                : "bg-white/30 text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Scores
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-r-xl text-sm font-bold transition-colors ${
              mobileTab === "chat"
                ? "bg-white text-fuchsia-600 shadow"
                : "bg-white/30 text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>

        {/* Tab content — flex-1 so it fills remaining height */}
        <div className="flex-1 min-h-0 px-3 pt-2 pb-0 overflow-hidden">
          {mobileTab === "scores" ? (
            <div className="h-full overflow-y-auto">
              <LiveScores />
            </div>
          ) : (
            <div className="h-full flex flex-col gap-2">
              <ChatBox />
            </div>
          )}
        </div>

        {/* Guess input — always visible at bottom */}
        <div className="flex-shrink-0 px-3 py-2">
          <GuessInput />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ───────────────────────────────── */}
      <div className="hidden md:flex flex-1 min-h-0 px-5 pb-5 gap-3">
        {/* Canvas + toolbar */}
        <div className="flex flex-col flex-1 gap-3 min-h-0">
          <div className="relative flex-1 bg-white rounded-2xl shadow-xl overflow-hidden min-h-0 flex items-center justify-center p-2">
            <div className="relative w-full h-full">
              <DrawingCanvas color={color} size={size} />
              {showRoundEndOverlay && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-2xl animate-in fade-in">
                  <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      The word was
                    </div>
                    <div className="text-5xl font-extrabold text-emerald-500 mt-1">
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
        <div className="flex flex-col w-[300px] xl:w-[320px] gap-3 min-h-0">
          <LiveScores />
          <ChatBox />
          <GuessInput />
        </div>
      </div>
    </div>
  );
}
