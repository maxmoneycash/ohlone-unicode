import type { NextRequest } from "next/server";

import { getCorpus } from "@/lib/ohlone-data";
import type { Variety } from "@/lib/orthography";

export async function GET(request: NextRequest) {
  const corpus = await getCorpus();
  const query = request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase() ?? "";
  const variety = request.nextUrl.searchParams.get("variety") as Variety | "all" | null;
  const pos = request.nextUrl.searchParams.get("pos");

  const entries = corpus.dictionary.filter((entry) => {
    if (variety && variety !== "all" && entry.variety !== variety) {
      return false;
    }

    if (pos && pos !== "all" && (entry.pos ?? "Unknown") !== pos) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      entry.word.toLocaleLowerCase().includes(query) ||
      entry.english.toLocaleLowerCase().includes(query) ||
      entry.ipaResolved.toLocaleLowerCase().includes(query)
    );
  });

  return Response.json({
    entries,
    varieties: corpus.varieties,
    partsOfSpeech: corpus.partsOfSpeech,
    sharedConcepts: corpus.sharedConcepts,
  });
}
