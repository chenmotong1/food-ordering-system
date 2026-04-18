"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
  isSad?: boolean;
  sadRotate?: number;
}

export default function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
  isSad = false,
  sadRotate = 0,
}: EyeBallProps) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const rafId = useRef(0);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

  const computePupilPos = useCallback(() => {
    if (!eyeRef.current) return;
    const isForceLook = forceLookX !== undefined && forceLookY !== undefined;
    if (isForceLook) {
      setPupilPos({ x: forceLookX, y: isSad ? -1 : forceLookY });
      return;
    }
    const rect = eyeRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX.current - cx;
    const dy = mouseY.current - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    setPupilPos({
      x: Math.cos(angle) * dist,
      y: isSad ? -1 : Math.sin(angle) * dist,
    });
  }, [forceLookX, forceLookY, isSad, maxDistance]);

  useEffect(() => {
    let needsUpdate = false;
    const onMouseMove = () => {
      if (!needsUpdate) {
        needsUpdate = true;
        rafId.current = requestAnimationFrame(() => {
          needsUpdate = false;
          computePupilPos();
        });
      }
    };
    const onMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      onMouseMove();
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [computePupilPos]);

  // Re-compute when forced look changes
  useEffect(() => {
    computePupilPos();
  }, [forceLookX, forceLookY, computePupilPos]);

  const eyeHeight = isBlinking ? 2 : isSad ? size * 0.5 : size;
  const borderRadius = isSad
    ? `0 0 ${size}px ${size}px`
    : "50%";

  return (
    <div
      ref={eyeRef}
      aria-hidden="true"
      style={{
        width: size,
        height: eyeHeight,
        backgroundColor: eyeColor,
        borderRadius,
        transform: isSad ? `rotate(${sadRotate}deg)` : "rotate(0deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        willChange: "height, border-radius, transform",
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            borderRadius: "50%",
            transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)`,
            transition: "transform 0.1s ease-out",
            willChange: "transform",
          }}
        />
      )}
    </div>
  );
}
