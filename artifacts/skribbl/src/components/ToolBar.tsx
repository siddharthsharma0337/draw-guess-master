import { Eraser, Trash2 } from "lucide-react";
import { useGame } from "@/context/GameContext";

export const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#92400e",
];

export const SIZES = [
  { label: "S", value: 4 },
  { label: "M", value: 10 },
  { label: "L", value: 20 },
];

interface Props {
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
}

export function ToolBar({ color, setColor, size, setSize }: Props) {
  const { clearCanvas, drawerId, myId, gameState } = useGame();
  const enabled = drawerId === myId && gameState === "playing";

  return (
    <div
      className={`flex flex-wrap items-center gap-3 p-3 bg-white rounded-2xl shadow-md ${
        enabled ? "" : "opacity-50 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-1 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
              color === c
                ? "border-slate-900 ring-2 ring-offset-1 ring-slate-900 scale-110"
                : "border-slate-200"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-8 w-px bg-slate-200" />

      <div className="flex items-center gap-1">
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSize(s.value)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
              size === s.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            aria-label={`Brush size ${s.label}`}
          >
            <span
              className="rounded-full bg-current"
              style={{
                width: Math.min(s.value, 18),
                height: Math.min(s.value, 18),
              }}
            />
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-slate-200" />

      <button
        type="button"
        onClick={() => setColor("#ffffff")}
        className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-2"
      >
        <Eraser className="w-4 h-4" /> Eraser
      </button>

      <button
        type="button"
        onClick={() => clearCanvas()}
        className="h-10 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-2 ml-auto"
      >
        <Trash2 className="w-4 h-4" /> Clear
      </button>
    </div>
  );
}
