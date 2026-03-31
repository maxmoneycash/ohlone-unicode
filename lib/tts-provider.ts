import { segmentWord, textToIpa, type Variety } from "@/lib/orthography"

const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes"
const CARTESIA_VERSION = "2025-04-16"
const DEFAULT_CARTESIA_MODEL = "sonic-3"
const DEFAULT_CARTESIA_VOICE_ID = "5ee9feff-1265-424a-9d7f-8e4d431a12c7"

function phonesForCartesia(ipa: string) {
  switch (ipa) {
    case "lʲ":
      return ["l", "j"]
    case "tʲ":
      return ["t", "j"]
    case "ʂ":
      return ["ʃ"]
    default:
      return [ipa]
  }
}

export function buildCartesiaTranscript(text: string, variety: Variety) {
  return text.replace(/[\p{L}\p{M}ʼʔ-]+/gu, (token) => {
    const phones = segmentWord(token, variety)
      .flatMap((segment) => phonesForCartesia(segment.ipa))
      .join("|")

    return phones ? `<<${phones}>>` : token
  })
}

export function cartesiaConfigured() {
  return Boolean(process.env.CARTESIA_API_KEY)
}

export async function synthesizeWithCartesia(text: string, variety: Variety) {
  const apiKey = process.env.CARTESIA_API_KEY

  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY is not configured.")
  }

  const ipa = textToIpa(text, variety)
  const response = await fetch(CARTESIA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": CARTESIA_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: process.env.CARTESIA_MODEL_ID ?? DEFAULT_CARTESIA_MODEL,
      transcript: buildCartesiaTranscript(text, variety),
      voice: {
        mode: "id",
        id: process.env.CARTESIA_VOICE_ID ?? DEFAULT_CARTESIA_VOICE_ID,
      },
      output_format: {
        container: "wav",
        encoding: "pcm_s16le",
        sample_rate: 44100,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || "Cartesia synthesis failed.")
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    ipa,
    provider: "cartesia" as const,
  }
}
