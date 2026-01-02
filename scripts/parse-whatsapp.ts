import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { messageSchema } from '../lib/data/schema';
import type { NormalizedMessage } from '../lib/data/types';

const WHATSAPP_PATH = path.join(process.cwd(), 'data', 'input', 'whatsapp.txt');
const OUTPUT_PATH = path.join(process.cwd(), 'dist', 'messages.jsonl');

const LINE_REGEX = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2})(?:\s*[\u202f ]?[AP]M)?\s+-\s+([^:]+?):\s+(.*)$/;
const EMOJI_REGEX = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u;

async function ensureDist() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
}

function normalizeType(text: string): NormalizedMessage['type'] {
  const lower = text.toLowerCase();
  if (lower.includes('omitted')) return 'image';
  return 'text';
}

function buildId(ts: string, sender: string, text: string, index: number) {
  const slug = text.slice(0, 12).replace(/\s+/g, '-');
  return `${Date.parse(ts)}-${sender.replace(/\s+/g, '')}-${index}-${slug}`;
}

export function parseLines(lines: string[]): NormalizedMessage[] {
  const messages: NormalizedMessage[] = [];
  let buffer: { date: string; time: string; sender: string; content: string } | null = null;

  const flush = () => {
    if (!buffer) return;
    const tsString = `${buffer.date} ${buffer.time}`;
    const ts = new Date(tsString).toISOString();
    const text = buffer.content.trim();
    const hasEmoji = EMOJI_REGEX.test(text);
    const message: NormalizedMessage = {
      id: buildId(tsString, buffer.sender, text, messages.length),
      ts,
      sender: buffer.sender,
      text,
      type: normalizeType(text),
      hasEmoji,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      isDeleted: text.toLowerCase().includes('bu mesaj silindi') || text.toLowerCase().includes('message deleted'),
      rawLineRef: tsString
    };
    const result = messageSchema.safeParse(message);
    if (result.success) {
      messages.push(result.data);
    }
    buffer = null;
  };

  for (const line of lines) {
    const match = line.match(LINE_REGEX);
    if (match) {
      flush();
      buffer = {
        date: match[1],
        time: match[2],
        sender: match[3].trim(),
        content: match[4].trim()
      };
    } else if (buffer) {
      buffer.content += `\n${line}`;
    }
  }
  flush();
  return messages;
}

export async function parseWhatsapp() {
  await ensureDist();
  try {
    const content = await fs.readFile(WHATSAPP_PATH, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const parsed = parseLines(lines);
    const out = parsed.map((msg) => JSON.stringify(msg)).join('\n');
    await fs.writeFile(OUTPUT_PATH, out, 'utf-8');
    console.log(`Parsed ${parsed.length} messages → ${OUTPUT_PATH}`);
  } catch (error) {
    console.warn('WhatsApp dosyası okunamadı, messages.jsonl boş üretilecek', error);
    await fs.writeFile(OUTPUT_PATH, '', 'utf-8');
  }
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  parseWhatsapp();
}
