# Current Anthropic Beta Headers

Source: [Anthropic Beta Headers](https://platform.claude.com/docs/en/api/beta-headers)

Last updated: 2026-01-30

## Active Beta Headers

| Header Value | Feature | Description |
|-------------|---------|-------------|
| `skills-2025-10-02` | Skills API | Create and manage custom skills |
| `code-execution-2025-08-25` | Code Execution | Server-side code execution tool |
| `files-api-2025-04-14` | Files API | Upload, list, and manage files |
| `computer-use-2024-10-22` | Computer Use | Computer use tool for desktop automation |
| `context-1m-2025-08-07` | 1M Context Window | Extended context window for Sonnet 4.5 and Sonnet 4 |
| `structured-outputs-2025-11-13` | Structured Outputs | Enforce JSON schema compliance in responses |

## Deprecated / Graduated Headers

These headers are no longer required or have graduated to GA:

| Header Value | Feature | Status |
|-------------|---------|--------|
| `prompt-caching-2024-07-31` | Prompt Caching | **Graduated** -- Prompt caching is now automatic, no beta header required |
| `max-tokens-3-5-sonnet-2024-07-15` | Extended Max Tokens | **Legacy** -- Only applies to Claude 3.5 Sonnet legacy model |

## Current API Version

The current stable API version header is:

```
anthropic-version: 2023-06-01
```

This version should be used in all API requests. It is set in:
- `src/context/AppContext.js` (request headers)
- `server.js` (proxy headers)
