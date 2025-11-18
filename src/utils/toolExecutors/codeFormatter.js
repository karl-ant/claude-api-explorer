/**
 * Code Formatter Tool
 *
 * Formats code in various languages (JavaScript, Python, JSON) with proper indentation.
 */

/**
 * Execute code formatter tool
 *
 * @param {object} input - Tool input with code and language
 * @returns {string} - JSON string with formatted code
 */
export async function executeCodeFormatter(input) {
  try {
    const { code, language = 'javascript', indent_size = 2 } = input;

    if (!code || typeof code !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'code is required and must be a string'
      });
    }

    const supportedLanguages = ['javascript', 'python', 'json'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return JSON.stringify({
        success: false,
        error: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`
      });
    }

    let formatted;
    let formatMethod;

    switch (language.toLowerCase()) {
      case 'json':
        formatted = formatJson(code, indent_size);
        formatMethod = 'JSON.stringify';
        break;
      case 'javascript':
        formatted = formatJavaScript(code, indent_size);
        formatMethod = 'Basic indentation';
        break;
      case 'python':
        formatted = formatPython(code, indent_size);
        formatMethod = 'Basic indentation';
        break;
      default:
        throw new Error('Unsupported language');
    }

    return JSON.stringify({
      success: true,
      language: language,
      original_length: code.length,
      formatted_length: formatted.length,
      formatted: formatted,
      format_method: formatMethod,
      indent_size: indent_size,
      mode: 'real'
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Formatting failed',
      mode: 'real'
    });
  }
}

/**
 * Format JSON code
 *
 * @param {string} code - JSON code
 * @param {number} indentSize - Indent size
 * @returns {string} - Formatted code
 */
function formatJson(code, indentSize) {
  try {
    const parsed = JSON.parse(code);
    const indent = ' '.repeat(indentSize);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

/**
 * Format JavaScript code (basic indentation)
 *
 * @param {string} code - JavaScript code
 * @param {number} indentSize - Indent size
 * @returns {string} - Formatted code
 */
function formatJavaScript(code, indentSize) {
  const lines = code.split('\n');
  const indent = ' '.repeat(indentSize);
  let level = 0;
  const formatted = [];

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      formatted.push('');
      continue;
    }

    // Decrease indent for closing braces/brackets/parens
    if (/^[\]})]/.test(line)) {
      level = Math.max(0, level - 1);
    }

    // Add indented line
    formatted.push(indent.repeat(level) + line);

    // Increase indent for opening braces/brackets/parens
    const openCount = (line.match(/[\[{(]/g) || []).length;
    const closeCount = (line.match(/[\]})]/g) || []).length;
    level += openCount - closeCount;
    level = Math.max(0, level);
  }

  return formatted.join('\n');
}

/**
 * Format Python code (basic indentation)
 *
 * @param {string} code - Python code
 * @param {number} indentSize - Indent size
 * @returns {string} - Formatted code
 */
function formatPython(code, indentSize) {
  const lines = code.split('\n');
  const indent = ' '.repeat(indentSize);
  let level = 0;
  const formatted = [];

  for (let line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      formatted.push('');
      continue;
    }

    // Decrease indent for dedent keywords
    if (/^(elif|else|except|finally|case):/.test(trimmed)) {
      level = Math.max(0, level - 1);
    }

    // Add indented line
    formatted.push(indent.repeat(level) + trimmed);

    // Increase indent after colon (function/class/if/for/while/etc.)
    if (trimmed.endsWith(':')) {
      level++;
    }

    // Decrease indent after return/break/continue/pass if it's standalone
    if (/^(return|break|continue|pass)(\s|$)/.test(trimmed) && !trimmed.endsWith(':')) {
      // Check if next line is at same level or lower
      // This is a simplified heuristic
    }
  }

  return formatted.join('\n');
}

export default {
  executeCodeFormatter
};
