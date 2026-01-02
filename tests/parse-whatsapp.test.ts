import { describe, expect, it } from 'vitest';
import { parseLines } from '../scripts/parse-whatsapp';

describe('parseLines', () => {
  it('parses iOS export', () => {
    const lines = [
      '12/01/2025, 09:12 - Murat: Günaydın!',
      '12/01/2025, 09:15 - Rümeysa: Günaydın, kahve içelim mi?'
    ];
    const messages = parseLines(lines);
    expect(messages).toHaveLength(2);
    expect(messages[0].sender).toBe('Murat');
    expect(messages[0].type).toBe('text');
  });

  it('parses android style with dots', () => {
    const lines = ['1.02.25 10:01 - Rümeysa: <Media omitted>'];
    const messages = parseLines(lines);
    expect(messages[0].type).toBe('image');
  });

  it('detects media type from filename', () => {
    const lines = ['10/02/2025, 21:30 - Murat: IMG-20250110-WA0001.jpg'];
    const mediaIndex = new Map<string, 'image'>([['img-20250110-wa0001.jpg', 'image']]);
    const messages = parseLines(lines, mediaIndex);
    expect(messages[0].type).toBe('image');
  });

  it('keeps multiline content', () => {
    const lines = ['12/05/2025, 21:00 - Murat: Çok satırlı', 'mesaj denemesi'];
    const messages = parseLines(lines);
    expect(messages[0].text.includes('satırlı')).toBe(true);
    expect(messages[0].text.includes('\nmesaj denemesi')).toBe(true);
  });
});
