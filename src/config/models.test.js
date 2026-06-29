import { describe, it, expect } from '@jest/globals';
import modelsConfig, {
  getModelCapabilities,
  supportsAdaptiveThinking,
  manualThinkingBlocked,
  thinkingAlwaysOn,
  supportsXhigh,
  supportsFastMode,
  fastModeNote,
  modelNamesSupporting,
  isKnownModel
} from './models.js';

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

    // Current generation
    expect(modelIds).toContain('claude-fable-5');
    expect(modelIds).toContain('claude-opus-4-8');
    expect(modelIds).toContain('claude-sonnet-4-6');
    expect(modelIds).toContain('claude-haiku-4-5-20251001');

    // Legacy models still available
    expect(modelIds).toContain('claude-opus-4-7');
    expect(modelIds).toContain('claude-opus-4-6');
    expect(modelIds).toContain('claude-sonnet-4-5-20250929');
    expect(modelIds).toContain('claude-opus-4-5-20251101');
    expect(modelIds).toContain('claude-opus-4-1-20250805');
  });

  it('should not include retired models', () => {
    const modelIds = modelsConfig.models.map(m => m.id);
    // Retired 2026-06-15
    expect(modelIds).not.toContain('claude-sonnet-4-20250514');
    expect(modelIds).not.toContain('claude-opus-4-20250514');
    // Retired earlier
    expect(modelIds).not.toContain('claude-3-7-sonnet-20250219');
    expect(modelIds).not.toContain('claude-3-5-haiku-20241022');
    expect(modelIds).not.toContain('claude-3-haiku-20240307');
  });

  it('should flag deprecated models', () => {
    const opus41 = modelsConfig.models.find(m => m.id === 'claude-opus-4-1-20250805');
    expect(opus41.deprecated).toBe(true);
    expect(opus41.deprecationNote).toBeDefined();
  });

  it('should have the current flagship first', () => {
    expect(modelsConfig.models[0].id).toBe('claude-opus-4-8');
  });

  it('should have maxOutput field for each model', () => {
    modelsConfig.models.forEach(model => {
      expect(model.maxOutput).toBeDefined();
      expect(typeof model.maxOutput).toBe('number');
      expect(model.maxOutput).toBeGreaterThan(0);
    });
  });

  it('should have output pricing higher than input pricing', () => {
    modelsConfig.models.forEach(model => {
      expect(model.pricing.output).toBeGreaterThan(model.pricing.input);
    });
  });

  it('should use 128k max output on the 128k-output models', () => {
    ['claude-fable-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
      .forEach(id => {
        expect(modelsConfig.models.find(m => m.id === id).maxOutput).toBe(128000);
      });
  });
});

describe('model capability helpers', () => {
  it('getModelCapabilities fills in defaults for known models', () => {
    const haiku = getModelCapabilities('claude-haiku-4-5-20251001');
    expect(haiku).toEqual({
      adaptiveThinking: false,
      manualThinking: true,
      thinkingAlwaysOn: false,
      xhighEffort: false,
      fastMode: false,
    });
  });

  it('getModelCapabilities returns null for unknown models', () => {
    expect(getModelCapabilities('claude-internal-test-1')).toBeNull();
  });

  it('isKnownModel distinguishes catalog models from custom IDs', () => {
    expect(isKnownModel('claude-sonnet-4-6')).toBe(true);
    expect(isKnownModel('not-a-model')).toBe(false);
  });

  it('adaptive thinking is supported on Fable 5, Opus 4.8/4.7/4.6, and Sonnet 4.6', () => {
    ['claude-fable-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6']
      .forEach(id => expect(supportsAdaptiveThinking(id)).toBe(true));
    ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101', 'claude-opus-4-1-20250805']
      .forEach(id => expect(supportsAdaptiveThinking(id)).toBe(false));
  });

  it('manual thinking budgets are blocked on adaptive-only models', () => {
    ['claude-fable-5', 'claude-opus-4-8', 'claude-opus-4-7']
      .forEach(id => expect(manualThinkingBlocked(id)).toBe(true));
    ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101']
      .forEach(id => expect(manualThinkingBlocked(id)).toBe(false));
  });

  it('thinking is always on for Fable 5 only', () => {
    expect(thinkingAlwaysOn('claude-fable-5')).toBe(true);
    expect(thinkingAlwaysOn('claude-opus-4-8')).toBe(false);
  });

  it('xhigh effort is limited to Fable 5 and Opus 4.8/4.7', () => {
    ['claude-fable-5', 'claude-opus-4-8', 'claude-opus-4-7']
      .forEach(id => expect(supportsXhigh(id)).toBe(true));
    ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']
      .forEach(id => expect(supportsXhigh(id)).toBe(false));
  });

  it('fast mode is limited to Opus 4.8/4.7/4.6', () => {
    ['claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6']
      .forEach(id => expect(supportsFastMode(id)).toBe(true));
    ['claude-fable-5', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']
      .forEach(id => expect(supportsFastMode(id)).toBe(false));
    expect(fastModeNote('claude-opus-4-7')).toMatch(/Deprecated/);
    expect(fastModeNote('claude-sonnet-4-6')).toBeNull();
  });

  it('modelNamesSupporting derives human-readable lists from the matrix (no Legacy/Deprecated suffix)', () => {
    const xhigh = modelNamesSupporting('xhighEffort');
    expect(xhigh).toContain('Claude Opus 4.8');
    expect(xhigh).toContain('Claude Fable 5');
    expect(xhigh).toContain('Claude Opus 4.7');
    expect(xhigh).not.toContain('Legacy');
    expect(xhigh).not.toContain('Sonnet');
    expect(modelNamesSupporting('fastMode')).toBe('Claude Opus 4.8, Claude Opus 4.7, Claude Opus 4.6');
  });

  it('unknown model IDs are never blocked (internal model mode / newer-than-catalog models)', () => {
    const id = 'claude-future-model';
    expect(supportsAdaptiveThinking(id)).toBe(true);
    expect(manualThinkingBlocked(id)).toBe(false);
    expect(supportsXhigh(id)).toBe(true);
    expect(supportsFastMode(id)).toBe(true);
    expect(thinkingAlwaysOn(id)).toBe(false);
  });
});
