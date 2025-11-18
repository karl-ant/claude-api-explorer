/**
 * Regex Tester Tool
 *
 * Test regular expressions against input text and return matches.
 */

/**
 * Execute regex tester tool
 *
 * @param {object} input - Tool input with pattern and text
 * @returns {string} - JSON string with match results
 */
export async function executeRegexTester(input) {
  try {
    const { pattern, text, flags = 'g' } = input;

    if (!pattern || typeof pattern !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'pattern is required and must be a string'
      });
    }

    if (text === undefined || text === null) {
      return JSON.stringify({
        success: false,
        error: 'text is required'
      });
    }

    const textStr = String(text);

    // Create regex object
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (regexError) {
      return JSON.stringify({
        success: false,
        valid_regex: false,
        error: `Invalid regex pattern: ${regexError.message}`,
        mode: 'real'
      });
    }

    // Find all matches
    const matches = [];
    let match;

    if (flags.includes('g')) {
      // Global flag - find all matches
      while ((match = regex.exec(textStr)) !== null) {
        matches.push(extractMatchInfo(match, textStr));

        // Prevent infinite loops with zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        // Safety limit
        if (matches.length >= 1000) {
          break;
        }
      }
    } else {
      // No global flag - find first match only
      match = regex.exec(textStr);
      if (match) {
        matches.push(extractMatchInfo(match, textStr));
      }
    }

    // Test method result
    const hasMatch = regex.test(textStr);

    // Get match statistics
    const stats = {
      total_matches: matches.length,
      has_match: hasMatch,
      pattern_length: pattern.length,
      text_length: textStr.length,
      flags: flags
    };

    return JSON.stringify({
      success: true,
      valid_regex: true,
      pattern: pattern,
      flags: flags,
      matches: matches.length > 100 ? matches.slice(0, 100) : matches,
      truncated: matches.length > 100,
      statistics: stats,
      mode: 'real'
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Regex testing failed',
      mode: 'real'
    });
  }
}

/**
 * Extract detailed information from a regex match
 *
 * @param {RegExpExecArray} match - Regex match result
 * @param {string} text - Original text
 * @returns {object} - Match information
 */
function extractMatchInfo(match, text) {
  const matchInfo = {
    match: match[0],
    index: match.index,
    length: match[0].length,
    groups: []
  };

  // Extract capturing groups
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      matchInfo.groups.push({
        group_number: i,
        value: match[i],
        length: match[i].length
      });
    }
  }

  // Named groups (if any)
  if (match.groups) {
    matchInfo.named_groups = match.groups;
  }

  // Context around the match
  const contextStart = Math.max(0, match.index - 20);
  const contextEnd = Math.min(text.length, match.index + match[0].length + 20);

  matchInfo.context = {
    before: text.substring(contextStart, match.index),
    match: match[0],
    after: text.substring(match.index + match[0].length, contextEnd)
  };

  return matchInfo;
}

/**
 * Validate regex pattern
 *
 * @param {string} pattern - Regex pattern
 * @param {string} flags - Regex flags
 * @returns {object} - Validation result
 */
export function validateRegex(pattern, flags = '') {
  try {
    new RegExp(pattern, flags);
    return {
      valid: true,
      pattern: pattern,
      flags: flags
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      pattern: pattern,
      flags: flags
    };
  }
}

/**
 * Common regex patterns library
 *
 * @returns {object} - Library of common patterns
 */
export function getCommonPatterns() {
  return {
    email: {
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      description: 'Email address'
    },
    url: {
      pattern: 'https?://[^\\s]+',
      description: 'HTTP/HTTPS URL'
    },
    phone_us: {
      pattern: '\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}',
      description: 'US phone number'
    },
    ip_address: {
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
      description: 'IPv4 address'
    },
    date_iso: {
      pattern: '\\d{4}-\\d{2}-\\d{2}',
      description: 'ISO date (YYYY-MM-DD)'
    },
    hex_color: {
      pattern: '#[0-9a-fA-F]{6}\\b',
      description: 'Hex color code'
    },
    uuid: {
      pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
      description: 'UUID'
    }
  };
}

export default {
  executeRegexTester,
  validateRegex,
  getCommonPatterns
};
