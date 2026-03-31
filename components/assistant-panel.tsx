"use client";

import { useState, useTransition } from "react";

import type { Variety } from "@/lib/orthography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Response } from "@/components/ui/response";
import { Textarea } from "@/components/ui/textarea";

type AssistantPanelProps = {
  varieties: Variety[];
};

type AssistantMessage = {
  id: string;
  from: "user" | "assistant";
  text: string;
  model?: string | null;
};

export function AssistantPanel({ varieties }: AssistantPanelProps) {
  const [mode, setMode] = useState<"translate" | "grammar">("translate");
  const [variety, setVariety] = useState<Variety>("Mutsun");
  const [query, setQuery] = useState("Translate: our beautiful language");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const prompt = query.trim();
    if (!prompt) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const userMessage: AssistantMessage = {
          id: `user-${Date.now()}`,
          from: "user",
          text: prompt,
        };

        setMessages((current) => [...current, userMessage]);

        try {
          setError(null);
          const result = await fetch("/api/assistant", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode,
              variety,
              query: prompt,
            }),
          });

          const body = (await result.json()) as {
            error?: string;
            model?: string;
            text?: string;
          };

          if (!result.ok) {
            throw new Error(body.error ?? "Assistant request failed.");
          }

          setMessages((current) => [
            ...current,
            {
              id: `assistant-${Date.now()}`,
              from: "assistant",
              text: body.text ?? "No response returned.",
              model: body.model ?? null,
            },
          ]);
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : "Assistant request failed.",
          );
        }
      })();
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="section-shell space-y-4">
          <div className="small-label">Claude Guide</div>
          <h1 className="editorial-heading text-4xl text-[var(--color-parchment)] sm:text-5xl">
            Ask for translation drafts or grammar explanations grounded in the corpus.
          </h1>
          <p className="body-copy max-w-3xl">
            The assistant is instructed to stay inside the verified dictionary,
            orthography guide, and suffix notes instead of inventing unattested forms.
          </p>
        </div>

        <Card className="border-[var(--color-border)] bg-[var(--color-panel-muted)] py-0">
          <CardHeader>
            <div className="small-label">Use Cases</div>
            <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
              Good for explanation. Cautious for generation.
            </CardTitle>
            <CardDescription className="body-copy">
              Ask about suffixes, reversive forms, or pronunciation patterns.
              For translation, expect drafts with explicit uncertainty where the corpus is thin.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="section-shell space-y-5">
        <div className="grid gap-4 lg:grid-cols-[auto_0.8fr_1.4fr]">
          <div className="grid gap-2">
            <span className="small-label">Mode</span>
            <div className="flex gap-2">
              <Button
                variant={mode === "translate" ? "default" : "outline"}
                className={
                  mode === "translate"
                    ? ""
                    : "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"
                }
                onClick={() => setMode("translate")}
              >
                Translate
              </Button>
              <Button
                variant={mode === "grammar" ? "default" : "outline"}
                className={
                  mode === "grammar"
                    ? ""
                    : "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"
                }
                onClick={() => setMode("grammar")}
              >
                Explain grammar
              </Button>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="small-label">Variety</span>
            <select
              value={variety}
              onChange={(event) => setVariety(event.target.value as Variety)}
              className="h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 text-sm text-[var(--color-parchment)]"
            >
              {varieties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="small-label">Prompt</span>
            <Textarea
              rows={4}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-28 border-[var(--color-border)] bg-[var(--color-panel-muted)] px-4 py-3 text-base text-[var(--color-parchment)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSubmit}>{isPending ? "Thinking" : "Ask Claude"}</Button>
          <Button
            variant="outline"
            className="border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)] hover:text-[var(--color-parchment)]"
            onClick={() =>
              setQuery(
                mode === "translate"
                  ? "Translate: our beautiful language"
                  : "Explain how the Nrevers and Vrevers entries behave in the corpus.",
              )
            }
          >
            Load example
          </Button>
        </div>

        {error ? (
          <p className="rounded-xl border border-[var(--color-warning)] bg-[rgba(213,135,100,0.12)] px-4 py-3 text-sm text-[var(--color-parchment)]">
            {error}
          </p>
        ) : null}
      </section>

      <Card className="border-[var(--color-border)] bg-card py-0">
        <CardHeader>
          <div className="small-label">Conversation</div>
          <CardTitle className="editorial-heading text-3xl text-[var(--color-parchment)]">
            Responses stay visible as a running record.
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[34rem] pb-6">
          <Conversation className="h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-muted)]">
            <ConversationContent className="space-y-1 p-4">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="No responses yet"
                  description="Ask a question about translation or grammar to start."
                  className="text-[var(--color-mist)]"
                />
              ) : null}

              {messages.map((message) => (
                <Message key={message.id} from={message.from}>
                  <MessageContent
                    variant={message.from === "assistant" ? "flat" : "contained"}
                    className={
                      message.from === "assistant"
                        ? "max-w-none rounded-xl border border-[var(--color-border)] bg-card px-4 py-3 text-[var(--color-parchment)]"
                        : "bg-[var(--color-ochre-soft)] text-[var(--color-parchment)]"
                    }
                  >
                    {message.model ? (
                      <Badge
                        variant="outline"
                        className="w-fit border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-mist)]"
                      >
                        {message.model}
                      </Badge>
                    ) : null}
                    {message.from === "assistant" ? (
                      <Response className="prose prose-invert max-w-none text-sm leading-7 text-[var(--color-parchment)]">
                        {message.text}
                      </Response>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.text}</p>
                    )}
                  </MessageContent>
                </Message>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </CardContent>
      </Card>
    </div>
  );
}
