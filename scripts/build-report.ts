import { promises as fs } from 'node:fs';
import path from 'node:path';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { messageSchema, gsmSchema } from '../lib/data/schema';
import type { NormalizedMessage, Report } from '../lib/data/types';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const MESSAGES_PATH = path.join(process.cwd(), 'dist', 'messages.jsonl');
const GSM_PATH = path.join(process.cwd(), 'dist', 'gsm.json');
const OUTPUT_PATH = path.join(process.cwd(), 'dist', 'report.json');

interface Config {
  ownerName: string;
  partnerName: string;
  partnerPhoneE164?: string;
  timezone: string;
  year: number;
  language: string;
}

async function readConfig(): Promise<Config> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    console.warn('config.json okunamadı, varsayılan değerler kullanılacak');
    return {
      ownerName: 'Bilinmiyor',
      partnerName: 'Bilinmiyor',
      timezone: 'UTC',
      year: new Date().getFullYear(),
      language: 'tr'
    };
  }
}

async function readMessages(): Promise<NormalizedMessage[]> {
  try {
    const content = await fs.readFile(MESSAGES_PATH, 'utf-8');
    const lines = content.split(/\n/).filter(Boolean);
    return lines
      .map((line) => messageSchema.parse(JSON.parse(line)))
      .filter((msg) => parseISO(msg.ts).getFullYear());
  } catch (error) {
    console.warn('Mesaj verisi bulunamadı, boş liste ile devam ediliyor');
    return [];
  }
}

async function readGsm() {
  try {
    const content = await fs.readFile(GSM_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return gsmSchema.parse(parsed);
  } catch (error) {
    return { warning: 'GSM verisi yok' };
  }
}

function computeMetrics(messages: NormalizedMessage[]): Report['metrics'] {
  if (!messages.length) {
    return {
      totalMessages: 0,
      dailyAverage: 0,
      activeDays: 0,
      peakDay: { date: null, count: null },
      quietDay: { date: null, count: null },
      longestStreak: { days: 0, start: null, end: null }
    };
  }

  const byDay = new Map<string, NormalizedMessage[]>();
  messages.forEach((msg) => {
    const day = msg.ts.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(msg);
    byDay.set(day, list);
  });

  const entries = Array.from(byDay.entries());
  entries.sort(([a], [b]) => (a > b ? 1 : -1));
  const counts = entries.map(([date, msgs]) => ({ date, count: msgs.length }));
  const peakDay = counts.reduce((max, curr) => (curr.count > (max?.count ?? 0) ? curr : max), counts[0]);
  const quietDay = counts.reduce((min, curr) => (curr.count < (min?.count ?? Infinity) ? curr : min), counts[0]);

  let longestStreak = { days: 0, start: null as string | null, end: null as string | null };
  let currentStreak = { days: 0, start: null as string | null, previous: null as string | null };

  for (const { date } of counts) {
    if (!currentStreak.start) {
      currentStreak = { days: 1, start: date, previous: date };
      longestStreak = { days: 1, start: date, end: date };
      continue;
    }
    const diff = differenceInCalendarDays(new Date(date), new Date(currentStreak.previous as string));
    if (diff === 1) {
      currentStreak = { ...currentStreak, days: currentStreak.days + 1, previous: date };
    } else {
      currentStreak = { days: 1, start: date, previous: date };
    }
    if (currentStreak.days > longestStreak.days) {
      longestStreak = { days: currentStreak.days, start: currentStreak.start, end: date };
    }
  }

  const first = new Date(messages[0].ts);
  const last = new Date(messages[messages.length - 1].ts);
  const totalDays = Math.max(1, differenceInCalendarDays(last, first));
  return {
    totalMessages: messages.length,
    dailyAverage: messages.length / totalDays,
    activeDays: counts.length,
    peakDay: peakDay ?? { date: null, count: null },
    quietDay: quietDay ?? { date: null, count: null },
    longestStreak
  };
}

async function build() {
  const config = await readConfig();
  const messages = await readMessages();
  const gsm = await readGsm();

  const metrics = computeMetrics(messages);
  const report: Report = {
    ownerName: config.ownerName,
    partnerName: config.partnerName,
    year: config.year,
    timezone: config.timezone,
    language: config.language,
    metrics,
    gsm,
    generatedAt: new Date().toISOString()
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Rapor yazıldı → ${OUTPUT_PATH}`);
}

build();
