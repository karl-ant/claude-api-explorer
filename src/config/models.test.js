import { describe, it, expect } from '@jest/globals';
import modelsConfig from './models.js';

describe('models configuration', () => {
  it('should have models array that is non-empty', () => {
    expect(modelsConfig.models).toBeDefined();
    expect(Array.isArray(modelsConfig.models)).toBe(true);
    expect(modelsConfig.models.length).toBeGreaterThan(0);
  });

  it('should have all required properties for each model', () => {
    modelsConfig.models.forEach(model => {
      expect(model.id).toBeDefined();
      expect(typeof model.id).toBe('string');

      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe('string');

      expect(model.description).toBeDefined();
      expect(typeof model.description).toBe('string');

      expect(model.pricing).toBeDefined();
      expect(typeof model.pricing).toBe('object');
    });
  });

  it('should have valid pricing structure for each model', () => {
    modelsConfig.models.forEach(model => {
      expect(model.pricing.input).toBeDefined();
      expect(typeof model.pricing.input).toBe('number');
      expect(model.pricing.input).toBeGreaterThan(0);

      expect(model.pricing.output).toBeDefined();
      expect(typeof model.pricing.output).toBe('number');
      expect(model.pricing.output).toBeGreaterThan(0);
    });
  });

  it('should have unique model IDs', () => {
    const ids = modelsConfig.models.map(model => model.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include current generation models', () => {
    const modelIds = modelsConfig.models.map(m => m.id);

    // Check for some current models
    expect(modelIds).toContain('claude-opus-4-20250514');
    expect(modelIds).toContain('claude-sonnet-4-20250514');
    expect(modelIds).toContain('claude-haiku-4-5');
  });

  it('should have output pricing higher than input pricing', () => {
    modelsConfig.models.forEach(model => {
      expect(model.pricing.output).toBeGreaterThan(model.pricing.input);
    });
  });
});
