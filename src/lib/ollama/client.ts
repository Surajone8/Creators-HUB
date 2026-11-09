import { env } from "@/config/env";
import { GenerateMetadataRequest, GeneratedMetadataResult, OllamaRuntimeStatus } from "@/types/ai";
import { METADATA_SYSTEM_PROMPT, buildMetadataUserPrompt } from "./prompts";
import { generatedYouTubeMetadataSchema } from "./schema";

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl = env.OLLAMA_BASE_URL, defaultModel = env.OLLAMA_DEFAULT_MODEL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultModel = defaultModel;
  }

  /**
   * Health check and runtime information for local Ollama instance
   */
  async checkHealth(): Promise<OllamaRuntimeStatus> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // short timeout for local check
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return {
          isAvailable: false,
          endpoint: this.baseUrl,
          currentModel: this.defaultModel,
          availableModels: [],
          error: `Ollama returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models.map((m: { name: string }) => m.name) : [];

      return {
        isAvailable: true,
        endpoint: this.baseUrl,
        currentModel: this.defaultModel,
        availableModels: models,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to connect to Ollama runtime";
      return {
        isAvailable: false,
        endpoint: this.baseUrl,
        currentModel: this.defaultModel,
        availableModels: [],
        error: message,
      };
    }
  }

  /**
   * Generate structured YouTube metadata using local model
   * Uses structured JSON response format and Zod validation
   */
  async generateYouTubeMetadata(
    request: GenerateMetadataRequest,
    modelName = this.defaultModel
  ): Promise<GeneratedMetadataResult> {
    const userPrompt = buildMetadataUserPrompt(request);

    const payload = {
      model: modelName,
      system: METADATA_SYSTEM_PROMPT,
      prompt: userPrompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.7,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000), // 60s timeout for local inference
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama generation failed [${response.status}]: ${errorText}`);
    }

    const json = await response.json();
    const rawContent = json.response;

    // Parse and validate using Zod to ensure safety
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      throw new Error("Local LLM did not return valid JSON format");
    }

    const validated = generatedYouTubeMetadataSchema.parse(parsedJson);

    return {
      candidateTitles: validated.candidateTitles,
      description: validated.description,
      tags: validated.tags,
      hashtags: validated.hashtags,
      suggestedCategory: validated.suggestedCategory,
      timestamp: new Date().toISOString(),
    };
  }
}

export const ollamaClient = new OllamaClient();
