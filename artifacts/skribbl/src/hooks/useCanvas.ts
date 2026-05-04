import { useEffect, useRef } from "react";
import type { StrokeData } from "@/lib/types";

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 600;

interface Options {
  strokes: StrokeData[];
  canDraw: boolean;
  color: string;
  size: number;
  onStroke: (s: StrokeData) => void;
}

export function useCanvas({ strokes, canDraw, color, size, onStroke }: Options) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const renderedCountRef = useRef(0);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const canDrawRef = useRef(canDraw);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    canDrawRef.current = canDraw;
  }, [canDraw]);

  // Draw any new strokes (incremental) or repaint when reset
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (strokes.length < renderedCountRef.current) {
      // strokes were cleared — repaint
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderedCountRef.current = 0;
    }

    for (let i = renderedCountRef.current; i < strokes.length; i++) {
      const s = strokes[i]!;
      drawSegment(ctx, s);
    }
    renderedCountRef.current = strokes.length;
  }, [strokes]);

  function drawSegment(ctx: CanvasRenderingContext2D, s: StrokeData) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
  }

  function getPos(e: PointerEvent | React.PointerEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canDrawRef.current) return;
    const pt = getPos(e);
    if (!pt) return;
    drawingRef.current = true;
    lastPointRef.current = pt;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    // Emit a tiny dot for single clicks
    const stroke: StrokeData = {
      x0: pt.x,
      y0: pt.y,
      x1: pt.x + 0.01,
      y1: pt.y + 0.01,
      color: colorRef.current,
      size: sizeRef.current,
    };
    onStroke(stroke);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !canDrawRef.current) return;
    const pt = getPos(e);
    if (!pt || !lastPointRef.current) return;
    const stroke: StrokeData = {
      x0: lastPointRef.current.x,
      y0: lastPointRef.current.y,
      x1: pt.x,
      y1: pt.y,
      color: colorRef.current,
      size: sizeRef.current,
    };
    onStroke(stroke);
    lastPointRef.current = pt;
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
