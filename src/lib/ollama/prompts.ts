import { GenerateMetadataRequest } from "@/types/ai";

export const METADATA_SYSTEM_PROMPT = `You are an expert YouTube strategist and metadata specialist working inside Creator Hub.
Your task is to generate high-performing, click-worthy (yet truthful, non-clickbait) YouTube metadata for creators.
Always return your response strictly as valid JSON matching the requested structure without markdown fences or additional commentary.

JSON structure:
{
  "candidateTitles": ["Title 1", "Title 2", "Title 3"],
  "description": "Engaging description with timestamps outline, key takeaways, and call to action",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "suggestedCategory": "Science & Technology"
}`;

export function buildMetadataUserPrompt(input: GenerateMetadataRequest): string {
  const parts: string[] = [
    `Topic / Core Concept: ${input.topic}`,
  ];

  if (input.summary) {
    parts.push(`Summary: ${input.summary}`);
  }

  if (input.category) {
    parts.push(`Target Category: ${input.category}`);
  }

  if (input.intendedAudience) {
    parts.push(`Intended Audience: ${input.intendedAudience}`);
  }

  if (input.tone) {
    parts.push(`Tone: ${input.tone}`);
  }

  if (input.transcriptOrContext) {
    parts.push(`Context / Rough Transcript:\n${input.transcriptOrContext.slice(0, 3000)}`);
  }

  parts.push(
    `Generate ${input.candidateCount || 3} distinctive candidate titles (under 100 characters each), a structured YouTube description with clear sections, 10-15 relevant search tags, and 3-5 hashtags.`
  );

  return parts.join("\n\n");
}
