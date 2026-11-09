import { z } from "zod";

export const generatedYouTubeMetadataSchema = z.object({
  candidateTitles: z.array(z.string().min(1).max(100)).min(1).max(10),
  description: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(50)).min(1).max(30),
  hashtags: z.array(z.string().min(1).max(50)).min(1).max(15),
  suggestedCategory: z.string().optional(),
});

export type GeneratedYouTubeMetadata = z.infer<typeof generatedYouTubeMetadataSchema>;
