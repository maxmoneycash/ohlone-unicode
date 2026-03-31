import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { NextRequest } from "next/server";

import {
  ipaForEspeak,
  textToIpa,
  type Variety,
  VARIETY_ORDER,
} from "@/lib/orthography";
import { buildAudioResponse } from "@/lib/audio-response";
import { cartesiaConfigured, synthesizeWithCartesia } from "@/lib/tts-provider";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim();
  const varietyParam = request.nextUrl.searchParams.get("variety")?.trim();

  if (!text || !varietyParam || !VARIETY_ORDER.includes(varietyParam as Variety)) {
    return new Response("Valid text and variety query parameters are required.", {
      status: 400,
    });
  }

  const variety = varietyParam as Variety;
  const speed = Number(request.nextUrl.searchParams.get("speed") ?? "120");
  const clampedSpeed = Number.isFinite(speed) ? Math.min(Math.max(speed, 70), 180) : 120;
  const ipa = textToIpa(text, variety);
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "ohlone-speech-"));
  const outputFile = path.join(tempDirectory, "speech.wav");

  try {
    if (cartesiaConfigured()) {
      const result = await synthesizeWithCartesia(text, variety);

      return buildAudioResponse(request, {
        bytes: result.bytes,
        contentType: "audio/wav",
        cacheControl: "no-store",
        extraHeaders: {
          "X-Ohlone-IPA": encodeURIComponent(result.ipa),
          "X-Ohlone-TTS-Provider": result.provider,
        },
      });
    }

    await execFileAsync("espeak-ng", [
      "-v",
      "en",
      `-s${clampedSpeed}`,
      `[[${ipaForEspeak(ipa)}]]`,
      "-w",
      outputFile,
    ]);

    const bytes = await readFile(outputFile);
    return buildAudioResponse(request, {
      bytes,
      contentType: "audio/wav",
      cacheControl: "no-store",
      extraHeaders: {
        "X-Ohlone-IPA": encodeURIComponent(ipa),
        "X-Ohlone-TTS-Provider": "espeak-ng",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown synthesis failure.";

    return Response.json(
      {
        error:
          cartesiaConfigured() || message.includes("Cartesia")
            ? `Cartesia synthesis failed. ${message}`
            : "Unknown-word synthesis requires a Cartesia API key in production or espeak-ng installed locally.",
        ipa,
      },
      { status: 503 },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
}
