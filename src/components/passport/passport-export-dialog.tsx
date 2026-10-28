"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import {
  Check,
  Copy,
  Download,
  Film,
  ImageDown,
  LoaderCircle,
  Share2,
  X,
} from "lucide-react";

import {
  DEFAULT_FOOTER_TEXT,
  FOOTER_TEXT_MAX_LENGTH,
  cleanFooterInput,
} from "@/lib/passport/footer-text";
import { DEFAULT_ROUTE_COLOR } from "@/lib/passport/route-colors";
import {
  buildShareImagePath,
  buildShareQuery,
  type PassportShareParams,
} from "@/lib/passport/share-codec";
import { cn } from "@/lib/utils";
import {
  computePassportStats,
  formatDistance,
  formatInteger,
  type DistanceUnit,
  type ResolvedFlight,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

type ExportFormat = "image" | "video";
type ShareTarget = "x" | "instagram" | "other";

type LoadedImage = { path: string; blob: Blob; url: string };

type VideoState =
  | { status: "idle" }
  | { status: "rendering"; progress: number }
  | { status: "ready"; file: File; url: string }
  | { status: "error"; message: string };

/** How long the footer text has to sit still before the preview redraws. */
const PREVIEW_SETTLE_MS = 400;

const actionButton =
  "pressable inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium whitespace-nowrap text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "pressable inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

/** X's mark, from Simple Icons (CC0). */
function XLogo({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

/** Instagram's camera glyph, drawn in outline like the other icons. */
function InstagramLogo({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** "My 2026 in flights: 16 flights, 61,100 km", as in the shared page's title. */
function buildPostText(
  flights: readonly ResolvedFlight[],
  year: number | undefined,
  unit: DistanceUnit,
) {
  const scope = year
    ? flights.filter((flight) => flight.year === year)
    : flights;
  const stats = computePassportStats(scope);
  const summary = `${formatInteger(stats.flights)} ${
    stats.flights === 1 ? "flight" : "flights"
  }, ${formatDistance(stats.distanceKm, unit)}`;
  return year
    ? `My ${year} in flights: ${summary}`
    : `My flight passport: ${summary}`;
}

function saveFile(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

/** The value once it has stopped changing for `delay` ms. */
function useSettledValue<T>(value: T, delay: number) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(settled, value)) return;
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, settled, delay]);
  return settled;
}

/**
 * Loads the passport image as a blob, so the preview, the download, the
 * copy and the share all use the same bytes. While a new image loads, the
 * last one stays available.
 */
function usePassportImage(path: string | null) {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    fetch(path, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Image request ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        setLoaded({ path, blob, url: URL.createObjectURL(blob) });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailedPath(path);
      });
    return () => controller.abort();
  }, [path, attempt]);

  useEffect(() => {
    if (!loaded) return;
    const { url } = loaded;
    return () => URL.revokeObjectURL(url);
  }, [loaded]);

  const status = !path
    ? "idle"
    : loaded?.path === path
      ? "ready"
      : failedPath === path
        ? "error"
        : "loading";
  const retry = () => {
    setFailedPath(null);
    setAttempt((value) => value + 1);
  };
  return { status, image: loaded, retry };
}

/** Makes the passport video in the browser; a different passport starts over. */
function usePassportVideo(
  flights: readonly ResolvedFlight[],
  params: PassportShareParams | null,
  filename: string,
) {
  const plateUrl = params
    ? buildShareImagePath(params, { kind: "card", plate: true })
    : null;
  const [state, setState] = useState<VideoState>({ status: "idle" });
  const [stateFor, setStateFor] = useState(plateUrl);
  if (stateFor !== plateUrl) {
    setStateFor(plateUrl);
    setState({ status: "idle" });
  }

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), [plateUrl]);
  const readyUrl = state.status === "ready" ? state.url : null;
  useEffect(() => {
    if (!readyUrl) return;
    return () => URL.revokeObjectURL(readyUrl);
  }, [readyUrl]);

  const start = async () => {
    if (!params || !plateUrl) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "rendering", progress: 0 });
    try {
      const { createPassportVideo, PassportVideoUnsupportedError } =
        await import("./passport-video");
      try {
        const video = await createPassportVideo({
          flights: params.year
            ? flights.filter((flight) => flight.year === params.year)
            : flights,
          plateUrl,
          color: params.color ?? DEFAULT_ROUTE_COLOR,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!controller.signal.aborted) {
              setState({ status: "rendering", progress });
            }
          },
        });
        // Cancelled, closed or changed while the file was being finished.
        if (controller.signal.aborted) return;
        const file = new File([video.blob], `${filename}.${video.extension}`, {
          type: video.blob.type,
        });
        setState({ status: "ready", file, url: URL.createObjectURL(file) });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message:
            error instanceof PassportVideoUnsupportedError
              ? "This browser can't make videos. Try Chrome, Edge or Safari."
              : "Couldn't make the video. Try again.",
        });
      }
    } catch {
      if (!controller.signal.aborted) {
        setState({
          status: "error",
          message: "Couldn't load the video maker. Try again.",
        });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: "idle" });
  };

  return { state, start, cancel };
}

/**
 * Previews the passport as the image or the video before anything is
 * saved, then downloads, copies or shares it. The owner can also set the
 * text at the end of the passport's bottom line here.
 */
export function PassportExportDialog({
  flights,
  params,
  footerText,
  onFooterTextChange,
  triggerClassName,
  iconSize = 12,
}: {
  /** Every flight in the passport; the video keeps the ones in `params.year`. */
  flights: readonly ResolvedFlight[];
  /** The share link's parameters, or null while there is no link. */
  params: PassportShareParams | null;
  /** The owner's footer text; leave both footer props out to show it read-only. */
  footerText?: string;
  onFooterTextChange?: (text: string) => void;
  triggerClassName?: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("image");
  const filename = `flight-passport${params?.year ? `-${params.year}` : ""}`;
  const imagePath = params
    ? buildShareImagePath(params, { kind: "card" })
    : null;
  const settledPath = useSettledValue(imagePath, PREVIEW_SETTLE_MS);
  const image = usePassportImage(open ? settledPath : null);
  const video = usePassportVideo(flights, params, filename);
  const year = params?.year;
  const unit = params?.unit ?? "km";
  const postText = useMemo(
    () => buildPostText(flights, year, unit),
    [flights, year, unit],
  );
  const pagePath = params ? `/passport?${buildShareQuery(params)}` : null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && video.state.status === "rendering") video.cancel();
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={!params}
          className={cn(
            triggerClassName,
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <ImageDown size={iconSize} aria-hidden="true" />
          Save image or video
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1400] bg-slate-950/40" />
        <Dialog.Content className="fade-rise fixed top-1/2 left-1/2 z-[1400] max-h-[calc(100dvh-32px)] w-[min(860px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl shadow-slate-900/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-mono text-lg font-medium tracking-tight">
                Save your passport
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Check how it looks, then download, copy or share it.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="pressable -m-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          {open ? (
            <ExportPanel
              format={format}
              onFormatChange={setFormat}
              filename={filename}
              image={image}
              imagePath={imagePath}
              video={video}
              postText={postText}
              pagePath={pagePath}
              footerText={footerText}
              onFooterTextChange={onFooterTextChange}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExportPanel({
  format,
  onFormatChange,
  filename,
  image,
  imagePath,
  video,
  postText,
  pagePath,
  footerText,
  onFooterTextChange,
}: {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  filename: string;
  image: ReturnType<typeof usePassportImage>;
  /** The image for the current settings; the preview may still show an older one. */
  imagePath: string | null;
  video: ReturnType<typeof usePassportVideo>;
  /** Text for a post about the passport. */
  postText: string;
  /** The passport's share link, to go with a post. */
  pagePath: string | null;
  footerText?: string;
  onFooterTextChange?: (text: string) => void;
}) {
  const [copy, setCopy] = useState<"idle" | "copied" | "error">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  // Actions wait for the image of the current settings, not the last one
  // still on screen while the footer text settles.
  const ready =
    image.image && image.image.path === imagePath ? image.image : null;
  const imageFile = useMemo(
    () =>
      ready
        ? new File([ready.blob], `${filename}.png`, { type: ready.blob.type })
        : null,
    [ready, filename],
  );
  const canCopyImage =
    typeof ClipboardItem !== "undefined" &&
    typeof navigator.clipboard?.write === "function";
  const videoFile = video.state.status === "ready" ? video.state.file : null;
  // The image, or the video once it's made.
  const shareFile = format === "image" ? imageFile : videoFile;
  // Only phones get the Share to buttons: their share sheet hands the file
  // to the X or Instagram app, which websites can't do on a computer.
  const canShareToApps =
    !!shareFile &&
    window.matchMedia("(pointer: coarse)").matches &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [shareFile] });

  /** Opens the share sheet; a post to X also gets the text and the passport link. */
  const shareTo = (target: ShareTarget) => {
    if (!shareFile) return;
    const pageUrl = pagePath
      ? new URL(pagePath, window.location.origin).href
      : window.location.href;
    const data: ShareData =
      target === "x"
        ? { files: [shareFile], text: `${postText} ${pageUrl}` }
        : target === "instagram"
          ? { files: [shareFile] }
          : { files: [shareFile], title: "My flight passport" };
    void navigator.share(data).catch(() => {});
  };

  const copyImage = () => {
    if (!ready) return;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    // The image is already loaded, so the write happens inside the click,
    // which Safari requires.
    navigator.clipboard
      .write([new ClipboardItem({ [ready.blob.type]: ready.blob })])
      .then(
        () => {
          setCopy("copied");
          copyTimer.current = setTimeout(() => setCopy("idle"), 2200);
        },
        () => setCopy("error"),
      );
  };

  // The last image stays on screen while a new one loads.
  const shownImage = image.image;
  const failed = image.status === "error";
  const busy =
    image.status === "loading" ||
    (!failed && !!image.image && !ready && !!imagePath);

  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)] sm:gap-6">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[min(340px,calc((100dvh-260px)*0.8))] overflow-hidden rounded-xl border border-slate-200 bg-[#faf9f3] sm:mx-0 sm:max-w-none">
        {format === "video" && video.state.status === "ready" ? (
          <video
            key={video.state.url}
            src={video.state.url}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="h-full w-full"
          />
        ) : shownImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob URL, not an optimizable asset
          <img
            src={shownImage.url}
            alt="Preview of your flight passport"
            className={cn(
              "h-full w-full object-contain transition-opacity",
              (busy || format === "video") && "opacity-50",
            )}
          />
        ) : null}
        {busy && !(format === "video" && video.state.status === "ready") ? (
          <span className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-600">
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
            {shownImage ? "Updating…" : "Loading preview…"}
          </span>
        ) : null}
        {failed && (format === "image" || video.state.status === "idle") ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600">
            Couldn&apos;t load the preview.
            <button
              type="button"
              onClick={image.retry}
              className={actionButton}
            >
              Try again
            </button>
          </span>
        ) : null}
        {format === "video" &&
        video.state.status === "idle" &&
        !busy &&
        !failed ? (
          <span className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 p-4 text-center text-sm text-slate-700 shadow-sm">
            Your flights fly in one by one, then the passport fills in.
            It&apos;s made in your browser, so nothing is uploaded.
          </span>
        ) : null}
        {video.state.status === "rendering" ? (
          <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-white/90 p-4 text-sm text-slate-700">
            <span className="tabular-nums">
              Making video {Math.round(video.state.progress * 100)}%
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-slate-200">
              <span
                className="block h-full rounded-full bg-slate-950"
                style={{ width: `${video.state.progress * 100}%` }}
              />
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <div
          role="group"
          aria-label="Format"
          className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        >
          {(
            [
              ["image", "Image", "PNG · 1080×1350"],
              [
                "video",
                "Video",
                `${
                  videoFile?.type.includes("webm") ? "WebM" : "MP4"
                } · 1080×1350`,
              ],
            ] as const
          ).map(([value, label, detail]) => (
            <button
              key={value}
              type="button"
              aria-pressed={format === value}
              onClick={() => onFormatChange(value)}
              className={cn(
                "pressable flex flex-col items-start rounded-md px-3 py-1.5 text-left",
                format === value
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:text-slate-950",
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span
                className={cn(
                  "font-mono text-[10px]",
                  format === value ? "text-slate-300" : "text-slate-500",
                )}
              >
                {detail}
              </span>
            </button>
          ))}
        </div>

        {onFooterTextChange ? (
          <div>
            <label
              htmlFor="passport-footer-text"
              className="text-sm font-medium text-slate-950"
            >
              Footer text
            </label>
            <input
              id="passport-footer-text"
              value={footerText ?? ""}
              onChange={(event) =>
                onFooterTextChange(cleanFooterInput(event.target.value))
              }
              placeholder={DEFAULT_FOOTER_TEXT}
              maxLength={FOOTER_TEXT_MAX_LENGTH}
              spellCheck={false}
              autoComplete="off"
              aria-describedby="passport-footer-help"
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-base text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none sm:text-sm"
            />
            <p
              id="passport-footer-help"
              className="mt-1.5 text-xs leading-5 text-slate-500"
            >
              Printed at the end of the passport&apos;s bottom line, like your
              name or handle. Letters, numbers and . @ _ - only. Share links
              carry it too.
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2">
          {format === "image" ? (
            <>
              <button
                type="button"
                disabled={!ready}
                onClick={() => ready && saveFile(ready.url, `${filename}.png`)}
                className={primaryButton}
              >
                <Download size={15} aria-hidden="true" />
                Download image
              </button>
              {canCopyImage ? (
                <button
                  type="button"
                  disabled={!ready}
                  onClick={copyImage}
                  className={actionButton}
                >
                  {copy === "copied" ? (
                    <Check size={15} className="pop-in" aria-hidden="true" />
                  ) : (
                    <Copy size={15} aria-hidden="true" />
                  )}
                  {copy === "copied" ? "Image copied" : "Copy image"}
                </button>
              ) : null}
            </>
          ) : video.state.status === "ready" ? (
            <>
              <button
                type="button"
                onClick={() =>
                  video.state.status === "ready" &&
                  saveFile(video.state.url, video.state.file.name)
                }
                className={primaryButton}
              >
                <Download size={15} aria-hidden="true" />
                Download video
              </button>
            </>
          ) : video.state.status === "rendering" ? (
            <button
              type="button"
              // The second click of a double click on Make video lands here.
              onClick={(event) => {
                if (event.detail <= 1) video.cancel();
              }}
              className={actionButton}
            >
              <X size={15} aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void video.start()}
              className={primaryButton}
            >
              <Film size={15} aria-hidden="true" />
              {video.state.status === "error" ? "Try again" : "Make video"}
            </button>
          )}
        </div>
        {canShareToApps ? (
          <div>
            <p
              id="passport-share-to-label"
              className="text-xs font-medium text-slate-700"
            >
              Share to
            </p>
            <div
              role="group"
              aria-labelledby="passport-share-to-label"
              className="mt-2 flex flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={() => shareTo("x")}
                aria-label={`Share the ${format} to X`}
                className={actionButton}
              >
                <XLogo size={14} />X
              </button>
              <button
                type="button"
                onClick={() => shareTo("instagram")}
                aria-label={`Share the ${format} to Instagram`}
                className={actionButton}
              >
                <InstagramLogo size={15} />
                Instagram
              </button>
              <button
                type="button"
                onClick={() => shareTo("other")}
                aria-label={`More ways to share the ${format}`}
                className={actionButton}
              >
                <Share2 size={15} aria-hidden="true" />
                More
              </button>
            </div>
          </div>
        ) : null}
        <p role="status" className="min-h-5 text-xs leading-5 text-slate-600">
          {format === "image" && copy === "error"
            ? "Couldn't copy the image. Download it instead."
            : format === "video" && video.state.status === "error"
              ? video.state.message
              : format === "video" && video.state.status === "ready"
                ? "Video ready. It plays above."
                : ""}
        </p>
      </div>
    </div>
  );
}
