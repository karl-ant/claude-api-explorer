/**
 * Enhanced Calculator Tool
 *
 * Supports mathematical expressions with functions and constants.
 * Uses safe evaluation without direct eval().
 */

/**
 * Execute calculator tool with enhanced expression support
 *
 * @param {object} input - Tool input with expression
 * @returns {string} - JSON string with result
 */
export async function executeCalculator(input) {
  try {
    const { expression } = input;

    if (!expression || typeof expression !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'Expression is required and must be a string'
      });
    }

    // Evaluate the expression safely
    const result = evaluateExpression(expression);

    return JSON.stringify({
      success: true,
      expression: expression,
      result: result,
      mode: 'real'
    });

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Calculation failed',
      expression: input.expression,
      mode: 'real'
    });
  }
}

/**
 * Safely evaluate a mathematical expression
 *
 * @param {string} expr - Mathematical expression
 * @returns {number} - Result of evaluation
 */
function evaluateExpression(expr) {
  // Remove whitespace
  expr = expr.trim();

  if (!expr) {
    throw new Error('Empty expression');
  }

  // Define math context with functions and constants
  const mathContext = {
    // Constants
    pi: Math.PI,
    e: Math.E,

    // Trigonometric functions
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,

    // Exponential and logarithmic
    exp: Math.exp,
    log: Math.log,
    log10: Math.log10,
    log2: Math.log2,

    // Power and root
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    pow: Math.pow,

    // Rounding
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    trunc: Math.trunc,

    // Min/Max
    min: Math.min,
    max: Math.max,

    // Random
    random: Math.random,

    // Sign
    sign: Math.sign
  };

  // Validate expression contains only allowed characters
  const allowedChars = /^[0-9+\-*/().,\s\w]+$/;
  if (!allowedChars.test(expr)) {
    throw new Error('Expression contains invalid characters');
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /require/i,
    /import/i,
    /export/i,
    /function/i,
    /eval/i,
    /constructor/i,
    /prototype/i,
    /__proto__/i,
    /\[.*\]/,  // Array access
    /window/i,
    /document/i,
    /global/i,
    /process/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(expr)) {
      throw new Error('Expression contains forbidden keywords');
    }
  }

  try {
    // Create a function with the math context
    const funcBody = `
      'use strict';
      with (mathContext) {
        return (${expr});
      }
    `;

    // Use Function constructor (safer than eval)
    const func = new Function('mathContext', funcBody);
    const result = func(mathContext);

    // Validate result
    if (typeof result !== 'number') {
      throw new Error('Expression did not evaluate to a number');
    }

    if (!isFinite(result)) {
      if (isNaN(result)) {
        throw new Error('Result is NaN (Not a Number)');
      } else {
        throw new Error('Result is infinity');
      }
    }

    return result;

  } catch (error) {
    // Provide user-friendly error messages
    if (error instanceof SyntaxError) {
      throw new Error(`Syntax error in expression: ${error.message}`);
    } else if (error instanceof ReferenceError) {
      throw new Error(`Unknown function or constant: ${error.message}`);
    } else {
      throw new Error(error.message || 'Failed to evaluate expression');
    }
  }
}

/**
 * Get help text for calculator functions
 *
 * @returns {string} - Help text describing available functions
 */
export function getCalculatorHelp() {
  return `
Available functions:
  - Trigonometric: sin, cos, tan, asin, acos, atan, atan2
  - Exponential: exp, log, log10, log2
  - Power/Root: sqrt, cbrt, pow
  - Rounding: abs, ceil, floor, round, trunc
  - Other: min, max, random, sign

Constants:
  - pi: π (3.14159...)
  - e: Euler's number (2.71828...)

Examples:
  - sqrt(16)
  - sin(pi / 2)
  - pow(2, 8)
  - log(e)
  - max(5, 10, 3)
  - 2 * pi * 5
  - (3 + 4) * sqrt(9)
  `.trim();
}

export default {
  executeCalculator,
  getCalculatorHelp
};
