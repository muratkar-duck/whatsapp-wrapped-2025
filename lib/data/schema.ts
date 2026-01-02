import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string(),
  ts: z.string(),
  sender: z.string(),
  text: z.string(),
  type: z.enum(['text', 'image', 'video', 'audio', 'sticker', 'system']),
  hasEmoji: z.boolean(),
  wordCount: z.number(),
  isDeleted: z.boolean(),
  rawLineRef: z.string().optional()
});

export const gsmSchema = z.object({
  totalCalls: z.number().optional(),
  incomingCalls: z.number().optional(),
  outgoingCalls: z.number().optional(),
  answeredVoiceCallCount: z.number().optional(),
  answeredVideoCallCount: z.number().optional(),
  totalVoiceDurationSec: z.number().optional(),
  totalVideoDurationSec: z.number().optional(),
  longestCallSec: z.number().optional(),
  topCallDays: z.array(z.object({ date: z.string(), totalSec: z.number(), count: z.number() })).optional(),
  warning: z.string().optional()
});

export const reportSchema = z.object({
  ownerName: z.string(),
  partnerName: z.string(),
  year: z.number(),
  timezone: z.string(),
  language: z.string(),
  metrics: z.object({
    totalMessages: z.number(),
    dailyAverage: z.number(),
    activeDays: z.number(),
    peakDay: z.object({ date: z.string().nullable(), count: z.number().nullable() }),
    quietDay: z.object({ date: z.string().nullable(), count: z.number().nullable() }),
    longestStreak: z.object({ days: z.number(), start: z.string().nullable(), end: z.string().nullable() })
  }),
  gsm: gsmSchema,
  generatedAt: z.string()
});

export type ReportSchema = z.infer<typeof reportSchema>;
