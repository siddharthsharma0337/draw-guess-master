import { useGame } from "@/context/GameContext";
import { CANVAS_HEIGHT, CANVAS_WIDTH, useCanvas } from "@/hooks/useCanvas";
import type { StrokeData } from "@/lib/types";

interface Props {
  color: string;
  size: number;
}

export function DrawingCanvas({ color, size }: Props) {
  const { strokes, sendStroke, drawerId, myId, gameState } = useGame();
  const isDrawer = drawerId === myId && gameState === "playing";

  const { canvasRef, onPointerDown, onPointerMove, onPointerUp } = useCanvas({
    strokes,
    canDraw: isDrawer,
    color,
    size,
    onStroke: (s: StrokeData) => sendStroke(s),
  });

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          touchAction: "none",
          cursor: isDrawer ? "crosshair" : "not-allowed",
        }}
        className="w-full h-full bg-white rounded-2xl shadow-inner block"
      />
    </div>
  );
}
