import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";
import { ApiResponse } from "@/types/api";
import { GeneratedMetadataResult } from "@/types/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.topic || typeof body.topic !== "string") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "A valid 'topic' is required to generate YouTube metadata.",
          },
        },
        { status: 400 }
      );
    }

    const metadata = await aiService.generateYouTubeMetadata({
      topic: body.topic,
      summary: body.summary,
      category: body.category,
      intendedAudience: body.intendedAudience,
      tone: body.tone,
      transcriptOrContext: body.transcriptOrContext,
      candidateCount: body.candidateCount || 3,
    }, body.modelName);

    return NextResponse.json<ApiResponse<GeneratedMetadataResult>>({
      success: true,
      data: metadata,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate metadata";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "OLLAMA_GENERATION_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
