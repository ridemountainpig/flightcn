"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const STARFIELD_BACKGROUND =
  "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.08) 0%, rgba(10,15,28,0) 60%), radial-gradient(1px 1px at 12% 30%, rgba(226,232,240,0.8), transparent 60%), radial-gradient(1px 1px at 28% 70%, rgba(186,230,253,0.7), transparent 60%), radial-gradient(1px 1px at 46% 20%, rgba(255,255,255,0.6), transparent 60%), radial-gradient(1px 1px at 63% 58%, rgba(56,189,248,0.8), transparent 60%), radial-gradient(1px 1px at 78% 32%, rgba(226,232,240,0.7), transparent 60%), radial-gradient(1px 1px at 90% 72%, rgba(186,230,253,0.6), transparent 60%)";

const STAR_CHIP_BACKGROUND =
  "radial-gradient(ellipse at 30% 30%, rgba(56,189,248,0.25) 0%, rgba(2,6,23,0.95) 70%)";
const STAR_CHIP_DOTS =
  "radial-gradient(0.6px 0.6px at 22% 28%, rgba(226,232,240,0.9), transparent 60%), radial-gradient(0.6px 0.6px at 70% 40%, rgba(186,230,253,0.8), transparent 60%), radial-gradient(0.6px 0.6px at 40% 72%, rgba(255,255,255,0.75), transparent 60%), radial-gradient(0.6px 0.6px at 82% 80%, rgba(226,232,240,0.7), transparent 60%)";

type SatelliteCommandCopyProps = {
  command: string;
  className?: string;
  codeClassName?: string;
};

function SatelliteMiniIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-14 -14 28 28"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="-12"
        y="-3.4"
        width="7"
        height="6.8"
        rx="1.2"
        fill="#38bdf8"
        opacity="0.95"
      />
      <rect
        x="5"
        y="-3.4"
        width="7"
        height="6.8"
        rx="1.2"
        fill="#38bdf8"
        opacity="0.95"
      />
      <g opacity="0.45" stroke="#0f172a" strokeWidth="0.5">
        <line x1="-8.5" y1="-3.4" x2="-8.5" y2="3.4" />
        <line x1="8.5" y1="-3.4" x2="8.5" y2="3.4" />
      </g>
      <rect x="-4.6" y="-4.6" width="9.2" height="9.2" rx="2" fill="#e2e8f0" />
      <circle cx="0" cy="0" r="1.8" fill="#38bdf8" opacity="0.85" />
      <path
        d="M 0 -7.6 L 0 -12"
        stroke="#e2e8f0"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarChip() {
  return (
    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-sky-400/40 sm:h-7 sm:w-7 sm:rounded-[4px]">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: STAR_CHIP_BACKGROUND }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: STAR_CHIP_DOTS }}
      />
      <svg
        aria-hidden="true"
        viewBox="-10 -10 20 20"
        className="absolute inset-0 h-full w-full"
      >
        <g
          fill="#e0f2fe"
          style={{
            filter: "drop-shadow(0 0 1.2px rgba(186,230,253,0.9))",
          }}
        >
          <path d="M 0 -4 L 0.9 -0.9 L 4 0 L 0.9 0.9 L 0 4 L -0.9 0.9 L -4 0 L -0.9 -0.9 Z" />
        </g>
      </svg>
    </div>
  );
}

export function SatelliteCommandCopy({
  command,
  className = "",
  codeClassName = "",
}: SatelliteCommandCopyProps) {
  const satelliteSize = 26;
  const gradientId = useId();
  const [copied, setCopied] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setIsOrbiting(false);

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsOrbiting(true);
      animationFrameRef.current = null;
    });

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      setIsOrbiting(false);
      resetTimerRef.current = null;
    }, 1800);
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-transparent p-1.5 sm:p-2 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-sky-400/25" />

      {/* Main container: deep-space telemetry panel */}
      <div className="relative grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 overflow-hidden rounded-md bg-[#0a0f1c] px-1.5 py-1.5 sm:gap-3 sm:px-2.5 sm:py-2">
        {/* Starfield + radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: STARFIELD_BACKGROUND,
            backgroundSize: "100% 100%",
          }}
        />

        {/* Left: Mission identifier block */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <StarChip />

          <div className="flex flex-col justify-center leading-none select-none">
            <span className="hidden font-mono text-[8px] font-semibold tracking-[0.22em] text-sky-400/70 sm:block">
              MISSION
            </span>
            <span className="mt-0 font-mono text-[10px] font-semibold tracking-[0.18em] text-sky-100 sm:mt-1 sm:text-[11px]">
              SAT·01
            </span>
          </div>
        </div>

        {/* Middle: orbit arc + command text + travelling satellite */}
        <div className="relative z-10 flex min-w-0 items-center justify-center overflow-hidden px-0 sm:px-2">
          {/* Orbit arc (subtle sine curve, dashed) */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 20"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(56,189,248,0)" />
                <stop offset="15%" stopColor="rgba(56,189,248,0.55)" />
                <stop offset="85%" stopColor="rgba(56,189,248,0.55)" />
                <stop offset="100%" stopColor="rgba(56,189,248,0)" />
              </linearGradient>
            </defs>
            <path
              d="M 0 10 Q 25 4, 50 10 T 100 10"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="0.6"
              strokeDasharray="0.5 2"
              strokeLinecap="round"
            />
          </svg>

          <code
            className={`relative z-10 max-w-full bg-[#0a0f1c] px-1 py-0.5 text-center font-mono text-[10px] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap text-sky-300 transition-all duration-300 sm:px-3 sm:text-[12px] sm:font-semibold sm:tracking-tight ${
              copied
                ? "pointer-events-none opacity-0 blur-[2px]"
                : "blur-0 opacity-100"
            } ${codeClassName}`.trim()}
          >
            {command}
          </code>

          {/* Travelling satellite with signal pulse ring */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 z-20 inline-flex items-center justify-center text-sky-300 transition-[left,opacity,transform] duration-1400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOrbiting ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: isOrbiting
                ? `calc(100% - ${satelliteSize}px)`
                : `${-satelliteSize}px`,
              width: `${satelliteSize}px`,
              height: `${satelliteSize}px`,
              transform: `translateY(-50%) ${
                isOrbiting ? "translateX(0)" : "translateX(-8px)"
              }`,
            }}
          >
            <span className="relative drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]">
              <SatelliteMiniIcon size={satelliteSize} />
            </span>
          </span>
        </div>

        {/* Right: ALT readout + copy button */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2.5">
          <div className="hidden flex-col leading-none select-none sm:flex">
            <span className="font-mono text-[8px] font-semibold tracking-[0.22em] text-sky-400/70">
              ALT
            </span>
            <span className="mt-1 font-mono text-[11px] font-semibold tracking-[0.18em] text-sky-100">
              705KM
            </span>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-linear-to-b from-transparent via-sky-400/30 to-transparent sm:block"
          />

          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md border border-sky-400/40 bg-[#11182b] text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.1)] transition-colors hover:bg-[#172038] hover:text-sky-200 sm:h-7 sm:w-7 sm:rounded-lg"
            aria-label={
              copied ? "Copied install command" : "Copy install command"
            }
          >
            {copied ? (
              <Check className="size-2.5 sm:size-3" />
            ) : (
              <Copy className="size-2.5 sm:size-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
