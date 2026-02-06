import { describe, it, expect } from '@jest/globals';
import {
  TOOL_MODES,
  TOOL_REGISTRY,
  isToolAvailable,
  getToolMode,
  getToolsByCategory,
  getRequiredApiKeys
} from './toolConfig.js';

describe('isToolAvailable', () => {
  it('should return true for tool in demo mode without API key', () => {
    const result = isToolAvailable('calculator', TOOL_MODES.DEMO, {});
    expect(result).toBe(true);
  });

  it('should return true for tool in real mode without API key requirement', () => {
    const result = isToolAvailable('calculator', TOOL_MODES.REAL, {});
    expect(result).toBe(true);
  });

  it('should return false for tool in wrong mode', () => {
    // json_validator has hasDemo: false, so it's not available in demo mode
    const result = isToolAvailable('json_validator', TOOL_MODES.DEMO, {});
    expect(result).toBe(false);
  });

  it('should return true for tool in its supported mode', () => {
    // json_validator has hasReal: true
    const result = isToolAvailable('json_validator', TOOL_MODES.REAL, {});
    expect(result).toBe(true);
  });

  it('should return false for unknown tool', () => {
    const result = isToolAvailable('nonexistent_tool', TOOL_MODES.DEMO, {});
    expect(result).toBe(false);
  });

  it('should return false if tool does not support requested mode', () => {
    // json_validator only has real mode, not demo
    const result = isToolAvailable('json_validator', TOOL_MODES.DEMO, {});
    expect(result).toBe(false);
  });
});

describe('getToolMode', () => {
  it('should return preferred mode if available', () => {
    const result = getToolMode('calculator', TOOL_MODES.REAL, {});
    expect(result).toBe(TOOL_MODES.REAL);
  });

  it('should fallback to available mode when preferred is unavailable', () => {
    // json_validator has no demo mode, should fallback to real
    const result = getToolMode('json_validator', TOOL_MODES.DEMO, {});
    expect(result).toBe(TOOL_MODES.REAL);
  });

  it('should fallback to real mode if demo not available', () => {
    // json_validator only has real mode
    const result = getToolMode('json_validator', TOOL_MODES.DEMO, {});
    expect(result).toBe(TOOL_MODES.REAL);
  });

  it('should return demo mode for unknown tools', () => {
    const result = getToolMode('nonexistent_tool', TOOL_MODES.REAL, {});
    expect(result).toBe(TOOL_MODES.DEMO);
  });

  it('should return real mode for tools with only real implementation', () => {
    // code_formatter has hasDemo: false, hasReal: true
    const result = getToolMode('code_formatter', TOOL_MODES.REAL, {});
    expect(result).toBe(TOOL_MODES.REAL);
  });
});

describe('getToolsByCategory', () => {
  it('should return tools grouped by category', () => {
    const categories = getToolsByCategory();

    expect(categories).toBeDefined();
    expect(categories.utility).toBeDefined();
    expect(categories.developer).toBeDefined();
    expect(categories.external).toBeDefined();
  });

  it('should include developer tools in developer category', () => {
    const categories = getToolsByCategory();

    const developerToolNames = categories.developer.map(t => t.name);
    expect(developerToolNames).toContain('json_validator');
    expect(developerToolNames).toContain('code_formatter');
    expect(developerToolNames).toContain('token_counter');
    expect(developerToolNames).toContain('regex_tester');
  });

  it('should include calculator in utility category', () => {
    const categories = getToolsByCategory();

    const utilityToolNames = categories.utility.map(t => t.name);
    expect(utilityToolNames).toContain('calculator');
  });
});

describe('getRequiredApiKeys', () => {
  it('should return object with required API keys', () => {
    const apiKeys = getRequiredApiKeys();
    expect(typeof apiKeys).toBe('object');
  });

  it('should return empty object when no tools require API keys', () => {
    const apiKeys = getRequiredApiKeys();

    // All remaining tools use free APIs (no keys required)
    expect(Object.keys(apiKeys).length).toBe(0);
  });

  it('should only include tools with hasReal=true', () => {
    const apiKeys = getRequiredApiKeys();

    // All API keys in the result should be from tools that have hasReal: true
    Object.keys(apiKeys).forEach(keyName => {
      const toolsForKey = Object.values(TOOL_REGISTRY).filter(
        tool => tool.apiKeyName === keyName
      );

      // At least one tool using this key should have hasReal: true
      const hasRealTool = toolsForKey.some(tool => tool.hasReal);
      expect(hasRealTool).toBe(true);
    });
  });
});

describe('TOOL_REGISTRY', () => {
  it('should have all required fields for each tool', () => {
    Object.values(TOOL_REGISTRY).forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.displayName).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(typeof tool.hasDemo).toBe('boolean');
      expect(typeof tool.hasReal).toBe('boolean');
      expect(typeof tool.requiresApiKey).toBe('boolean');
      expect(tool.category).toBeDefined();
    });
  });

  it('should have at least one mode (demo or real) for each tool', () => {
    Object.values(TOOL_REGISTRY).forEach(tool => {
      expect(tool.hasDemo || tool.hasReal).toBe(true);
    });
  });
});
