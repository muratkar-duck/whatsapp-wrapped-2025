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

const LINE_REGEX = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2})(?:\s*[\u202f ]?[AP]M)?\s+-\s+([^:]+?):\s+(.*)$/;
const EMOJI_REGEX = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u;

type InputMode = 'export-folder' | 'legacy';

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

export function parseLines(lines: string[], mediaIndex?: Map<string, NormalizedMessage['type']>): NormalizedMessage[] {
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
      type: inferType(text, mediaIndex),
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

export async function parseWhatsapp() {
  await ensureDist();
  const { chatPath, mediaIndex, mode } = await resolveInput();
  const content = await fs.readFile(chatPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const parsed = parseLines(lines, mediaIndex);
  const out = parsed.map((msg) => JSON.stringify(msg)).join('\n');
  await fs.writeFile(OUTPUT_PATH, out, 'utf-8');
  console.log(`Parsed ${parsed.length} messages (${mode}) → ${OUTPUT_PATH}`);
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  parseWhatsapp().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
