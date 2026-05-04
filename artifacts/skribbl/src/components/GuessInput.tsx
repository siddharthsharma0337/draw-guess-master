import { useState, type FormEvent } from "react";
import { useGame } from "@/context/GameContext";

export function GuessInput() {
  const { submitGuess, drawerId, myId, gameState, iGuessed } = useGame();
  const [value, setValue] = useState("");

  const isDrawer = drawerId === myId;
  const disabled = isDrawer || gameState !== "playing" || iGuessed;
  const placeholder = isDrawer
    ? "You're drawing!"
    : iGuessed
    ? "You guessed it! Wait for the round to end."
    : gameState === "playing"
    ? "Type your guess..."
    : "Waiting for round to start...";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || disabled) return;
    submitGuess(v);
    setValue("");
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={50}
        className="flex-1 h-11 px-4 rounded-2xl bg-white shadow-md border-2 border-transparent focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 text-slate-900"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-11 px-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  );
}
