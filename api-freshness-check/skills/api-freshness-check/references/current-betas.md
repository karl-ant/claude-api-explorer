# Current Anthropic Beta Headers

Source: [Anthropic Beta Headers](https://platform.claude.com/docs/en/api/beta-headers)

Last updated: 2026-06-29

## Active Beta Headers (relevant to this app)

| Header Value | Feature | Description |
|-------------|---------|-------------|
| `skills-2025-10-02` | Skills API | Create and manage custom skills |
| `files-api-2025-04-14` | Files API | Upload, list, and manage files |
| `computer-use-2025-11-24` | Computer Use | Computer use tool (Opus 4.5+) |
| `computer-use-2025-01-24` | Computer Use (legacy) | Computer use tool for older models |
| `compact-2026-01-12` | Compaction | Server-side context summarization |
| `context-1m-2025-08-07` | 1M Context Window | Legacy models only — 4.6+ have 1M natively, no header |
| `context-management-2025-06-27` | Context Management | Tool-result / thinking-block clearing |
| `interleaved-thinking-2025-05-14` | Interleaved Thinking | Thinking between tool calls |
| `advisor-tool-2026-03-01` | Advisor Tool | Pair an executor model with an advisor model mid-generation |
| `cache-diagnosis-2026-04-07` | Cache Diagnostics | `diagnostics.previous_message_id` → `cache_miss_reason` |
| `task-budgets-2026-03-13` | Task Budgets | Advisory token budget for an agentic loop (Opus 4.7+) |
| `fast-mode-2026-02-01` | Fast Mode | `speed: "fast"` (research preview) — auto-injected by the app |
| `output-300k-2026-03-24` | 300k Batch Output | Batch API only — not used by this app (Batches tab removed in v4.0) |

## Deprecated / Graduated Headers

These headers are no longer required or have graduated to GA:

| Header Value | Feature | Status |
|-------------|---------|--------|
| `prompt-caching-2024-07-31` | Prompt Caching | **Graduated** — automatic, no beta header |
| `code-execution-2025-08-25` | Code Execution | **Graduated** — GA, no beta header |
| `structured-outputs-2025-11-13` | Structured Outputs | **Graduated** — GA via `output_config.format` |
| `web-search-*`, `web-fetch-*`, `memory-*`, `tool-search-*`, `effort-*`, `fine-grained-tool-streaming-*` | Server tools / effort | **Graduated** — GA |
| `computer-use-2024-10-22` | Computer Use | **Superseded** by `computer-use-2025-11-24` / `-2025-01-24` |
| `max-tokens-3-5-sonnet-2024-07-15` | Extended Max Tokens | **Legacy** — only applied to Claude 3.5 Sonnet |

## Current API Version

The current stable API version header is:

```
anthropic-version: 2023-06-01
```

This version should be used in all API requests. It is set in:
- `src/context/AppContext.js` (request headers)
- `server.js` (proxy headers)
