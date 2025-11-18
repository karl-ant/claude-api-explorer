/**
 * Tool Configuration System
 *
 * Manages tool modes (demo vs real), API key requirements,
 * and tool availability based on configuration.
 */

export const TOOL_MODES = {
  DEMO: 'demo',
  REAL: 'real'
};

/**
 * Tool registry defining all available tools and their requirements
 */
export const TOOL_REGISTRY = {
  // Existing tools
  calculator: {
    name: 'calculator',
    displayName: 'Calculator',
    description: 'Perform mathematical calculations',
    hasDemo: true,
    hasReal: true,
    requiresApiKey: false,
    category: 'utility'
  },
  get_weather: {
    name: 'get_weather',
    displayName: 'Weather',
    description: 'Get current weather for a location',
    hasDemo: true,
    hasReal: true,
    requiresApiKey: true,
    apiKeyName: 'openweathermap',
    apiKeyLabel: 'OpenWeatherMap API Key',
    apiKeyUrl: 'https://openweathermap.org/api',
    category: 'external'
  },
  web_search: {
    name: 'web_search',
    displayName: 'Web Search',
    description: 'Search the web for information',
    hasDemo: true,
    hasReal: true,
    requiresApiKey: true,
    apiKeyName: 'brave_search',
    apiKeyLabel: 'Brave Search API Key',
    apiKeyUrl: 'https://brave.com/search/api/',
    category: 'external'
  },
  get_stock_price: {
    name: 'get_stock_price',
    displayName: 'Stock Price',
    description: 'Get current stock price',
    hasDemo: true,
    hasReal: false, // Not implementing in Phase 1
    requiresApiKey: true,
    apiKeyName: 'alpha_vantage',
    category: 'external'
  },
  send_email: {
    name: 'send_email',
    displayName: 'Send Email',
    description: 'Send an email',
    hasDemo: true,
    hasReal: false, // Not implementing (requires sensitive setup)
    requiresApiKey: true,
    category: 'external'
  },
  get_current_time: {
    name: 'get_current_time',
    displayName: 'Current Time',
    description: 'Get current time in timezone',
    hasDemo: false, // Already fully functional
    hasReal: true,
    requiresApiKey: false,
    category: 'utility'
  },
  file_search: {
    name: 'file_search',
    displayName: 'File Search',
    description: 'Search for files',
    hasDemo: true,
    hasReal: false, // Not implementing (security concerns)
    requiresApiKey: false,
    category: 'file'
  },
  database_query: {
    name: 'database_query',
    displayName: 'Database Query',
    description: 'Execute database queries',
    hasDemo: true,
    hasReal: false, // Not implementing (security concerns)
    requiresApiKey: false,
    category: 'database'
  },

  // New developer tools
  json_validator: {
    name: 'json_validator',
    displayName: 'JSON Validator',
    description: 'Validate and format JSON',
    hasDemo: false,
    hasReal: true,
    requiresApiKey: false,
    category: 'developer'
  },
  code_formatter: {
    name: 'code_formatter',
    displayName: 'Code Formatter',
    description: 'Format code (JavaScript, Python, JSON)',
    hasDemo: false,
    hasReal: true,
    requiresApiKey: false,
    category: 'developer'
  },
  token_counter: {
    name: 'token_counter',
    displayName: 'Token Counter',
    description: 'Estimate Claude token count',
    hasDemo: false,
    hasReal: true,
    requiresApiKey: false,
    category: 'developer'
  },
  regex_tester: {
    name: 'regex_tester',
    displayName: 'Regex Tester',
    description: 'Test regular expressions',
    hasDemo: false,
    hasReal: true,
    requiresApiKey: false,
    category: 'developer'
  }
};

/**
 * Get list of all required API keys based on tool availability
 */
export function getRequiredApiKeys() {
  const apiKeys = {};

  Object.values(TOOL_REGISTRY).forEach(tool => {
    if (tool.requiresApiKey && tool.hasReal && tool.apiKeyName) {
      apiKeys[tool.apiKeyName] = {
        name: tool.apiKeyName,
        label: tool.apiKeyLabel || tool.displayName + ' API Key',
        url: tool.apiKeyUrl || null,
        tools: [tool.name]
      };
    }
  });

  return apiKeys;
}

/**
 * Check if a tool is available in the given mode
 * @param {string} toolName - Name of the tool
 * @param {string} mode - 'demo' or 'real'
 * @param {object} apiKeys - Object with API keys
 * @returns {boolean} - Whether the tool is available
 */
export function isToolAvailable(toolName, mode, apiKeys = {}) {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    return false;
  }

  // Check if tool supports the requested mode
  if (mode === TOOL_MODES.DEMO && !tool.hasDemo) {
    return false;
  }

  if (mode === TOOL_MODES.REAL && !tool.hasReal) {
    return false;
  }

  // In real mode, check if API key is available when required
  if (mode === TOOL_MODES.REAL && tool.requiresApiKey) {
    const keyName = tool.apiKeyName;
    return Boolean(apiKeys[keyName]);
  }

  return true;
}

/**
 * Get display mode for a tool (which mode it will use)
 * @param {string} toolName - Name of the tool
 * @param {string} preferredMode - User's preferred mode ('demo' or 'real')
 * @param {object} apiKeys - Object with API keys
 * @returns {string} - Actual mode that will be used ('demo' or 'real')
 */
export function getToolMode(toolName, preferredMode, apiKeys = {}) {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    return TOOL_MODES.DEMO;
  }

  // If preferred mode is available, use it
  if (isToolAvailable(toolName, preferredMode, apiKeys)) {
    return preferredMode;
  }

  // Fallback: try real mode first, then demo
  if (isToolAvailable(toolName, TOOL_MODES.REAL, apiKeys)) {
    return TOOL_MODES.REAL;
  }

  if (isToolAvailable(toolName, TOOL_MODES.DEMO, apiKeys)) {
    return TOOL_MODES.DEMO;
  }

  return TOOL_MODES.DEMO; // Default fallback
}

/**
 * Get tools grouped by category
 */
export function getToolsByCategory() {
  const categories = {
    utility: [],
    developer: [],
    external: [],
    file: [],
    database: []
  };

  Object.values(TOOL_REGISTRY).forEach(tool => {
    if (categories[tool.category]) {
      categories[tool.category].push(tool);
    }
  });

  return categories;
}

export default {
  TOOL_MODES,
  TOOL_REGISTRY,
  getRequiredApiKeys,
  isToolAvailable,
  getToolMode,
  getToolsByCategory
};
