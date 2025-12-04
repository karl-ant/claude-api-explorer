import { describe, it, expect } from '@jest/globals';
import {
  formatTokenCount,
  truncateText,
  extractMessageText,
  getImageMediaType,
  formatJSON
} from './formatters.js';

describe('formatTokenCount', () => {
  it('should format large numbers with k suffix', () => {
    expect(formatTokenCount(1500)).toBe('1.5k');
    expect(formatTokenCount(2000)).toBe('2.0k');
    expect(formatTokenCount(10500)).toBe('10.5k');
  });

  it('should format small numbers without suffix', () => {
    expect(formatTokenCount(500)).toBe('500');
    expect(formatTokenCount(999)).toBe('999');
    expect(formatTokenCount(100)).toBe('100');
  });

  it('should handle zero and null values', () => {
    expect(formatTokenCount(0)).toBe('0');
    expect(formatTokenCount(null)).toBe('0');
    expect(formatTokenCount(undefined)).toBe('0');
  });

  it('should handle exactly 1000', () => {
    expect(formatTokenCount(1000)).toBe('1.0k');
  });
});

describe('truncateText', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that exceeds the maximum length';
    const result = truncateText(longText, 20);
    expect(result).toBe('This is a very long ...');
    expect(result.length).toBe(23); // 20 + '...'
  });

  it('should not truncate short text', () => {
    const shortText = 'Short text';
    const result = truncateText(shortText, 20);
    expect(result).toBe('Short text');
  });

  it('should handle exact length', () => {
    const text = '12345';
    const result = truncateText(text, 5);
    expect(result).toBe('12345');
  });

  it('should use default maxLength of 50', () => {
    const text = 'a'.repeat(60);
    const result = truncateText(text);
    expect(result.length).toBe(53); // 50 + '...'
  });
});

describe('extractMessageText', () => {
  it('should extract text from string content', () => {
    const content = 'Simple text message';
    const result = extractMessageText(content);
    expect(result).toBe('Simple text message');
  });

  it('should extract text from array with text blocks', () => {
    const content = [
      { type: 'text', text: 'Hello' },
      { type: 'text', text: 'World' }
    ];
    const result = extractMessageText(content);
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should format tool_use blocks', () => {
    const content = [
      { type: 'text', text: 'Using calculator' },
      { type: 'tool_use', name: 'calculator', input: { expression: '2+2' } }
    ];
    const result = extractMessageText(content);
    expect(result).toContain('Using calculator');
    expect(result).toContain('[Tool Use: calculator]');
    expect(result).toContain('Input:');
    expect(result).toContain('2+2');
  });

  it('should handle empty content', () => {
    expect(extractMessageText('')).toBe('');
    expect(extractMessageText([])).toBe('');
  });

  it('should filter out empty blocks', () => {
    const content = [
      { type: 'text', text: 'Hello' },
      { type: 'unknown', data: 'ignored' },
      { type: 'text', text: 'World' }
    ];
    const result = extractMessageText(content);
    expect(result).toContain('Hello');
    expect(result).toContain('World');
    expect(result).not.toContain('unknown');
  });
});

describe('getImageMediaType', () => {
  it('should return correct media type for JPEG', () => {
    expect(getImageMediaType({ type: 'image/jpeg' })).toBe('image/jpeg');
    expect(getImageMediaType({ type: 'image/jpg' })).toBe('image/jpeg');
  });

  it('should return correct media type for PNG', () => {
    expect(getImageMediaType({ type: 'image/png' })).toBe('image/png');
  });

  it('should return correct media type for GIF', () => {
    expect(getImageMediaType({ type: 'image/gif' })).toBe('image/gif');
  });

  it('should return correct media type for WebP', () => {
    expect(getImageMediaType({ type: 'image/webp' })).toBe('image/webp');
  });

  it('should default to JPEG for unknown types', () => {
    expect(getImageMediaType({ type: 'image/unknown' })).toBe('image/jpeg');
    expect(getImageMediaType({ type: 'application/pdf' })).toBe('image/jpeg');
  });
});

describe('formatJSON', () => {
  it('should format JSON with indentation', () => {
    const obj = { name: 'test', value: 42 };
    const result = formatJSON(obj);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
  });

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = formatJSON(obj);
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
    expect(result).toContain('"c"');
  });
});
