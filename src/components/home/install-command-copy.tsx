"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AirplaneIcon } from "@/components/home/airplane-icon";

const SIDE_STRIPE_BACKGROUND =
  "repeating-linear-gradient(to right, rgba(248,250,252,0.96) 0 3px, transparent 3px 9px)";
const DASH_LINE_BACKGROUND =
  "repeating-linear-gradient(to right, rgba(248,250,252,0.96) 0 12px, transparent 12px 20px)";

type InstallCommandCopyProps = {
  command: string;
  className?: string;
  codeClassName?: string;
};

export function InstallCommandCopy({
  command,
  className = "",
  codeClassName = "",
}: InstallCommandCopyProps) {
  const taxiPlaneSize = 30;
  const [copied, setCopied] = useState(false);
  const [isTaxiing, setIsTaxiing] = useState(false);
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
    setIsTaxiing(false);

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsTaxiing(true);
      animationFrameRef.current = null;
    });

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      setIsTaxiing(false);
      resetTimerRef.current = null;
    }, 1800);
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-transparent p-1.5 sm:p-2 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-black/20" />

      {/* Main Grid Container */}
      <div className="relative grid min-h-[44px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-0.5 overflow-hidden rounded-md bg-[#121417] px-1 py-1.5 sm:gap-2 sm:px-1.5 sm:py-2">
        {/* Left Side: Stripes + 27 */}
        <div className="flex h-[24px] items-center">
          <div className="h-full w-3 sm:w-7">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: SIDE_STRIPE_BACKGROUND,
              }}
            />
          </div>
          <div className="flex items-center justify-center pr-0.5 pl-0 sm:pr-0.5 sm:pl-1.5">
            <span className="-rotate-270 text-[10px] leading-none font-semibold tracking-tight text-white select-none sm:text-[16px]">
              05
            </span>
          </div>
        </div>

        {/* Middle: Full Runway Dash + Floating Command */}
        <div className="relative flex min-w-0 items-center justify-center overflow-hidden px-0 sm:px-2">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
            style={{
              backgroundImage: DASH_LINE_BACKGROUND,
            }}
          />
          <code
            className={`relative z-10 max-w-full bg-[#121417] px-0.5 py-0.5 text-center text-[10px] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap text-orange-300 transition-all duration-300 sm:px-2 sm:text-[12px] sm:font-semibold sm:tracking-tight ${
              copied
                ? "pointer-events-none opacity-0 blur-[2px]"
                : "blur-0 opacity-100"
            } ${codeClassName}`.trim()}
          >
            {command}
          </code>

          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 z-20 inline-flex items-center justify-center text-orange-300 transition-[left,opacity,transform] duration-1400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isTaxiing ? "opacity-100" : "opacity-0"
            }`}
            style={{
              left: isTaxiing
                ? `calc(100% - ${taxiPlaneSize}px)`
                : `${-taxiPlaneSize}px`,
              width: `${taxiPlaneSize}px`,
              height: `${taxiPlaneSize}px`,
              transform: `translateY(-50%) ${
                isTaxiing
                  ? "translateX(0) rotate(90deg)"
                  : "translateX(-8px) rotate(86deg)"
              }`,
            }}
          >
            <span className="drop-shadow-[0_0_10px_rgba(15,23,42,0.35)]">
              <AirplaneIcon size={taxiPlaneSize} />
            </span>
          </span>
        </div>

        {/* Right Side: Button + Stripes */}
        <div className="flex h-[24px] items-center gap-0.5 pl-0 sm:gap-2 sm:pl-1">
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md border border-white/15 bg-[#1e2128] text-white shadow-sm transition-colors hover:bg-[#2a2e36] sm:h-7 sm:w-7 sm:rounded-lg"
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

          <div className="h-full w-3 sm:w-7">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: SIDE_STRIPE_BACKGROUND,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
