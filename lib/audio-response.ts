import type { NextRequest } from "next/server";

type AudioResponseOptions = {
  bytes: Buffer;
  contentType: string;
  cacheControl: string;
  extraHeaders?: Record<string, string>;
};

function parseRangeHeader(rangeHeader: string, totalLength: number) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }

  const [, startText, endText] = match;
  let start = startText === "" ? undefined : Number(startText);
  let end = endText === "" ? undefined : Number(endText);

  if (start === undefined && end === undefined) {
    return null;
  }

  if (start === undefined && end !== undefined) {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }
    start = Math.max(totalLength - suffixLength, 0);
    end = totalLength - 1;
  } else if (start !== undefined && end === undefined) {
    end = totalLength - 1;
  }

  if (
    start === undefined ||
    end === undefined ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= totalLength
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, totalLength - 1),
  };
}

export function buildAudioResponse(
  request: NextRequest,
  {
    bytes,
    contentType,
    cacheControl,
    extraHeaders,
  }: AudioResponseOptions,
) {
  const totalLength = bytes.length;
  const rangeHeader = request.headers.get("range");
  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
    "Content-Type": contentType,
    ...extraHeaders,
  };

  if (!rangeHeader) {
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalLength),
      },
    });
  }

  const parsedRange = parseRangeHeader(rangeHeader, totalLength);
  if (!parsedRange) {
    return new Response("Requested Range Not Satisfiable", {
      status: 416,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes */${totalLength}`,
      },
    });
  }

  const { start, end } = parsedRange;
  const chunk = bytes.subarray(start, end + 1);

  return new Response(new Uint8Array(chunk), {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${start}-${end}/${totalLength}`,
    },
  });
}
