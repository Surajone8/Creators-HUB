"use client";

import { useState } from "react";
import { Sparkles, Check, RefreshCw, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { GeneratedMetadataResult } from "@/types/ai";

interface AIMetadataAssistantProps {
  onApply: (metadata: { title: string; description: string; tags: string[] }) => void;
}

export function AIMetadataAssistant({ onApply }: AIMetadataAssistantProps) {
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [tone, setTone] = useState<"engaging" | "informative" | "entertaining" | "click-worthy" | "professional">("engaging");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedMetadataResult | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please enter a topic or video concept.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/youtube-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          summary,
          tone,
          candidateCount: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Ollama generation failed");
      }

      setResult(data.data);
      if (data.data.candidateTitles?.length > 0) {
        setSelectedTitle(data.data.candidateTitles[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to local Ollama runtime";
      setError(msg);
      toast.error("Ollama AI Error", msg);
    } finally {
      setLoading(false);
    }
  }

  function handleApplyToComposer() {
    if (!result) return;
    onApply({
      title: selectedTitle || result.candidateTitles[0] || "",
      description: result.description,
      tags: result.tags,
    });
    toast.success("AI Metadata Applied", "Loaded generated title, description, and tags into composer.");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/60 text-red-400 border border-red-800/50">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Local AI Metadata Assistant</h4>
            <p className="text-xs text-zinc-400">Powered by Ollama runtime • Runs 100% locally on your machine</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg p-2.5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Topic or Hook *</label>
          <Input
            placeholder="e.g. Building an automated YouTube scheduler with Next.js & Ollama"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Tone</label>
          <Select value={tone} onChange={(e) => setTone(e.target.value as any)}>
            <option value="engaging">Engaging & Dynamic</option>
            <option value="informative">Informative & Technical</option>
            <option value="click-worthy">High-CTR / Click-worthy</option>
            <option value="entertaining">Entertaining / Casual</option>
            <option value="professional">Professional / Educational</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-300">Summary / Key Points (Optional)</label>
        <Textarea
          placeholder="Mention key highlights, timestamps or references for the description..."
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          onClick={handleGenerate}
          isLoading={loading}
          size="sm"
          className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {result ? "Regenerate with Local AI" : "Generate Metadata with Local AI"}
        </Button>

        {result && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleApplyToComposer}
            className="gap-1.5"
          >
            Apply to Form
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {result && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 mb-2 block">
              Suggested Titles (Select one):
            </label>
            <div className="space-y-2">
              {result.candidateTitles.map((title, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitle(title)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    selectedTitle === title
                      ? "border-red-500 bg-red-950/20 text-zinc-100 font-medium"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span>{title}</span>
                  {selectedTitle === title && <Check className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 mb-1 block">Suggested Description Preview:</label>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-400 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
              {result.description}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 mb-1.5 block">Suggested Tags:</label>
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
