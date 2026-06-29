/**
 * Static model catalog + capability matrix.
 *
 * This file is the single source of truth for which request features each
 * model supports. The UI (FullApp.js) and the request builder (AppContext.js)
 * both derive their guards from the helpers exported here — do not hardcode
 * model-ID lists anywhere else.
 *
 * Live metadata from GET /v1/models (max_tokens, display_name) is preferred at
 * runtime and merged over these entries; this file is the offline fallback and
 * the only place capability flags live.
 *
 * Verified against https://platform.claude.com/docs (models overview, effort,
 * adaptive-thinking, fast-mode) on 2026-06-29.
 *
 * Capability flags:
 *  - adaptiveThinking: accepts `thinking: { type: "adaptive" }`
 *  - manualThinking:   accepts `thinking: { type: "enabled", budget_tokens }`
 *                      (false ⇒ the API returns a 400 for manual budgets)
 *  - thinkingAlwaysOn: adaptive thinking cannot be disabled
 *  - xhighEffort:      accepts `output_config.effort: "xhigh"`
 *  - fastMode:         accepts `speed: "fast"` (+ fast-mode beta header)
 */

const DEFAULT_CAPABILITIES = {
  adaptiveThinking: false,
  manualThinking: true,
  thinkingAlwaysOn: false,
  xhighEffort: false,
  fastMode: false,
};

const modelsConfig = {
  "models": [
    {
      "id": "claude-opus-4-8",
      "name": "Claude Opus 4.8",
      "description": "Most capable Opus-tier model — adaptive thinking only, 1M context, 128k output",
      "pricing": { "input": 5, "output": 25 },
      "maxOutput": 128000,
      "capabilities": {
        "adaptiveThinking": true,
        "manualThinking": false,
        "xhighEffort": true,
        "fastMode": true,
        "fastModeNote": "Research preview · $10/$50 per MTok"
      }
    },
    {
      "id": "claude-fable-5",
      "name": "Claude Fable 5",
      "description": "Most capable widely released model — adaptive thinking always on, 1M context, Opus 4.7 tokenizer",
      "pricing": { "input": 10, "output": 50 },
      "maxOutput": 128000,
      "capabilities": {
        "adaptiveThinking": true,
        "manualThinking": false,
        "thinkingAlwaysOn": true,
        "xhighEffort": true
      }
    },
    {
      "id": "claude-sonnet-4-6",
      "name": "Claude Sonnet 4.6",
      "description": "1M context, adaptive thinking, best speed/intelligence balance",
      "pricing": { "input": 3, "output": 15 },
      "maxOutput": 128000,
      "capabilities": {
        "adaptiveThinking": true,
        "manualThinking": true
      }
    },
    {
      "id": "claude-haiku-4-5-20251001",
      "name": "Claude Haiku 4.5",
      "description": "Fastest model with near-frontier intelligence",
      "pricing": { "input": 1, "output": 5 },
      "maxOutput": 64000,
      "capabilities": {
        "manualThinking": true
      }
    },
    {
      "id": "claude-opus-4-7",
      "name": "Claude Opus 4.7 (Legacy)",
      "description": "Previous Opus flagship — adaptive thinking only, 1M context",
      "pricing": { "input": 5, "output": 25 },
      "maxOutput": 128000,
      "capabilities": {
        "adaptiveThinking": true,
        "manualThinking": false,
        "xhighEffort": true,
        "fastMode": true,
        "fastModeNote": "Deprecated — removed 2026-07-24"
      }
    },
    {
      "id": "claude-opus-4-6",
      "name": "Claude Opus 4.6 (Legacy)",
      "description": "Previous Opus generation — adaptive thinking, 1M context",
      "pricing": { "input": 5, "output": 25 },
      "maxOutput": 128000,
      "capabilities": {
        "adaptiveThinking": true,
        "manualThinking": true,
        "fastMode": true,
        "fastModeNote": "Deprecated — removed 2026-06-29"
      }
    },
    {
      "id": "claude-sonnet-4-5-20250929",
      "name": "Claude Sonnet 4.5 (Legacy)",
      "description": "Previous Sonnet generation",
      "pricing": { "input": 3, "output": 15 },
      "maxOutput": 64000,
      "capabilities": {
        "manualThinking": true
      }
    },
    {
      "id": "claude-opus-4-5-20251101",
      "name": "Claude Opus 4.5 (Legacy)",
      "description": "Previous Opus with enhanced capabilities",
      "pricing": { "input": 5, "output": 25 },
      "maxOutput": 64000,
      "capabilities": {
        "manualThinking": true
      }
    },
    {
      "id": "claude-opus-4-1-20250805",
      "name": "Claude Opus 4.1 (Deprecated)",
      "description": "Previous generation Opus with extended thinking",
      "pricing": { "input": 15, "output": 75 },
      "maxOutput": 32000,
      "deprecated": true,
      "deprecationNote": "Deprecated 2026-06-05 — retires 2026-08-05",
      "capabilities": {
        "manualThinking": true
      }
    }
  ]
};

/**
 * Returns the capability flags for a model ID.
 *
 * Unknown IDs (Internal Model Mode, or a model that shipped after this file)
 * return `null`: callers must treat that as "no guard" rather than "blocked",
 * so a model the static catalog hasn't caught up with is never disabled.
 */
export function getModelCapabilities(modelId) {
  const entry = modelsConfig.models.find(m => m.id === modelId);
  if (!entry) return null;
  return { ...DEFAULT_CAPABILITIES, ...(entry.capabilities || {}) };
}

const isKnown = (modelId) => modelsConfig.models.some(m => m.id === modelId);

/** Adaptive thinking (`thinking: { type: "adaptive" }`). Unknown models → permissive. */
export function supportsAdaptiveThinking(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps ? caps.adaptiveThinking : true;
}

/** True only when we KNOW the model rejects manual thinking budgets with a 400. */
export function manualThinkingBlocked(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps ? !caps.manualThinking : false;
}

/** Adaptive thinking is always on and cannot be disabled (Fable 5). */
export function thinkingAlwaysOn(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps ? caps.thinkingAlwaysOn : false;
}

/** `output_config.effort: "xhigh"`. Unknown models → permissive. */
export function supportsXhigh(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps ? caps.xhighEffort : true;
}

/** `speed: "fast"`. Unknown models → permissive. */
export function supportsFastMode(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps ? caps.fastMode : true;
}

/** UI-facing note for fast mode on a given model (deprecation/pricing), or null. */
export function fastModeNote(modelId) {
  const caps = getModelCapabilities(modelId);
  return caps?.fastModeNote || null;
}

/**
 * Human-readable, comma-separated list of catalog models with a capability flag,
 * e.g. modelNamesSupporting('xhighEffort') → "Claude Opus 4.8, Claude Fable 5, Claude Opus 4.7".
 * Use this in guard/help copy so the names can never drift from the matrix.
 */
export function modelNamesSupporting(flag) {
  return modelsConfig.models
    .filter(m => getModelCapabilities(m.id)[flag])
    .map(m => m.name.replace(/ \((Legacy|Deprecated)\)$/, ''))
    .join(', ');
}

export { isKnown as isKnownModel };

export default modelsConfig;
