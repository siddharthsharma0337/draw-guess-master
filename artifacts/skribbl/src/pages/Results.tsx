import { useEffect } from "react";
import { useLocation } from "wouter";
import { Home, RotateCcw } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { FinalLeaderboard } from "@/components/FinalLeaderboard";

export default function Results() {
  const [, navigate] = useLocation();
  const {
    finalScores,
    myId,
    hostId,
    roomId,
    gameState,
    playAgain,
    resetClient,
  } = useGame();

  useEffect(() => {
    if (!roomId) navigate("/");
  }, [roomId, navigate]);

  useEffect(() => {
    if (gameState === "lobby" && roomId) {
      navigate(`/lobby/${roomId}`);
    }
  }, [gameState, roomId, navigate]);

  const isHost = myId !== null && hostId === myId;

  const handleHome = () => {
    resetClient();
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">
            Game Over!
          </h1>
          <p className="text-white/90 font-bold mt-1">
            Here&apos;s how everyone did
          </p>
        </div>

        <FinalLeaderboard players={finalScores} myId={myId} />

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          {isHost ? (
            <button
              type="button"
              onClick={() => playAgain()}
              className="h-13 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Play Again
            </button>
          ) : (
            <div className="h-13 px-6 py-3 rounded-2xl bg-white/20 text-white font-bold text-base flex items-center justify-center">
              Waiting for host to play again...
            </div>
          )}
          <button
            type="button"
            onClick={handleHome}
            className="h-13 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-lg shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
