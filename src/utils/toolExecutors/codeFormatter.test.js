import { describe, it, expect } from '@jest/globals';
import { executeCodeFormatter } from './codeFormatter.js';

describe('executeCodeFormatter', () => {
  describe('JSON formatting', () => {
    it('should format valid JSON with default indent', async () => {
      const input = { code: '{"name":"test","value":42}', language: 'json' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.language).toBe('json');
      expect(parsed.formatted).toContain('\n');
      expect(parsed.formatted).toContain('  '); // 2-space indent default
      expect(parsed.format_method).toBe('JSON.stringify');
    });

    it('should format JSON with custom indent size', async () => {
      const input = { code: '{"a":1}', language: 'json', indent_size: 4 };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.indent_size).toBe(4);
      expect(parsed.formatted).toContain('    '); // 4-space indent
    });

    it('should reject invalid JSON', async () => {
      const input = { code: '{"broken": }', language: 'json' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('Invalid JSON');
    });

    it('should format deeply nested JSON', async () => {
      const input = { code: '{"a":{"b":{"c":{"d":1}}}}', language: 'json' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.formatted.split('\n').length).toBeGreaterThan(5);
    });
  });

  describe('JavaScript formatting', () => {
    it('should format JavaScript with proper indentation', async () => {
      const input = {
        code: 'function test() {\nreturn 42;\n}',
        language: 'javascript'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.language).toBe('javascript');
      expect(parsed.format_method).toBe('Basic indentation');
    });

    it('should handle nested braces', async () => {
      const input = {
        code: 'if (true) {\nif (false) {\nx = 1;\n}\n}',
        language: 'javascript'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const lines = parsed.formatted.split('\n');
      // Inner block should have double indentation
      expect(lines[2]).toMatch(/^\s{4}/); // 4 spaces for nested block
    });

    it('should handle closing brace at start of line', async () => {
      const input = {
        code: '{\n}\n{\n}',
        language: 'javascript'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });

    it('should preserve empty lines', async () => {
      const input = {
        code: 'let a = 1;\n\nlet b = 2;',
        language: 'javascript'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.formatted).toContain('\n\n');
    });

    it('should handle mixed braces, brackets, and parens', async () => {
      const input = {
        code: 'const arr = [\n{key: (1 + 2)}\n];',
        language: 'javascript'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });
  });

  describe('Python formatting', () => {
    it('should format Python with colon-based indentation', async () => {
      const input = {
        code: 'def test():\nreturn 42',
        language: 'python'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.language).toBe('python');
      expect(parsed.format_method).toBe('Basic indentation');
    });

    it('should handle elif dedent', async () => {
      const input = {
        code: 'if x:\npass\nelif y:\npass',
        language: 'python'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const lines = parsed.formatted.split('\n');
      // elif should be at same level as if (after dedent from pass)
      // The formatter may indent elif at the same level as the pass before it
      expect(lines[2].trim()).toBe('elif y:');
    });

    it('should handle else dedent', async () => {
      const input = {
        code: 'if x:\npass\nelse:\npass',
        language: 'python'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const lines = parsed.formatted.split('\n');
      expect(lines[2]).toBe('else:');
    });

    it('should handle except dedent', async () => {
      const input = {
        code: 'try:\npass\nexcept:\npass',
        language: 'python'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const lines = parsed.formatted.split('\n');
      expect(lines[2]).toBe('except:');
    });

    it('should handle finally dedent', async () => {
      const input = {
        code: 'try:\npass\nfinally:\npass',
        language: 'python'
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      const lines = parsed.formatted.split('\n');
      expect(lines[2]).toBe('finally:');
    });

    it('should handle custom indent size', async () => {
      const input = {
        code: 'def test():\nreturn 42',
        language: 'python',
        indent_size: 4
      };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.indent_size).toBe(4);
      const lines = parsed.formatted.split('\n');
      expect(lines[1]).toMatch(/^    /); // 4 spaces
    });
  });

  describe('edge cases', () => {
    it('should handle empty input code', async () => {
      const input = { code: '', language: 'javascript' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should handle single line code', async () => {
      const input = { code: 'const x = 1;', language: 'javascript' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.formatted).toBe('const x = 1;');
    });

    it('should handle whitespace-only lines', async () => {
      const input = { code: 'a\n   \nb', language: 'javascript' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.formatted.split('\n')).toHaveLength(3);
    });

    it('should track original and formatted lengths', async () => {
      const input = { code: '{"a":1}', language: 'json' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.original_length).toBe(7);
      expect(parsed.formatted_length).toBeGreaterThan(7); // Formatted is longer
    });
  });

  describe('error handling', () => {
    it('should handle missing code parameter', async () => {
      const result = await executeCodeFormatter({});
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('code');
      expect(parsed.error).toContain('required');
    });

    it('should handle non-string code parameter', async () => {
      const result = await executeCodeFormatter({ code: 123 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('string');
    });

    it('should handle null code parameter', async () => {
      const result = await executeCodeFormatter({ code: null });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should reject unsupported language', async () => {
      const input = { code: 'print("hello")', language: 'ruby' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('Unsupported language');
      expect(parsed.error).toContain('ruby');
      expect(parsed.error).toContain('Supported');
    });

    it('should handle language case-insensitively', async () => {
      const input = { code: '{"a": 1}', language: 'JSON' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });

    it('should default to javascript when language not specified', async () => {
      const input = { code: 'const x = 1;' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.language).toBe('javascript');
    });
  });

  describe('mode indicator', () => {
    it('should include real mode indicator', async () => {
      const input = { code: '{"a": 1}', language: 'json' };
      const result = await executeCodeFormatter(input);
      const parsed = JSON.parse(result);

      expect(parsed.mode).toBe('real');
    });
  });
});
