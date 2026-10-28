"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildShareQuery,
  serializeShareBody,
  SHARE_MAX_LENGTH,
  SHARE_WARN_LENGTH,
} from "@/lib/passport/share-codec";
import { encodeShareBody } from "@/lib/passport/share-encode";
import type {
  DistanceUnit,
  PassportFlightInput,
} from "@/registry/blocks/flight-passport/flight-passport-stats";

export type ShareStatus = "empty" | "encoding" | "ready" | "long" | "too-long";

/**
 * Builds the share link ahead of time. Compression is async, and Safari
 * only allows clipboard writes during the click itself, so the link must
 * be ready before the button is pressed.
 */
export function usePassportShare({
  flights,
  exactDates,
  year,
  unit,
  color,
  footer,
}: {
  flights: readonly PassportFlightInput[];
  exactDates: boolean;
  year?: number;
  unit: DistanceUnit;
  color: string;
  footer?: string;
}) {
  const body = useMemo(
    () => serializeShareBody(flights, { exactDates }),
    [flights, exactDates],
  );
  const [encoded, setEncoded] = useState<{ body: string; d: string } | null>(
    null,
  );

  useEffect(() => {
    if (!body) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void encodeShareBody(body).then((d) => {
        if (!cancelled) setEncoded({ body, d });
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [body]);

  const d = encoded?.body === body ? encoded.d : null;
  let status: ShareStatus = "ready";
  if (!body) status = "empty";
  else if (!d) status = "encoding";
  else if (d.length > SHARE_MAX_LENGTH) status = "too-long";
  else if (d.length > SHARE_WARN_LENGTH) status = "long";

  const params =
    d && (status === "ready" || status === "long")
      ? { d, year, unit, color, footer }
      : null;
  return {
    status,
    length: d?.length ?? 0,
    params,
    pagePath: params ? `/passport?${buildShareQuery(params)}` : null,
  };
}
