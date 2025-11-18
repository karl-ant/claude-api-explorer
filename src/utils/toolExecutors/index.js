/**
 * Tool Executor Router
 *
 * Routes tool execution between demo and real implementations
 * based on tool mode and availability.
 */

import { executeTool as executeDemoTool } from '../formatters.js';
import { TOOL_MODES, getToolMode, isToolAvailable } from '../../config/toolConfig.js';
import { executeCalculator } from './calculator.js';
import { executeJsonValidator } from './jsonValidator.js';
import { executeCodeFormatter } from './codeFormatter.js';
import { executeTokenCounter } from './tokenCounter.js';
import { executeRegexTester } from './regexTester.js';
import { executeWeather } from './weather.js';
import { executeWebSearch } from './search.js';

/**
 * Main tool executor that routes between demo and real implementations
 *
 * @param {string} toolName - Name of the tool to execute
 * @param {object} input - Tool input parameters
 * @param {string} preferredMode - Preferred execution mode ('demo' or 'real')
 * @param {object} apiKeys - Object containing API keys
 * @returns {string} - JSON string with tool result
 */
export async function executeTool(toolName, input, preferredMode = TOOL_MODES.DEMO, apiKeys = {}) {
  try {
    // Determine which mode to use for this tool
    const actualMode = getToolMode(toolName, preferredMode, apiKeys);

    // If using real mode and tool has a real implementation, use it
    if (actualMode === TOOL_MODES.REAL) {
      const result = await executeRealTool(toolName, input, apiKeys);
      if (result !== null) {
        return result;
      }
      // If real execution failed/unavailable, fall through to demo
    }

    // Use demo implementation
    return executeDemoTool(toolName, input);

  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);

    // Return error result
    return JSON.stringify({
      success: false,
      error: error.message || 'Tool execution failed',
      tool: toolName,
      mode: 'error'
    });
  }
}

/**
 * Execute real tool implementations
 *
 * @param {string} toolName - Name of the tool
 * @param {object} input - Tool input parameters
 * @param {object} apiKeys - API keys object
 * @returns {string|null} - JSON string result or null if not implemented
 */
async function executeRealTool(toolName, input, apiKeys) {
  switch (toolName) {
    case 'calculator':
      return await executeCalculator(input);

    case 'json_validator':
      return await executeJsonValidator(input);

    case 'code_formatter':
      return await executeCodeFormatter(input);

    case 'token_counter':
      return await executeTokenCounter(input);

    case 'regex_tester':
      return await executeRegexTester(input);

    case 'get_weather':
      return await executeWeather(input, apiKeys.openweathermap);

    case 'web_search':
      return await executeWebSearch(input, apiKeys.brave_search);

    case 'get_current_time':
      // This tool is already fully functional in demo mode
      // No separate real implementation needed
      return null;

    default:
      // No real implementation available
      return null;
  }
}

/**
 * Check if a tool can execute in real mode
 *
 * @param {string} toolName - Name of the tool
 * @param {object} apiKeys - API keys object
 * @returns {boolean} - Whether real execution is possible
 */
export function canExecuteReal(toolName, apiKeys = {}) {
  return isToolAvailable(toolName, TOOL_MODES.REAL, apiKeys);
}

export default {
  executeTool,
  canExecuteReal
};
