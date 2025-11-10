/**
 * Token Counter Tool
 *
 * Estimates Claude token count using heuristics.
 * Note: This is an approximation. Actual token counts may vary.
 */

/**
 * Execute token counter tool
 *
 * @param {object} input - Tool input with text
 * @returns {string} - JSON string with token estimate
 */
export async function executeTokenCounter(input) {
  try {
    const { text } = input;

    if (text === undefined || text === null) {
      return JSON.stringify({
        success: false,
        error: 'text is required'
      });
    }

    const textStr = String(text);

    // Count various metrics
    const metrics = {
      characters: textStr.length,
      words: countWords(textStr),
      lines: textStr.split('\n').length,
      whitespace: (textStr.match(/\s/g) || []).length,
      alphanumeric: (textStr.match(/[a-zA-Z0-9]/g) || []).length
    };

    // Estimate tokens using multiple methods
    const estimates = {
      simple: estimateSimple(textStr, metrics),
      words_based: estimateWordsBased(metrics.words),
      chars_based: estimateCharsBased(metrics.characters)
    };

    // Use average of estimates
    const avgEstimate = Math.round(
      (estimates.simple + estimates.words_based + estimates.chars_based) / 3
    );

    return JSON.stringify({
      success: true,
      text_length: metrics.characters,
      metrics: metrics,
      token_estimate: avgEstimate,
      estimates: estimates,
      note: 'This is an approximation. Actual tokens may vary by ±20%',
      mode: 'real'
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Token counting failed',
      mode: 'real'
    });
  }
}

/**
 * Simple token estimation
 * Claude typically uses ~4 characters per token on average
 *
 * @param {string} text - Input text
 * @param {object} metrics - Text metrics
 * @returns {number} - Estimated tokens
 */
function estimateSimple(text, metrics) {
  // Account for different types of content
  const alphaRatio = metrics.alphanumeric / Math.max(1, metrics.characters);

  // Code/structured text has more tokens per character
  // Natural language has fewer tokens per character
  let charsPerToken = alphaRatio > 0.8 ? 3.5 : 4.2;

  // Adjust for very short or very long texts
  if (metrics.characters < 100) {
    charsPerToken *= 0.9; // Short texts tend to be more dense
  }

  return Math.max(1, Math.round(metrics.characters / charsPerToken));
}

/**
 * Words-based estimation
 * Claude typically uses ~0.75 tokens per word
 *
 * @param {number} wordCount - Word count
 * @returns {number} - Estimated tokens
 */
function estimateWordsBased(wordCount) {
  return Math.max(1, Math.round(wordCount * 0.75));
}

/**
 * Characters-based estimation
 * Using Claude's typical ratio of ~4 chars per token
 *
 * @param {number} charCount - Character count
 * @returns {number} - Estimated tokens
 */
function estimateCharsBased(charCount) {
  return Math.max(1, Math.round(charCount / 4));
}

/**
 * Count words in text
 *
 * @param {string} text - Input text
 * @returns {number} - Word count
 */
function countWords(text) {
  // Split on whitespace and filter empty strings
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Get detailed token analysis
 *
 * @param {string} text - Input text
 * @returns {object} - Detailed analysis
 */
export function analyzeTokens(text) {
  const lines = text.split('\n');

  const analysis = {
    total_lines: lines.length,
    non_empty_lines: lines.filter(l => l.trim()).length,
    longest_line: Math.max(...lines.map(l => l.length)),
    shortest_line: Math.min(...lines.filter(l => l.trim()).map(l => l.length)),
    lines_with_analysis: lines.slice(0, 10).map((line, idx) => ({
      line_number: idx + 1,
      length: line.length,
      words: countWords(line),
      estimated_tokens: Math.round(line.length / 4)
    }))
  };

  return analysis;
}

export default {
  executeTokenCounter,
  analyzeTokens
};
