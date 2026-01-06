import { describe, it, expect } from '@jest/globals';
import { executeTokenCounter, analyzeTokens } from './tokenCounter.js';

describe('executeTokenCounter', () => {
  describe('happy path', () => {
    it('should count tokens for normal text', async () => {
      const input = { text: 'The quick brown fox jumps over the lazy dog.' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.token_estimate).toBeGreaterThan(0);
      expect(parsed.text_length).toBe(44);
      expect(parsed.mode).toBe('real');
    });

    it('should include all metrics', async () => {
      const input = { text: 'Hello world!\nThis is a test.' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.metrics).toBeDefined();
      expect(parsed.metrics.characters).toBe(28);
      expect(parsed.metrics.words).toBe(6);
      expect(parsed.metrics.lines).toBe(2);
      expect(parsed.metrics.whitespace).toBeGreaterThan(0);
      expect(parsed.metrics.alphanumeric).toBeGreaterThan(0);
    });

    it('should provide multiple estimation methods', async () => {
      const input = { text: 'A sample text for testing token estimation.' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.estimates).toBeDefined();
      expect(parsed.estimates.simple).toBeGreaterThan(0);
      expect(parsed.estimates.words_based).toBeGreaterThan(0);
      expect(parsed.estimates.chars_based).toBeGreaterThan(0);
    });

    it('should average the estimates', async () => {
      const input = { text: 'Testing the average calculation of token estimates.' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const expectedAvg = Math.round(
        (parsed.estimates.simple + parsed.estimates.words_based + parsed.estimates.chars_based) / 3
      );
      expect(parsed.token_estimate).toBe(expectedAvg);
    });

    it('should include approximation note', async () => {
      const input = { text: 'Any text will do.' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.note).toContain('approximation');
      expect(parsed.note).toContain('20%');
    });
  });

  describe('code and structured text', () => {
    it('should handle code with high alphanumeric ratio', async () => {
      const input = { text: 'function calculateSum(a,b){return a+b;}' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Code typically has a high proportion of alphanumeric characters
      const alphaRatio = parsed.metrics.alphanumeric / parsed.metrics.characters;
      // The actual ratio is ~0.77 due to punctuation like (){}+
      expect(alphaRatio).toBeGreaterThan(0.7);
    });

    it('should handle JSON data', async () => {
      const input = { text: '{"name": "test", "value": 42, "items": [1, 2, 3]}' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.token_estimate).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const input = { text: '' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.text_length).toBe(0);
      expect(parsed.metrics.characters).toBe(0);
      expect(parsed.metrics.words).toBe(0);
      expect(parsed.token_estimate).toBe(1); // Minimum of 1
    });

    it('should handle very short text (<100 chars)', async () => {
      const input = { text: 'Hi there!' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.metrics.characters).toBeLessThan(100);
      // Short texts use adjusted multiplier
      expect(parsed.token_estimate).toBeGreaterThan(0);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(1000);
      const input = { text: longText };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.metrics.words).toBe(1000);
      expect(parsed.token_estimate).toBeGreaterThan(500); // At least ~0.75 per word
    });

    it('should handle text with high alphanumeric ratio', async () => {
      const input = { text: 'abcdefghijklmnopqrstuvwxyz0123456789' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const alphaRatio = parsed.metrics.alphanumeric / parsed.metrics.characters;
      expect(alphaRatio).toBe(1);
    });

    it('should handle text with low alphanumeric ratio', async () => {
      const input = { text: '!@#$%^&*()_+-=[]{}|;:,.<>?' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const alphaRatio = parsed.metrics.alphanumeric / parsed.metrics.characters;
      expect(alphaRatio).toBe(0);
    });

    it('should handle whitespace-only text', async () => {
      const input = { text: '   \n\t   \n   ' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.metrics.words).toBe(0);
      expect(parsed.metrics.whitespace).toBeGreaterThan(0);
    });

    it('should handle multiline text', async () => {
      const input = { text: 'Line 1\nLine 2\nLine 3\nLine 4' };
      const result = await executeTokenCounter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.metrics.lines).toBe(4);
    });
  });

  describe('error handling', () => {
    it('should handle missing text parameter', async () => {
      const result = await executeTokenCounter({});
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should handle null text parameter', async () => {
      const result = await executeTokenCounter({ text: null });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should handle undefined text parameter', async () => {
      const result = await executeTokenCounter({ text: undefined });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should convert non-string to string', async () => {
      const result = await executeTokenCounter({ text: 12345 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.text_length).toBe(5);
    });

    it('should handle boolean as text', async () => {
      const result = await executeTokenCounter({ text: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.text_length).toBe(4); // "true"
    });
  });
});

describe('analyzeTokens', () => {
  it('should return detailed line analysis', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const analysis = analyzeTokens(text);

    expect(analysis.total_lines).toBe(3);
    expect(analysis.non_empty_lines).toBe(3);
    expect(analysis.lines_with_analysis).toHaveLength(3);
  });

  it('should find longest and shortest lines', () => {
    const text = 'Short\nThis is a much longer line\nMedium length';
    const analysis = analyzeTokens(text);

    expect(analysis.longest_line).toBe(26); // "This is a much longer line"
    expect(analysis.shortest_line).toBe(5); // "Short"
  });

  it('should limit analysis to first 10 lines', () => {
    const lines = Array(15).fill('Test line').join('\n');
    const analysis = analyzeTokens(lines);

    expect(analysis.total_lines).toBe(15);
    expect(analysis.lines_with_analysis.length).toBe(10);
  });

  it('should include line numbers starting from 1', () => {
    const text = 'Line A\nLine B';
    const analysis = analyzeTokens(text);

    expect(analysis.lines_with_analysis[0].line_number).toBe(1);
    expect(analysis.lines_with_analysis[1].line_number).toBe(2);
  });

  it('should estimate tokens per line', () => {
    const text = 'This is a sample line with about eight words.';
    const analysis = analyzeTokens(text);

    expect(analysis.lines_with_analysis[0].estimated_tokens).toBeGreaterThan(0);
    expect(analysis.lines_with_analysis[0].words).toBe(9);
    expect(analysis.lines_with_analysis[0].length).toBe(45);
  });

  it('should handle empty lines correctly', () => {
    const text = 'Line 1\n\nLine 3';
    const analysis = analyzeTokens(text);

    expect(analysis.total_lines).toBe(3);
    expect(analysis.non_empty_lines).toBe(2);
  });
});
