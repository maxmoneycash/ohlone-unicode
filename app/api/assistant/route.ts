import Anthropic from "@anthropic-ai/sdk";

import { getAssistantContext } from "@/lib/ohlone-data";
import type { Variety } from "@/lib/orthography";
import { VARIETY_ORDER } from "@/lib/orthography";

export const runtime = "nodejs";

type RequestBody = {
  mode?: "translate" | "grammar";
  query?: string;
  variety?: Variety;
};

function buildSystemPrompt(context: Awaited<ReturnType<typeof getAssistantContext>>) {
  return [
    "You are an Ohlone language assistant for a language preservation web app.",
    "Use only the supplied corpus, orthography rules, phonology notes, and suffix-oriented entries.",
    "Never invent unattested Ohlone words. If the corpus is insufficient, say so plainly.",
    "Preserve the correct glottal stop character ʼ (U+02BC).",
    "Do not collapse Mutsun phonemic capitals L, N, S, T into lowercase letters.",
    "When you infer something, label it as an inference.",
    "",
    `Parts of speech in the corpus: ${context.partsOfSpeech}`,
    "",
    "Suffix and reversive entries:",
    JSON.stringify(context.suffixEntries, null, 2),
    "",
    "Phonology inventory:",
    JSON.stringify(context.phonology, null, 2),
    "",
    "Dictionary:",
    JSON.stringify(context.dictionary, null, 2),
    "",
    "Orthography guide:",
    context.orthographyGuide,
    "",
    "Encoding analysis:",
    context.encodingAnalysis,
  ].join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const mode = body.mode;
  const query = body.query?.trim();
  const variety = body.variety;

  if (!mode || !query || !variety || !VARIETY_ORDER.includes(variety)) {
    return Response.json(
      { error: "mode, query, and a valid variety are required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured. Add it to your environment to enable Claude-powered translation and grammar help.",
      },
      { status: 503 },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const context = await getAssistantContext();
  const system = buildSystemPrompt(context);
  const model =
    mode === "grammar"
      ? process.env.ANTHROPIC_GRAMMAR_MODEL ?? "claude-opus-4-1"
      : process.env.ANTHROPIC_TRANSLATION_MODEL ?? "claude-sonnet-4-0";

  const taskPrompt =
    mode === "translate"
      ? `Translate or draft an Ohlone response for the ${variety} variety. Explain which forms are directly supported by the corpus and which parts remain uncertain.\n\nUser request:\n${query}`
      : `Explain the grammar for the ${variety} variety using the supplied corpus. Focus on suffixes, reversive forms, pronunciation, and attested examples when possible.\n\nUser request:\n${query}`;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system,
      messages: [
        {
          role: "user",
          content: taskPrompt,
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return Response.json({
      model,
      text,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Anthropic request failed.";
    const status =
      /credit balance is too low|purchase credits|billing/i.test(message)
        ? 503
        : /api key|authentication|unauthorized|forbidden/i.test(message)
          ? 401
          : 500;

    return Response.json(
      {
        error: message,
      },
      { status },
    );
  }
}
