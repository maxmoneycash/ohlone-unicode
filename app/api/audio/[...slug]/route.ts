import { readFile } from "node:fs/promises";
import path from "node:path";

import type { NextRequest } from "next/server";
import { buildAudioResponse } from "@/lib/audio-response";
import audioIndex from "@/audio/audio_index.json";

export const runtime = "nodejs";

const trustedAudioFiles = new Set(
  audioIndex.map((entry: { audio_file: string }) => entry.audio_file),
);

export async function GET(request: NextRequest) {
  const relativePath = request.nextUrl.pathname.replace(/^\/api\/audio\//, "");
  const decodedPath = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .join("/");

  if (!decodedPath) {
    return new Response("Audio path is required.", { status: 400 });
  }

  const audioRoot = path.join(process.cwd(), "audio");
  const absolutePath = path.normalize(path.join(audioRoot, decodedPath));

  if (!absolutePath.startsWith(audioRoot)) {
    return new Response("Invalid audio path.", { status: 400 });
  }

  if (!trustedAudioFiles.has(decodedPath)) {
    return new Response("Audio file is not in the trusted audio index.", {
      status: 404,
    });
  }

  try {
    const bytes = await readFile(absolutePath);
    return buildAudioResponse(request, {
      bytes,
      contentType: "audio/wav",
      cacheControl: "public, max-age=31536000, immutable",
    });
  } catch {
    return new Response("Audio file not found.", { status: 404 });
  }
}
