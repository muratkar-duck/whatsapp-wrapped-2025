export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'system';

export interface NormalizedMessage {
  id: string;
  ts: string;
  sender: string;
  text: string;
  type: MessageType;
  hasEmoji: boolean;
  wordCount: number;
  isDeleted: boolean;
  rawLineRef?: string;
}

export interface GSMStats {
  totalCalls?: number;
  incomingCalls?: number;
  outgoingCalls?: number;
  answeredVoiceCallCount?: number;
  answeredVideoCallCount?: number;
  totalVoiceDurationSec?: number;
  totalVideoDurationSec?: number;
  longestCallSec?: number;
  topCallDays?: { date: string; totalSec: number; count: number }[];
  warning?: string;
}

export interface ReportMetrics {
  totalMessages: number;
  dailyAverage: number;
  activeDays: number;
  peakDay: { date: string | null; count: number | null };
  quietDay: { date: string | null; count: number | null };
  longestStreak: { days: number; start: string | null; end: string | null };
}

export interface Report {
  ownerName: string;
  partnerName: string;
  year: number;
  timezone: string;
  language: string;
  metrics: ReportMetrics;
  gsm: GSMStats;
  generatedAt: string;
}
