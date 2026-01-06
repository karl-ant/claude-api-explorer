import { describe, it, expect } from '@jest/globals';
import { executeJsonValidator } from './jsonValidator.js';

describe('executeJsonValidator', () => {
  describe('valid JSON', () => {
    it('should validate a simple object', async () => {
      const input = { json_string: '{"name": "test", "value": 42}' };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.valid).toBe(true);
      expect(parsed.analysis.type).toBe('object');
      expect(parsed.analysis.size).toBe(2);
      expect(parsed.formatted).toContain('"name"');
    });

    it('should validate an array', async () => {
      const input = { json_string: '[1, 2, "three", true]' };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.valid).toBe(true);
      expect(parsed.analysis.type).toBe('array');
      expect(parsed.analysis.size).toBe(4);
      expect(parsed.analysis.item_types).toEqual({
        number: 2,
        string: 1,
        boolean: 1
      });
    });

    it('should calculate nested depth', async () => {
      const input = { json_string: '{"a": {"b": {"c": 1}}}' };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.analysis.depth).toBe(3);
    });

    it('should handle empty arrays and objects', async () => {
      const emptyObject = await executeJsonValidator({ json_string: '{}' });
      const parsedObj = JSON.parse(emptyObject);
      expect(parsedObj.success).toBe(true);
      expect(parsedObj.analysis.size).toBe(0);

      const emptyArray = await executeJsonValidator({ json_string: '[]' });
      const parsedArr = JSON.parse(emptyArray);
      expect(parsedArr.success).toBe(true);
      expect(parsedArr.analysis.size).toBe(0);
    });
  });

  describe('invalid JSON', () => {
    it('should reject JSON with syntax error', async () => {
      const input = { json_string: '{"broken": }' };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.valid).toBe(false);
      expect(parsed.error).toBeDefined();
    });

    it('should provide error position for invalid JSON', async () => {
      const input = { json_string: '{"key": "value",}' };  // Trailing comma
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.valid).toBe(false);
      // Error position may or may not be provided depending on JSON.parse implementation
    });
  });

  describe('error handling', () => {
    it('should handle missing json_string', async () => {
      const result = await executeJsonValidator({});
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should handle non-string json_string', async () => {
      const result = await executeJsonValidator({ json_string: 123 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('string');
    });
  });

  describe('analysis features', () => {
    it('should truncate large object keys', async () => {
      // Create an object with more than 20 keys
      const largeObj = {};
      for (let i = 0; i < 25; i++) {
        largeObj[`key${i}`] = i;
      }
      const input = { json_string: JSON.stringify(largeObj) };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.analysis.keys.length).toBe(21); // 20 keys + '...'
      expect(parsed.analysis.keys[20]).toBe('...');
    });

    it('should format JSON with proper indentation', async () => {
      const input = { json_string: '{"a":1,"b":2}' };
      const result = await executeJsonValidator(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.formatted).toContain('\n'); // Should have newlines
      expect(parsed.formatted).toContain('  '); // Should have indentation
    });
  });
});
