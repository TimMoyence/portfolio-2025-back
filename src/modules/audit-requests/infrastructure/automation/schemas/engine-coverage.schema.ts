import { z } from 'zod';

export const engineScoreSchema = z.object({
  engine: z.enum(['google', 'bing_chatgpt', 'perplexity', 'gemini_overviews']),
  score: z.number().min(0).max(100),
  indexable: z.boolean(),
  strengths: z.array(z.string()).max(5),
  blockers: z.array(z.string()).max(5),
  opportunities: z.array(z.string()).max(5),
});

export const engineCoverageSchema = z.object({
  google: engineScoreSchema,
  bingChatGpt: engineScoreSchema,
  perplexity: engineScoreSchema,
  geminiOverviews: engineScoreSchema,
});
