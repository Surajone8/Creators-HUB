import { NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";
import { ApiResponse } from "@/types/api";
import { OllamaRuntimeStatus } from "@/types/ai";

export async function GET() {
  try {
    const status = await aiService.getStatus();
    return NextResponse.json<ApiResponse<OllamaRuntimeStatus>>({
      success: status.isAvailable,
      data: status,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "OLLAMA_OFFLINE",
          message: error instanceof Error ? error.message : "Ollama is not running locally",
        },
      },
      { status: 503 }
    );
  }
}
