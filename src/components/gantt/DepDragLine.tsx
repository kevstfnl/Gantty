"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  startX: number;
  startY: number;
  active: boolean;
}

/** SVG line that follows the mouse during a dep drag */
export function DepDragLine({ startX, startY, active }: Props) {
  const [mouse, setMouse] = useState({ x: startX, y: startY });

  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [active]);

  if (!active) return null;

  // Orthogonal preview: right stub + diagonal to mouse
  const dx = mouse.x - startX;
  const stubX = startX + Math.min(20, Math.max(4, dx * 0.3));

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100vw", height: "100vh" }}
    >
      <title>drag</title>
      <defs>
        <marker
          id="dep-preview-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0.5 L0,6.5 L6,3.5 z" fill="rgba(0,76,237,0.9)" />
        </marker>
      </defs>
      <path
        d={`M ${startX} ${startY} H ${stubX} L ${mouse.x} ${mouse.y}`}
        fill="none"
        stroke="rgba(0,76,237,0.9)"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        markerEnd="url(#dep-preview-arrow)"
      />
      {/* Source dot */}
      <circle cx={startX} cy={startY} r={4} fill="var(--blue)" />
      {/* Cursor dot */}
      <circle
        cx={mouse.x}
        cy={mouse.y}
        r={5}
        fill="none"
        stroke="rgba(0,76,237,0.7)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
