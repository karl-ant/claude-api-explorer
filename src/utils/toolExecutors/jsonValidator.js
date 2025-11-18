/**
 * JSON Validator Tool
 *
 * Validates and formats JSON strings, providing helpful error messages.
 */

/**
 * Execute JSON validator tool
 *
 * @param {object} input - Tool input with json_string
 * @returns {string} - JSON string with validation result
 */
export async function executeJsonValidator(input) {
  try {
    const { json_string } = input;

    if (!json_string || typeof json_string !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'json_string is required and must be a string'
      });
    }

    // Try to parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(json_string);
    } catch (parseError) {
      // Extract error details
      const message = parseError.message || 'Invalid JSON';
      const match = message.match(/position (\d+)/);
      const position = match ? parseInt(match[1], 10) : null;

      return JSON.stringify({
        success: false,
        valid: false,
        error: message,
        error_position: position,
        preview: position ? getErrorContext(json_string, position) : null,
        mode: 'real'
      });
    }

    // JSON is valid - format it nicely
    const formatted = JSON.stringify(parsed, null, 2);

    // Analyze the JSON structure
    const analysis = analyzeJson(parsed);

    return JSON.stringify({
      success: true,
      valid: true,
      original_length: json_string.length,
      formatted_length: formatted.length,
      formatted: formatted,
      analysis: analysis,
      mode: 'real'
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Validation failed',
      mode: 'real'
    });
  }
}

/**
 * Get context around an error position in a string
 *
 * @param {string} str - The input string
 * @param {number} pos - Error position
 * @returns {object} - Error context
 */
function getErrorContext(str, pos) {
  const start = Math.max(0, pos - 20);
  const end = Math.min(str.length, pos + 20);
  const before = str.substring(start, pos);
  const after = str.substring(pos, end);

  return {
    before: before,
    error_char: str[pos] || 'EOF',
    after: after,
    position: pos
  };
}

/**
 * Analyze JSON structure
 *
 * @param {any} data - Parsed JSON data
 * @returns {object} - Analysis results
 */
function analyzeJson(data) {
  const analysis = {
    type: getType(data),
    size: 0,
    depth: 0
  };

  if (Array.isArray(data)) {
    analysis.size = data.length;
    analysis.depth = getDepth(data);
    analysis.item_types = getArrayItemTypes(data);
  } else if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    analysis.size = keys.length;
    analysis.depth = getDepth(data);
    analysis.keys = keys.length <= 20 ? keys : keys.slice(0, 20).concat(['...']);
  }

  return analysis;
}

/**
 * Get the type of a value
 *
 * @param {any} value - Value to check
 * @returns {string} - Type name
 */
function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Get array item types
 *
 * @param {Array} arr - Array to analyze
 * @returns {object} - Count of each type
 */
function getArrayItemTypes(arr) {
  const types = {};
  arr.forEach(item => {
    const type = getType(item);
    types[type] = (types[type] || 0) + 1;
  });
  return types;
}

/**
 * Calculate maximum depth of nested structure
 *
 * @param {any} data - Data to analyze
 * @param {number} currentDepth - Current depth
 * @returns {number} - Maximum depth
 */
function getDepth(data, currentDepth = 0) {
  if (data === null || typeof data !== 'object') {
    return currentDepth;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return currentDepth + 1;
    return Math.max(...data.map(item => getDepth(item, currentDepth + 1)));
  }

  const keys = Object.keys(data);
  if (keys.length === 0) return currentDepth + 1;
  return Math.max(...keys.map(key => getDepth(data[key], currentDepth + 1)));
}

export default {
  executeJsonValidator
};
