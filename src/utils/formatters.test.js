import { describe, it, expect } from '@jest/globals';
import {
  extractMessageText,
  getImageMediaType
} from './formatters.js';

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

  it('should render a tool_use-only response as a displayable string', () => {
    // v4.0: tool_use ends the turn — there is no client-side execution.
    // This is the contract that a tool_use response still renders something.
    const content = [
      { type: 'tool_use', id: 'toolu_1', name: 'lookup_order', input: { order_id: 'A-1' } }
    ];
    const result = extractMessageText(content);
    expect(result).toContain('[Tool Use: lookup_order]');
    expect(result.length).toBeGreaterThan(0);
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
