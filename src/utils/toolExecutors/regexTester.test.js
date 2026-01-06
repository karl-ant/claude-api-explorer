import { describe, it, expect } from '@jest/globals';
import { executeRegexTester, validateRegex, getCommonPatterns } from './regexTester.js';

describe('executeRegexTester', () => {
  describe('pattern matching', () => {
    it('should find all matches with global flag', async () => {
      const input = {
        pattern: '\\d+',
        text: 'abc123def456',
        flags: 'g'
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.valid_regex).toBe(true);
      expect(parsed.matches.length).toBe(2);
      expect(parsed.matches[0].match).toBe('123');
      expect(parsed.matches[1].match).toBe('456');
    });

    it('should find only first match without global flag', async () => {
      const input = {
        pattern: '\\d+',
        text: 'abc123def456',
        flags: ''
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.matches.length).toBe(1);
      expect(parsed.matches[0].match).toBe('123');
    });

    it('should handle no matches', async () => {
      const input = {
        pattern: 'xyz',
        text: 'abc',
        flags: 'g'
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.matches.length).toBe(0);
      expect(parsed.statistics.total_matches).toBe(0);
    });
  });

  describe('capturing groups', () => {
    it('should capture groups', async () => {
      const input = {
        pattern: '(\\w+)@(\\w+)',
        text: 'user@domain',
        flags: ''
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.matches[0].groups.length).toBe(2);
      expect(parsed.matches[0].groups[0].value).toBe('user');
      expect(parsed.matches[0].groups[1].value).toBe('domain');
    });

    it('should capture named groups', async () => {
      const input = {
        pattern: '(?<name>\\w+)',
        text: 'hello',
        flags: ''
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.matches[0].named_groups).toBeDefined();
      expect(parsed.matches[0].named_groups.name).toBe('hello');
    });
  });

  describe('error handling', () => {
    it('should reject invalid regex pattern', async () => {
      const input = {
        pattern: '[unclosed',
        text: 'test',
        flags: ''
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.valid_regex).toBe(false);
      expect(parsed.error).toContain('Invalid regex');
    });

    it('should handle missing pattern', async () => {
      const input = {
        text: 'test'
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });

    it('should handle missing text', async () => {
      const input = {
        pattern: '\\d+'
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain('required');
    });
  });

  describe('match information', () => {
    it('should include match context', async () => {
      const input = {
        pattern: 'test',
        text: 'this is a test string',
        flags: ''
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.matches[0].context).toBeDefined();
      expect(parsed.matches[0].context.before).toBe('this is a ');
      expect(parsed.matches[0].context.match).toBe('test');
      expect(parsed.matches[0].context.after).toBe(' string');
    });

    it('should include match statistics', async () => {
      const input = {
        pattern: '\\d+',
        text: 'a1b2c3',
        flags: 'g'
      };
      const result = await executeRegexTester(input);
      const parsed = JSON.parse(result);

      expect(parsed.statistics).toBeDefined();
      expect(parsed.statistics.total_matches).toBe(3);
      expect(parsed.statistics.flags).toBe('g');
    });
  });
});

describe('validateRegex', () => {
  it('should validate a correct pattern', () => {
    const result = validateRegex('\\d+', 'g');
    expect(result.valid).toBe(true);
    expect(result.pattern).toBe('\\d+');
    expect(result.flags).toBe('g');
  });

  it('should reject an invalid pattern', () => {
    const result = validateRegex('[unclosed', 'g');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('getCommonPatterns', () => {
  it('should return pattern library', () => {
    const patterns = getCommonPatterns();
    expect(patterns).toBeDefined();
    expect(patterns.email).toBeDefined();
    expect(patterns.url).toBeDefined();
    expect(patterns.phone_us).toBeDefined();
  });

  it('should include pattern and description for each', () => {
    const patterns = getCommonPatterns();
    Object.values(patterns).forEach(pattern => {
      expect(pattern.pattern).toBeDefined();
      expect(pattern.description).toBeDefined();
    });
  });

  it('email pattern should match valid emails', () => {
    const patterns = getCommonPatterns();
    const emailRegex = new RegExp(patterns.email.pattern);
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('user.name@domain.co.uk')).toBe(true);
  });
});
