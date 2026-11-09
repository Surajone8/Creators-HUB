import { ollamaClient } from "@/lib/ollama/client";
import { GenerateMetadataRequest, GeneratedMetadataResult, OllamaRuntimeStatus } from "@/types/ai";

/**
 * Local AI Metadata Generation Service
 * Encapsulates Ollama runtime calls, prompts, and output validation
 */
export class AIService {
  async getStatus(): Promise<OllamaRuntimeStatus> {
    return await ollamaClient.checkHealth();
  }

  async generateYouTubeMetadata(
    request: GenerateMetadataRequest,
    modelName?: string
  ): Promise<GeneratedMetadataResult> {
    return await ollamaClient.generateYouTubeMetadata(request, modelName);
  }
}

export const aiService = new AIService();
