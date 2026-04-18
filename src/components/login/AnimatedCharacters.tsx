"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import EyeBall from "./EyeBall";
import Pupil from "./Pupil";

interface AnimatedCharactersProps {
  isTyping: boolean;
  showPassword: boolean;
  passwordLength: number;
  loginFailed: boolean;
  loginSuccess: boolean;
}

interface CharPos {
  faceX: number;
  faceY: number;
  bodySkew: number;
}

interface Center {
  x: number;
  y: number;
}

const CONFETTI_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA",
  "#FF9B6B", "#6BCB77", "#4D96FF",
];

function calcPosition(
  cx: number, cy: number, mx: number, my: number,
  rangeX = 15, rangeY = 10,
  minX: number | null = null, maxX: number | null = null,
  minY: number | null = null, maxY: number | null = null,
): CharPos {
  const rMinX = minX ?? -rangeX;
  const rMaxX = maxX ?? rangeX;
  const rMinY = minY ?? -rangeY;
  const rMaxY = maxY ?? rangeY;
  const dx = mx - cx;
  const dy = my - cy;
  const scaleX = Math.max(Math.abs(rMinX), Math.abs(rMaxX));
  const scaleY = Math.max(Math.abs(rMinY), Math.abs(rMaxY));
  const faceX = Math.max(rMinX, Math.min(rMaxX, dx / (300 / scaleX)));
  const faceY = Math.max(rMinY, Math.min(rMaxY, dy / (300 / scaleY)));
  const bodySkew = Math.max(-6, Math.min(6, -dx / 120));
  return { faceX, faceY, bodySkew };
}

export default function AnimatedCharacters({
  isTyping,
  showPassword,
  passwordLength,
  loginFailed,
  loginSuccess,
}: AnimatedCharactersProps) {
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);

  const [hasEntered, setHasEntered] = useState(false);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isOrangeBlinking, setIsOrangeBlinking] = useState(false);
  const [isYellowBlinking, setIsYellowBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const [purplePos, setPurplePos] = useState<CharPos>({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [blackPos, setBlackPos] = useState<CharPos>({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [orangePos, setOrangePos] = useState<CharPos>({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [yellowPos, setYellowPos] = useState<CharPos>({ faceX: 0, faceY: 0, bodySkew: 0 });

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiStyles, setConfettiStyles] = useState<Array<React.CSSProperties>>([]);
  const [successLookY, setSuccessLookY] = useState(-5);

  // Refs for timers/animation frames
  const pendingMX = useRef(0);
  const pendingMY = useRef(0);
  const needsUpdate = useRef(false);
  const rafId = useRef(0);
  const centersRef = useRef<Record<string, Center>>({
    purple: { x: 0, y: 0 },
    black: { x: 0, y: 0 },
    orange: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
  });

  const purpleBlinkT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blackBlinkT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orangeBlinkT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yellowBlinkT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookingT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successAnimT = useRef<number>(0);

  const isHidingPassword = passwordLength > 0 && !showPassword;

  // --- Update character centers ---
  const updateCenters = useCallback(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      purple: purpleRef, black: blackRef, orange: orangeRef, yellow: yellowRef,
    };
    const next = { ...centersRef.current };
    for (const [key, ref] of Object.entries(refs)) {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        next[key] = { x: r.left + r.width / 2, y: r.top + r.height / 3 };
      }
    }
    centersRef.current = next;
  }, []);

  // --- RAF position update loop ---
  const updatePositions = useCallback(() => {
    if (needsUpdate.current && hasEntered) {
      needsUpdate.current = false;
      const mx = pendingMX.current;
      const my = pendingMY.current;
      const c = centersRef.current;
      setPurplePos(calcPosition(c.purple.x, c.purple.y, mx, my, 0, 0, -46, 18, -8, 5));
      setBlackPos(calcPosition(c.black.x, c.black.y, mx, my));
      setOrangePos(calcPosition(c.orange.x, c.orange.y, mx, my, 0, 0, -46, 20, -18, 20));
      setYellowPos(calcPosition(c.yellow.x, c.yellow.y, mx, my));
    }
    rafId.current = requestAnimationFrame(updatePositions);
  }, [hasEntered]);

  // --- Mouse move handler ---
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pendingMX.current = e.clientX;
      pendingMY.current = e.clientY;
      needsUpdate.current = true;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", updateCenters, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", updateCenters);
    };
  }, [updateCenters]);

  // --- Blink schedulers ---
  const scheduleBlink = useCallback((
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) => {
    const interval = Math.random() * 4000 + 3000;
    timerRef.current = setTimeout(() => {
      setter(true);
      setTimeout(() => {
        setter(false);
        scheduleBlink(setter, timerRef);
      }, 150);
    }, interval);
  }, []);

  useEffect(() => {
    scheduleBlink(setIsPurpleBlinking, purpleBlinkT);
    scheduleBlink(setIsBlackBlinking, blackBlinkT);
    scheduleBlink(setIsOrangeBlinking, orangeBlinkT);
    scheduleBlink(setIsYellowBlinking, yellowBlinkT);
    return () => {
      if (purpleBlinkT.current) clearTimeout(purpleBlinkT.current);
      if (blackBlinkT.current) clearTimeout(blackBlinkT.current);
      if (orangeBlinkT.current) clearTimeout(orangeBlinkT.current);
      if (yellowBlinkT.current) clearTimeout(yellowBlinkT.current);
    };
  }, [scheduleBlink]);

  // --- Looking at each other when typing ---
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      lookingT.current = setTimeout(() => setIsLookingAtEachOther(false), 800);
    } else {
      setIsLookingAtEachOther(false);
      if (lookingT.current) clearTimeout(lookingT.current);
    }
    return () => { if (lookingT.current) clearTimeout(lookingT.current); };
  }, [isTyping]);

  // --- Purple peeking when password visible ---
  useEffect(() => {
    if (passwordLength > 0 && showPassword && !isPurplePeeking) {
      const interval = Math.random() * 3000 + 2000;
      peekT.current = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, interval);
    } else if (passwordLength === 0 || !showPassword) {
      setIsPurplePeeking(false);
      if (peekT.current) clearTimeout(peekT.current);
    }
    return () => { if (peekT.current) clearTimeout(peekT.current); };
  }, [passwordLength, showPassword, isPurplePeeking]);

  // --- Confetti on login success ---
  const generateConfetti = useCallback(() => {
    const styles = Array.from({ length: 180 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `-${10 + Math.random() * 30}%`,
      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: `${4 + Math.random() * 6}px`,
      height: `${8 + Math.random() * 12}px`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${4.5 + Math.random() * 2}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setConfettiStyles(styles);
    setShowConfetti(true);
    if (confettiT.current) clearTimeout(confettiT.current);
    confettiT.current = setTimeout(() => {
      setShowConfetti(false);
      setConfettiStyles([]);
    }, 8000);
  }, []);

  // --- Success look animation ---
  useEffect(() => {
    if (loginSuccess) {
      generateConfetti();
      setSuccessLookY(-5);
      if (successAnimT.current) cancelAnimationFrame(successAnimT.current);
      const startY = -5;
      const endY = 4;
      const duration = 5500;
      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        setSuccessLookY(startY + (endY - startY) * eased);
        if (progress < 1) successAnimT.current = requestAnimationFrame(step);
      };
      successAnimT.current = requestAnimationFrame(step);
    } else {
      setSuccessLookY(-5);
    }
    return () => { if (successAnimT.current) cancelAnimationFrame(successAnimT.current); };
  }, [loginSuccess, generateConfetti]);

  // --- Entrance animation + start RAF loop ---
  useEffect(() => {
    const t = setTimeout(() => {
      setHasEntered(true);
      updateCenters();
      rafId.current = requestAnimationFrame(updatePositions);
    }, 1400);
    return () => {
      clearTimeout(t);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (confettiT.current) clearTimeout(confettiT.current);
    };
  }, [updateCenters, updatePositions]);

  // --- Computed force look values ---
  const purpleForceX = loginSuccess ? 0
    : (passwordLength > 0 && showPassword) ? (isPurplePeeking ? 4 : -4)
    : isLookingAtEachOther ? 3 : undefined;
  const purpleForceY = loginSuccess ? successLookY
    : (passwordLength > 0 && showPassword) ? (isPurplePeeking ? 5 : -4)
    : isLookingAtEachOther ? 4 : undefined;

  const blackForceX = loginSuccess ? 0
    : (passwordLength > 0 && showPassword) ? -4
    : isLookingAtEachOther ? 0 : undefined;
  const blackForceY = loginSuccess ? successLookY
    : (passwordLength > 0 && showPassword) ? -4
    : isLookingAtEachOther ? -4 : undefined;

  const orangeForceX = loginSuccess ? 0
    : (passwordLength > 0 && showPassword) ? -5 : undefined;
  const orangeForceY = loginSuccess ? successLookY
    : (passwordLength > 0 && showPassword) ? -4 : undefined;

  const yellowForceX = loginSuccess ? 0
    : (passwordLength > 0 && showPassword) ? -5 : undefined;
  const yellowForceY = loginSuccess ? successLookY
    : (passwordLength > 0 && showPassword) ? -4 : undefined;

  // --- Transform helpers ---
  const purpleTransform = hasEntered
    ? (passwordLength > 0 && showPassword)
      ? "skewX(0deg)"
      : (isTyping || isHidingPassword)
        ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
        : `skewX(${purplePos.bodySkew || 0}deg)`
    : undefined;

  const blackTransform = hasEntered
    ? (passwordLength > 0 && showPassword)
      ? "skewX(0deg)"
      : isLookingAtEachOther
        ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
        : (isTyping || isHidingPassword)
          ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
          : `skewX(${blackPos.bodySkew || 0}deg)`
    : undefined;

  const orangeTransform = hasEntered
    ? (passwordLength > 0 && showPassword)
      ? "skewX(0deg)"
      : `skewX(${orangePos.bodySkew || 0}deg)`
    : undefined;

  const yellowTransform = hasEntered
    ? (passwordLength > 0 && showPassword)
      ? "skewX(0deg)"
      : `skewX(${yellowPos.bodySkew || 0}deg)`
    : undefined;

  // --- Eye positions ---
  const purpleEyeLeft = (passwordLength > 0 && showPassword) ? 50
    : isLookingAtEachOther ? 85 : 75 + purplePos.faceX;
  const purpleEyeTop = (passwordLength > 0 && showPassword) ? 20
    : isLookingAtEachOther ? 50 : 25 + purplePos.faceY;

  const blackEyeLeft = (passwordLength > 0 && showPassword) ? 10
    : isLookingAtEachOther ? 32 : 26 + blackPos.faceX;
  const blackEyeTop = (passwordLength > 0 && showPassword) ? 28
    : isLookingAtEachOther ? 12 : 32 + blackPos.faceY;

  const orangeEyeLeft = (passwordLength > 0 && showPassword) ? 80
    : 112 + orangePos.faceX;
  const orangeEyeTop = (passwordLength > 0 && showPassword) ? 55
    : 60 + orangePos.faceY;

  const yellowEyeLeft = (passwordLength > 0 && showPassword) ? 20
    : 52 + yellowPos.faceX;
  const yellowEyeTop = (passwordLength > 0 && showPassword) ? 35
    : 40 + yellowPos.faceY;

  // --- Mouth positions ---
  const purpleMouthLeft = (passwordLength > 0 && showPassword) ? 72
    : isLookingAtEachOther ? 106 : 97 + purplePos.faceX;
  const purpleMouthTop = (passwordLength > 0 && showPassword) ? 57
    : isLookingAtEachOther ? 82 : 57 + purplePos.faceY;
  const purpleCounterSkew = (isTyping || isHidingPassword)
    ? `skewX(${-((purplePos.bodySkew || 0) - 12)}deg)`
    : "skewX(0deg)";

  const orangeMouthLeft = (passwordLength > 0 && showPassword) ? 94
    : 126 + orangePos.faceX;
  const orangeMouthTop = (passwordLength > 0 && showPassword) ? 87
    : 92 + orangePos.faceY;

  const yellowMouthLeft = (passwordLength > 0 && showPassword) ? 10
    : 40 + yellowPos.faceX;
  const yellowMouthTop = (passwordLength > 0 && showPassword) ? 88
    : 88 + yellowPos.faceY;

  // Mouth state classes
  const purpleMouthClass = `char-mouth-purple${
    (isTyping || isHidingPassword) && !loginFailed && !loginSuccess ? " char-mouth-typing" : ""
  }${loginFailed ? " char-mouth-sad" : ""}${
    loginSuccess ? " char-mouth-happy" : ""
  }`;

  const orangeMouthClass = `char-mouth-orange${
    (isTyping || isHidingPassword) && !loginFailed && !loginSuccess ? " char-mouth-orange-typing" : ""
  }${loginFailed ? " char-mouth-orange-sad" : ""}${
    loginSuccess ? " char-mouth-orange-happy" : ""
  }`;

  const yellowPathClass = `yellow-mouth-path${
    loginFailed ? " yellow-mouth-wavy" : ""
  }${loginSuccess ? " yellow-mouth-happy" : ""}`;

  return (
    <div className="animated-characters-container" aria-hidden="true">
      {/* Confetti */}
      {showConfetti && (
        <div className="confetti-container">
          {confettiStyles.map((style, i) => (
            <div key={i} className="confetti-piece" style={style} />
          ))}
        </div>
      )}

      {/* Purple character */}
      <div
        ref={purpleRef}
        className={`character purple-character${hasEntered ? " entrance-complete" : ""}`}
        style={{
          left: 70,
          width: 180,
          height: (isTyping || isHidingPassword) ? 440 : 400,
          backgroundColor: "#6C3FF5",
          borderRadius: 0,
          zIndex: 1,
          transform: purpleTransform,
        }}
      >
        <div className="char-eyes char-eyes-wide" style={{ left: purpleEyeLeft, top: purpleEyeTop }}>
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isPurpleBlinking} forceLookX={purpleForceX} forceLookY={purpleForceY} />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isPurpleBlinking} forceLookX={purpleForceX} forceLookY={purpleForceY} />
        </div>
        <div
          className={purpleMouthClass}
          style={{ left: purpleMouthLeft, top: purpleMouthTop, "--counter-skew": purpleCounterSkew } as React.CSSProperties}
        />
      </div>

      {/* Black character */}
      <div
        ref={blackRef}
        className={`character black-character${hasEntered ? " entrance-complete" : ""}`}
        style={{
          left: 240,
          width: 120,
          height: 310,
          backgroundColor: "#2D2D2D",
          borderRadius: 0,
          zIndex: 2,
          transform: blackTransform,
        }}
      >
        <div className="char-eyes char-eyes-medium" style={{ left: blackEyeLeft, top: blackEyeTop }}>
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isBlackBlinking} isSad={loginFailed} sadRotate={-20}
            forceLookX={blackForceX} forceLookY={blackForceY} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isBlackBlinking} isSad={loginFailed} sadRotate={20}
            forceLookX={blackForceX} forceLookY={blackForceY} />
        </div>
      </div>

      {/* Orange character */}
      <div
        ref={orangeRef}
        className={`character orange-character${hasEntered ? " entrance-complete" : ""}`}
        style={{
          left: 0,
          width: 240,
          height: 150,
          zIndex: 3,
          backgroundColor: "#FF9B6B",
          borderRadius: "120px 120px 0 0",
          transform: orangeTransform,
        }}
      >
        <div className="char-eyes char-eyes-wide" style={{ left: orangeEyeLeft, top: orangeEyeTop }}>
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            isBlinking={isOrangeBlinking} forceLookX={orangeForceX} forceLookY={orangeForceY} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            isBlinking={isOrangeBlinking} forceLookX={orangeForceX} forceLookY={orangeForceY} />
        </div>
        <div className={orangeMouthClass} style={{ left: orangeMouthLeft, top: orangeMouthTop }} />
      </div>

      {/* Yellow character */}
      <div
        ref={yellowRef}
        className={`character yellow-character${hasEntered ? " entrance-complete" : ""}`}
        style={{
          left: 310,
          width: 140,
          height: 230,
          backgroundColor: "#E8D754",
          borderRadius: "70px 70px 0 0",
          zIndex: 4,
          transform: yellowTransform,
        }}
      >
        <div className="char-eyes char-eyes-medium" style={{ left: yellowEyeLeft, top: yellowEyeTop }}>
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            isBlinking={isYellowBlinking} forceLookX={yellowForceX} forceLookY={yellowForceY} />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            isBlinking={isYellowBlinking} forceLookX={yellowForceX} forceLookY={yellowForceY} />
        </div>
        <div className="yellow-mouth-wrapper" style={{ left: yellowMouthLeft, top: yellowMouthTop }}>
          <svg width={80} height={20} viewBox="0 0 80 20">
            <path className={yellowPathClass} stroke="#2D2D2D" strokeWidth={3} fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
