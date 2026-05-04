import { useGame } from "@/context/GameContext";

export function WordDisplay() {
  const { drawerId, myId, secretWord, maskedWord, wordLength, gameState, revealedWord } =
    useGame();
  const isDrawer = drawerId === myId;

  if (gameState === "round-end" && revealedWord) {
    return (
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
          The word was
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 tracking-wide">
          {revealedWord}
        </div>
      </div>
    );
  }

  if (isDrawer && secretWord) {
    return (
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
          Draw this word
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-wide">
          {secretWord}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
        Guess the word ({wordLength} letters)
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-[0.4em] font-mono">
        {maskedWord || "_ _ _ _ _"}
      </div>
    </div>
  );
}
