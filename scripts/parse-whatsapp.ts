import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { messageSchema } from '../lib/data/schema';
import type { NormalizedMessage } from '../lib/data/types';

const BASE_INPUT_DIR = path.join(process.cwd(), 'data', 'input');
const EXPORT_CHAT_PATH = path.join(BASE_INPUT_DIR, 'whatsapp', '_chat.txt');
const LEGACY_CHAT_PATH = path.join(BASE_INPUT_DIR, 'whatsapp.txt');
const LEGACY_MEDIA_DIR = path.join(BASE_INPUT_DIR, 'media');
const OUTPUT_PATH = path.join(process.cwd(), 'dist', 'messages.jsonl');

const DEFAULT_LINE_REGEX = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2})(?:\s*[\u202f ]?[AP]M)?\s+-\s+([^:]+?):\s+(.*)$/;
const IOS_BRACKET_LINE_REGEX = /^\[(\d{2})\.(\d{2})\.(\d{4})[ ,]\s*(\d{2}):(\d{2})(?::(\d{2}))?\]\s+([^:]+):\s?(.*)$/;
const IOS_BRACKET_DETECT_REGEX = /^\[\d{2}\.\d{2}\.\d{4}[ ,]\s*\d{2}:\d{2}(:\d{2})?\]/;
const INVISIBLE_CHARS_REGEX = /[\u200e\u200f\ufeff\u202a-\u202e]/g;
const EMOJI_REGEX = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u;

type InputMode = 'export-folder' | 'legacy';
type ChatFormat = 'default' | 'ios-bracket';

async function ensureDist() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function sanitizeLine(line: string) {
  return line.replace(INVISIBLE_CHARS_REGEX, '');
}

function inferType(text: string, mediaIndex?: Map<string, NormalizedMessage['type']>): NormalizedMessage['type'] {
  const lower = text.toLowerCase();
  if (mediaIndex) {
    for (const [name, type] of mediaIndex.entries()) {
      if (lower.includes(name)) return type;
    }
  }
  if (lower.includes('omitted')) return 'image';
  if (lower.includes('sticker')) return 'sticker';
  return 'text';
}

function buildId(ts: string, sender: string, text: string, index: number) {
  const slug = text.slice(0, 12).replace(/\s+/g, '-');
  return `${Date.parse(ts)}-${sender.replace(/\s+/g, '')}-${index}-${slug}`;
}

function normalizeSender(sender: string) {
  return sender.replace(/\s+/g, ' ').trim();
}

function toIsoDate({
  day,
  month,
  year,
  hour,
  minute,
  second
}: {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  second?: string;
}) {
  const normalizedYear = year.length === 2 ? Number(`20${year}`) : Number(year);
  const date = new Date(Number(normalizedYear), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second ?? '0'));
  return date.toISOString();
}

function detectFormat(lines: string[]): ChatFormat {
  const sample = lines
    .map((line) => sanitizeLine(line))
    .filter((line) => Boolean(line.trim()))
    .slice(0, 200);

  if (sample.some((line) => IOS_BRACKET_DETECT_REGEX.test(line))) return 'ios-bracket';

  return 'default';
}

function resolveLineRegex(format: ChatFormat) {
  if (format === 'ios-bracket') return IOS_BRACKET_LINE_REGEX;
  return DEFAULT_LINE_REGEX;
}

export function parseLines(
  lines: string[],
  mediaIndex?: Map<string, NormalizedMessage['type']>,
  format: ChatFormat = 'default'
): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  let buffer: { ts: string; sender: string; content: string; rawLine: string } | null = null;

  const lineRegex = resolveLineRegex(format);
  const sanitizedLines = lines.map((line) => sanitizeLine(line));

  const flush = () => {
    if (!buffer) return;
    const text = buffer.content.trim();
    const hasEmoji = EMOJI_REGEX.test(text);
    const message: NormalizedMessage = {
      id: buildId(buffer.ts, buffer.sender, text, messages.length),
      ts: buffer.ts,
      sender: buffer.sender,
      text,
      type: inferType(text, mediaIndex),
      hasEmoji,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      isDeleted: text.toLowerCase().includes('bu mesaj silindi') || text.toLowerCase().includes('message deleted'),
      rawLineRef: buffer.rawLine
    };
    const result = messageSchema.safeParse(message);
    if (result.success) {
      messages.push(result.data);
    }
    buffer = null;
  };

  for (const line of sanitizedLines) {
    const match = line.match(lineRegex);
    if (match) {
      flush();
      if (format === 'ios-bracket') {
        const [, day, month, year, hour, minute, second, sender, content] = match;
        buffer = {
          ts: toIsoDate({ day, month, year, hour, minute, second }),
          sender: normalizeSender(sender),
          content: content.trim(),
          rawLine: line
        };
      } else {
        const dateParts = match[1].split(/[\/\.\-]/);
        const [day, month, year] = dateParts;
        const [hour, minute] = match[2].split(':');
        const second = undefined;
        buffer = {
          ts: toIsoDate({ day, month, year, hour, minute, second }),
          sender: normalizeSender(match[3]),
          content: match[4].trim(),
          rawLine: line
        };
      }
    } else if (buffer) {
      buffer.content += `\n${line}`;
    }
  }
  flush();
  return messages;
}

async function resolveInput(): Promise<{ chatPath: string; mediaIndex: Map<string, NormalizedMessage['type']>; mode: InputMode }>
{
  const hasExportChat = await fileExists(EXPORT_CHAT_PATH);
  const hasLegacyChat = await fileExists(LEGACY_CHAT_PATH);

  if (!hasExportChat && !hasLegacyChat) {
    throw new Error('WhatsApp chat dosyası bulunamadı: data/input/whatsapp/_chat.txt veya data/input/whatsapp.txt gereklidir.');
  }

  const mode: InputMode = hasExportChat ? 'export-folder' : 'legacy';
  const chatPath = hasExportChat ? EXPORT_CHAT_PATH : LEGACY_CHAT_PATH;
  const mediaDir = hasExportChat ? path.join(BASE_INPUT_DIR, 'whatsapp') : LEGACY_MEDIA_DIR;
  const mediaIndex = new Map<string, NormalizedMessage['type']>();

  try {
    const entries = await fs.readdir(mediaDir);
    entries
      .filter((file) => file !== '_chat.txt')
      .forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        const name = file.toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) mediaIndex.set(name, 'image');
        if (['.mp4', '.mov', '.mkv'].includes(ext)) mediaIndex.set(name, 'video');
        if (['.opus', '.m4a', '.mp3', '.ogg'].includes(ext)) mediaIndex.set(name, 'audio');
        if (ext === '.webp') mediaIndex.set(name, 'sticker');
      });
    console.log(`WhatsApp modu: ${mode} · ${mediaIndex.size} medya referansı bulundu (${mediaDir})`);
  } catch {
    console.warn(`Medya klasörü okunamadı (${mediaDir}), sadece metinler işlendi.`);
  }

  return { chatPath, mediaIndex, mode };
}

function maskSampleLine(line: string) {
  if (!line) return '[..] <NAME>: <TEXT>';
  const dateMasked = line
    .replace(IOS_BRACKET_DETECT_REGEX, '[..]')
    .replace(/^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+\d{1,2}:\d{2}(?:\s*[\u202f ]?[AP]M)?\s+-\s+/, '[..] ');
  const colonIndex = dateMasked.indexOf(':');
  if (colonIndex !== -1) {
    return `${dateMasked.slice(0, colonIndex).trim()} <NAME>: <TEXT>`;
  }
  return '[..] <NAME>: <TEXT>';
}

function buildFormatHint(sampleLine: string) {
  const masked = maskSampleLine(sampleLine);
  const supported =
    'Desteklenen formatlar: "12/01/2025, 09:12 - Kişi: Mesaj" · "1.02.25 10:01 - Kişi: Mesaj" · "[18.04.2025 13:42] Kişi: Mesaj"';
  return `WhatsApp export formatı tanınmadı veya regex eşleşmedi.\nİlk satır örneği (maskeli): ${masked}\n${supported}`;
}

export async function parseWhatsapp() {
  await ensureDist();
  const { chatPath, mediaIndex, mode } = await resolveInput();
  const content = await fs.readFile(chatPath, 'utf-8');
  const rawLines = content.split(/\r?\n/);
  const sanitizedLines = rawLines.map((line) => sanitizeLine(line));
  const format = detectFormat(sanitizedLines);
  const parsed = parseLines(sanitizedLines, mediaIndex, format);
  if (parsed.length === 0) {
    const sample = sanitizedLines.find((line) => Boolean(line.trim())) ?? '';
    throw new Error(buildFormatHint(sample));
  }
  const out = parsed.map((msg) => JSON.stringify(msg)).join('\n');
  await fs.writeFile(OUTPUT_PATH, out, 'utf-8');
  console.log(`Parsed ${parsed.length} messages (${mode}, ${format}) → ${OUTPUT_PATH}`);
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  parseWhatsapp().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
