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

  it('keeps multiline content', () => {
    const lines = ['12/05/2025, 21:00 - Murat: Çok satırlı', 'mesaj denemesi'];
    const messages = parseLines(lines);
    expect(messages[0].text.includes('satırlı')).toBe(true);
    expect(messages[0].text.includes('\nmesaj denemesi')).toBe(true);
  });
});
