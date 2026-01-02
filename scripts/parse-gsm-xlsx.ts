import { promises as fs } from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import type { GSMStats } from '../lib/data/types';

const INPUT_PATH = path.join(process.cwd(), 'data', 'input', 'gsm.xlsx');
const OUTPUT_PATH = path.join(process.cwd(), 'dist', 'gsm.json');

async function ensureDist() {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
}

function normalizeNumber(raw?: string | number | null): string | null {
  if (!raw) return null;
  const str = String(raw).replace(/[^\d+]/g, '');
  if (str.startsWith('00')) return `+${str.slice(2)}`;
  if (str.startsWith('0') && !str.startsWith('+')) return `+90${str.slice(1)}`;
  if (str.startsWith('+')) return str;
  return `+${str}`;
}

async function parseGsmWorkbook(): Promise<GSMStats> {
  const stats: GSMStats = {
    totalCalls: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    answeredVoiceCallCount: 0,
    answeredVideoCallCount: 0,
    totalVoiceDurationSec: 0,
    totalVideoDurationSec: 0,
    longestCallSec: 0,
    topCallDays: []
  };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(INPUT_PATH);
    const sheet = workbook.worksheets[0];
    const headerRow = sheet.getRow(1).values as string[];

    const columnMap = {
      number: headerRow.findIndex((h) => typeof h === 'string' && /(numara|number|arad.*|arayan|aranan)/i.test(h as string)),
      duration: headerRow.findIndex((h) => typeof h === 'string' && /(süre|duration)/i.test(h as string)),
      type: headerRow.findIndex((h) => typeof h === 'string' && /(tip|type)/i.test(h as string)),
      direction: headerRow.findIndex((h) => typeof h === 'string' && /(giden|arama|direction)/i.test(h as string)),
      date: headerRow.findIndex((h) => typeof h === 'string' && /(tarih|date)/i.test(h as string))
    };

    sheet.eachRow((row, idx) => {
      if (idx === 1) return;
      const values = row.values as (string | number | null)[];
      const number = normalizeNumber(values[columnMap.number] as string);
      const duration = Number(values[columnMap.duration] ?? 0);
      const type = String(values[columnMap.type] ?? '').toLowerCase();
      const direction = String(values[columnMap.direction] ?? '').toLowerCase();
      const date = values[columnMap.date] ? new Date(values[columnMap.date] as string) : null;

      if (!number || Number.isNaN(duration)) return;
      stats.totalCalls = (stats.totalCalls ?? 0) + 1;
      if (direction.includes('gelen') || direction.includes('incoming')) stats.incomingCalls = (stats.incomingCalls ?? 0) + 1;
      if (direction.includes('giden') || direction.includes('outgoing')) stats.outgoingCalls = (stats.outgoingCalls ?? 0) + 1;
      if (type.includes('video')) {
        stats.answeredVideoCallCount = (stats.answeredVideoCallCount ?? 0) + 1;
        stats.totalVideoDurationSec = (stats.totalVideoDurationSec ?? 0) + duration;
      } else {
        stats.answeredVoiceCallCount = (stats.answeredVoiceCallCount ?? 0) + 1;
        stats.totalVoiceDurationSec = (stats.totalVoiceDurationSec ?? 0) + duration;
      }
      stats.longestCallSec = Math.max(stats.longestCallSec ?? 0, duration);
      if (date && !Number.isNaN(date.getTime())) {
        const key = date.toISOString().slice(0, 10);
        const existing = stats.topCallDays?.find((d) => d.date === key);
        if (existing) {
          existing.totalSec += duration;
          existing.count += 1;
        } else {
          stats.topCallDays?.push({ date: key, totalSec: duration, count: 1 });
        }
      }
    });

    stats.topCallDays = stats.topCallDays?.sort((a, b) => b.totalSec - a.totalSec).slice(0, 5);
    return stats;
  } catch (error) {
    console.warn('GSM dosyası okunamadı', error);
    return { warning: 'GSM dosyası okunamadı veya bulunamadı' };
  }
}

async function main() {
  await ensureDist();
  const stats = await parseGsmWorkbook();
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(stats, null, 2), 'utf-8');
  console.log(`GSM özet yazıldı → ${OUTPUT_PATH}`);
}

main();
