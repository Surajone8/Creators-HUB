/**
 * Types for Local LLM (Ollama) Integration
 * Reflects Section 4: Local LLM Content Generation
 */

export interface GenerateMetadataRequest {
  topic: string;
  summary?: string;
  category?: string;
  intendedAudience?: string;
  tone?: "engaging" | "informative" | "entertaining" | "click-worthy" | "professional";
  transcriptOrContext?: string;
  candidateCount?: number;
}

export interface GeneratedMetadataResult {
  candidateTitles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  suggestedCategory?: string;
  timestamp: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaRuntimeStatus {
  isAvailable: boolean;
  endpoint: string;
  currentModel: string;
  availableModels: string[];
  latencyMs?: number;
  error?: string;
}
