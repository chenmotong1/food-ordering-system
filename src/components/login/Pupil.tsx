"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
  isBlinking?: boolean;
}

export default function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
  isBlinking = false,
}: PupilProps) {
  const pupilRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const rafId = useRef(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const computePos = useCallback(() => {
    if (!pupilRef.current) return;
    if (forceLookX !== undefined && forceLookY !== undefined) {
      setPos({ x: forceLookX, y: forceLookY });
      return;
    }
    const rect = pupilRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX.current - cx;
    const dy = mouseY.current - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    setPos({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
    });
  }, [forceLookX, forceLookY, maxDistance]);

  useEffect(() => {
    let needsUpdate = false;
    const onMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      if (!needsUpdate) {
        needsUpdate = true;
        rafId.current = requestAnimationFrame(() => {
          needsUpdate = false;
          computePos();
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [computePos]);

  useEffect(() => {
    computePos();
  }, [forceLookX, forceLookY, computePos]);

  return (
    <div
      ref={pupilRef}
      aria-hidden="true"
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: pupilColor,
        borderRadius: "50%",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.1s ease-out, height 0.15s ease-out",
        willChange: "transform, height",
      }}
    />
  );
}
