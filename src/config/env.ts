import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder-project.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-anon-key"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Local Ollama Runtime
  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434"),
  OLLAMA_DEFAULT_MODEL: z.string().default("llama3.2"),

  // Google OAuth / YouTube API / Google Drive
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3000/api/accounts/youtube/callback"),

  // Storage / Security
  TOKEN_ENCRYPTION_SECRET: z.string().min(16).default("super-secret-encryption-key-32chars"),
  MEDIA_STAGING_RETENTION_HOURS: z.coerce.number().default(48),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  OLLAMA_DEFAULT_MODEL: process.env.OLLAMA_DEFAULT_MODEL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  TOKEN_ENCRYPTION_SECRET: process.env.TOKEN_ENCRYPTION_SECRET,
  MEDIA_STAGING_RETENTION_HOURS: process.env.MEDIA_STAGING_RETENTION_HOURS,
});
