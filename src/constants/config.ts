export const APP_CONFIG = {
  appName: "Creator Hub",
  version: "1.0.0",
  phase: "Phase 1 Baseline",
  defaultTimezone: "UTC",
  retention: {
    defaultStagingHours: 48,
    cleanupGracePeriodHours: 24,
  },
  ai: {
    recommendedModels: ["llama3.2", "mistral", "phi3", "qwen2.5"],
    defaultTemperature: 0.7,
    maxTitleCandidates: 5,
  },
} as const;
