# Claude API Explorer - Development Guide

A visual web app for testing Anthropic API endpoints. Uses React + htm (no build step).

## Quick Reference

**Tech Stack:** React 19 (CDN), htm 3.1.1, Express 5.x proxy, Tailwind CSS (CDN), Jest 30 (testing)

**Supported Endpoints (3 tabs):**
- Messages API - Send messages to Claude with multi-turn conversation support
- Skills API - Create and manage custom skills (Beta)
- Files API - Upload/list/get/delete/download files referenced by file_id in Messages (Beta)

**Removed in v4.0** (unused): Batches, Models, Usage Reports, and Cost Reports tabs, and the entire client-side demo/real tool execution system. The `GET /v1/models` proxy route is still used internally to populate the live model dropdown.

**Beta Headers:**
- Toggle buttons for `anthropic-beta`: Skills, Files API, Computer Use (current + legacy), Compaction, 1M Context (legacy models), Context Mgmt, Interleaved Thinking, Advisor Tool, Cache Diagnostics, Task Budgets

**Models (v4.0, verified against platform.claude.com 2026-06-29):**
- Current: Claude Opus 4.8 (`claude-opus-4-8`, flagship), Claude Fable 5 (`claude-fable-5`), Claude Sonnet 4.6 (default), Claude Haiku 4.5
- Legacy: Opus 4.7, Opus 4.6, Sonnet 4.5, Opus 4.5; Opus 4.1 deprecated (retires 2026-08-05)
- Removed: Sonnet 4 and Opus 4 (retired 2026-06-15)

**Streaming & Thinking:**
- Streaming responses via SSE with incremental text display and blinking cursor
- Extended Thinking with manual budget (1K-128K tokens) — blocked on adaptive-only models (Fable 5, Opus 4.8, Opus 4.7)
- Adaptive Thinking with effort levels (low/medium/high/xhigh/max) — Fable 5, Opus 4.8/4.7/4.6, Sonnet 4.6 (xhigh: Fable 5, Opus 4.8, Opus 4.7 only)
- `thinking.display`: summarized | omitted (the API default is `omitted` on Fable 5 / Opus 4.8 / 4.7)
- Fast Mode (`speed: fast`) — Opus 4.8 (research preview); deprecated on 4.7 (removed 2026-07-24) and 4.6 (removed 2026-06-29); auto-injects `anthropic-beta: fast-mode-2026-02-01`
- Structured Outputs with JSON schema validation (`output_config.format`)
- Cache Diagnostics — when the `cache-diagnosis-2026-04-07` header is on, the app always sends `diagnostics.previous_message_id` (null on the first turn, then auto-chained from the last response id) and renders `diagnostics.cache_miss_reason`
- Thinking blocks displayed as collapsible sections in response view

**Multi-Turn Conversations:**
- Conversation Mode toggle for chat-style interactions
- Automatically maintains conversation context across multiple exchanges
- Continue conversations from history with full context restoration

**Server-Side Tools (Anthropic-managed):**
- Web Search (`web_search_20260318`), Web Fetch (`web_fetch_20260318`), Code Execution (`code_execution_20260521`), Computer Use (`computer_20251124`), Text Editor (`text_editor_20250728`), Memory (`memory_20250818`), Tool Search BM25 (`tool_search_tool_bm25_20251119`), Advisor (`advisor_20260301`, beta — auto-injects `advisor-tool-2026-03-01`)
- Toggle buttons that add server-side tool definitions to requests

**Client tools (v4.0 behavior change):** There is no client-side tool execution. A freeform "Custom Tool (JSON)" textarea lets you define tools; when Claude responds with `stop_reason: "tool_use"` the `tool_use` block is rendered and the turn ends (no auto-execution, no follow-up request). Server-side tools are unaffected — Anthropic executes those.

**Response view additions (v4.0):**
- `usage.output_tokens_details.thinking_tokens` shown in the cost card
- `usage.speed` badge (fast/standard)
- `stop_reason: "refusal"` banner with `stop_details.category` (`cyber` / `bio` / `reasoning_extraction`) and explanation
- `diagnostics.cache_miss_reason` row when cache diagnostics is enabled

**Export:**
- Copy as cURL — formats the output of `buildMessagesRequest()` (the same builder `handleSendRequest` uses, exposed via context), so the copied curl is byte-for-byte the request the app sends: model (incl. Internal Model Mode), images, conversation history, tools/container, thinking, diagnostics, speed/cache_control, and all auto-injected beta headers

**Workbench:**
- Raw Request Inspector — collapsible panel showing exact headers/body/timing sent (API key redacted)
- Internal Model Mode — Ctrl+Shift+I reveals session-only custom model ID input (nothing persisted, nothing hardcoded)

## Architecture

### Core Philosophy
- **No build step** - Edit → refresh → test (htm instead of JSX)
- **Single file components** - Main app in `FullApp.js` (~2200 lines)
- **Express proxy** - Required for CORS (browser can't call Anthropic directly)
- **Streaming proxy** - SSE pipe-through for streaming responses
- **Capability matrix lives in `src/config/models.js`** - every "which model supports X" rule is a flag there; nothing else hardcodes model-ID lists. Guard/help copy that names models uses `modelNamesSupporting(flag)` so the text can't drift either
- **One request builder** - `buildMessagesRequest()` in AppContext produces `{ requestBody, betaHeaders, effectiveModel }`; `handleSendRequest`, the Request Inspector snapshot, and Copy-as-cURL all consume it

### Project Structure
```
.claude/
├── agents/                    # Custom subagents
│   ├── api-docs-validator.md  # Validates app config against official Anthropic docs
│   ├── design-reviewer.md     # UI/UX consistency enforcement
│   ├── test-coverage-reviewer.md  # Test adequacy validation
│   └── code-reviewer.md       # Code quality review
└── commands/                  # Slash commands
src/
├── main.js                    # Entry point
├── FullApp.js                 # Main UI components (~2200 lines)
├── components/
│   ├── common/                # Reusable components (Button, Toggle, Tabs, ErrorBoundary)
│   └── responses/             # Response panel components
│       ├── index.js           # Barrel exports
│       ├── MessageResponseView.js
│       ├── SkillsResponseView.js
│       ├── FilesResponseView.js
│       ├── EmptyResponseState.js
│       ├── ActualCostCard.js
│       └── RequestInspector.js
├── context/AppContext.js      # Global state (API keys, config, history, conversations) (~1400 lines)
├── config/
│   ├── models.js              # Model catalog + capability matrix + helper exports
│   ├── models.test.js
│   ├── endpoints.js           # Endpoint definitions (messages, skills, files)
│   └── endpoints.test.js
└── utils/
    ├── localStorage.js        # Storage operations (includes conversation persistence)
    ├── formatters.js          # extractMessageText, fileToBase64, getImageMediaType
    └── formatters.test.js
```

## Code Standards

### Import Pattern (CRITICAL)
```javascript
// Always use .js extension
import Button from './components/common/Button.js';  // ✅
import Button from './components/common/Button';     // ❌

// htm binding required in every component
import React from 'react';
import htm from 'htm';
const html = htm.bind(React.createElement);
```

### Component Structure
```javascript
export function MyComponent({ prop1 }) {
  const [state, setState] = useState(initialValue);
  const handleEvent = () => { /* logic */ };

  return html`
    <div class="container">
      <button onClick=${handleEvent}>${prop1}</button>
    </div>
  `;
}
```

### Styling (htm-specific)
```javascript
// ✅ Use class (not className)
html`<div class="flex items-center gap-2 p-4 bg-slate-800">`

// ✅ Dynamic classes
html`<div class="${isActive ? 'bg-amber-500' : 'bg-slate-700'}">`

// ❌ Don't use className (React convention doesn't work in htm)
html`<div className="container">`
```

### State Rules
- **Global state** → AppContext (API keys, config, history)
- **Component state** → useState (UI toggles, form inputs)
- **Never** mutate state directly

## UI Design Standards

**CRITICAL:** Dark theme design system. All components MUST follow these patterns.

### Color System
```javascript
// Backgrounds
bg-slate-950   // Main app background
bg-slate-900   // Panel backgrounds
bg-slate-800   // Input fields, cards

// Borders
border-slate-800  // Primary
border-slate-700  // Interactive/hover

// Accent Colors
text-amber-400 / bg-amber-500    // Primary actions
text-mint-400 / bg-mint-500      // Success, metrics
text-red-400                     // Errors
text-purple-400                  // Thinking
text-teal-400                    // Skill execution

// Text hierarchy
text-slate-100  // Primary
text-slate-300  // Labels
text-slate-400  // Descriptions
text-slate-600  // Disabled
```

### Typography
```javascript
// Technical elements ALWAYS use font-mono (JetBrains Mono)
font-mono  // Code, API keys, IDs, timestamps, data, inputs
```

### Component Patterns

**Input Fields:**
```javascript
class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
       focus:outline-none text-sm font-mono text-slate-100
       placeholder-slate-600 hover:border-slate-600 transition-colors"
```

**Cards/Panels:**
```javascript
class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift"
```

**Buttons:** Use the Button component with variants: `primary`, `secondary`, `danger`, `ghost`

### Anti-Patterns to AVOID
```javascript
❌ bg-white           → ✅ bg-slate-900
❌ bg-gray-50         → ✅ bg-slate-800
❌ border-gray-300    → ✅ border-slate-700
❌ bg-blue-600        → ✅ bg-amber-500
❌ <input class="..." → ✅ <input class="font-mono ..."
```

### Animation Classes
```javascript
animate-slide-up   // New panels/dropdowns
animate-fade-in    // Responses
hover-lift         // Cards
spinner-glow       // Loading
transition-colors  // All interactive elements
```

## Common Tasks

### Adding a New Model
Edit `src/config/models.js`:
```javascript
{
  "id": "claude-new-model",
  "name": "Claude New",
  "description": "...",
  "pricing": { "input": 3, "output": 15 },
  "maxOutput": 64000,
  "capabilities": { "adaptiveThinking": true, "manualThinking": false, "xhighEffort": true, "fastMode": false }
}
```
**Capability flags drive the UI guards.** `getModelCapabilities`, `supportsAdaptiveThinking`, `manualThinkingBlocked`, `thinkingAlwaysOn`, `supportsXhigh`, `supportsFastMode`, and `fastModeNote` are exported from `models.js` and consumed by `FullApp.js` (ThinkingSection / SpeedCacheSection) and `AppContext.js` (pre-flight request guards). **Unknown model IDs are never blocked** — Internal Model Mode and models newer than this catalog get permissive defaults.

`maxOutput` is fallback-only: the ModelSelector prefers live `max_tokens` from the `/v1/models` API response. Run the api-docs-validator agent after changes.

### Adding a New API Endpoint
1. Define in `src/config/endpoints.js`
2. Add proxy route in `server.js`
3. Add state/handler in `AppContext.js`
4. Create UI panel in `FullApp.js` + add it to `ConfigPanel` routing and the `endpointTabs` array in `AppContent`
5. Update `ResponsePanel` formatting (new view component in `src/components/responses/`)

**Note:** the `endpointTabs` array in `FullApp.js` (`AppContent`) is hardcoded AND dereferences `endpoints.<id>.description` — adding/removing an endpoint requires touching both `endpoints.js` and that array in the same change.

### Adding a New Server-Side Tool
Add an entry to the server tool array in `FullApp.js` (`AdvancedOptions` → Tools tab) with the current `type` string from the docs. If the tool needs a beta header, add the header to `BETA_HEADER_OPTIONS` and auto-inject it in `AppContext.handleSendRequest` (see the advisor/fast-mode pattern).

### Running Tests
```bash
npm test              # Run all tests once
npm run test:watch   # Run in watch mode
npm run test:coverage # Run with coverage report
```

**Test coverage:** 40 tests across 3 files (models, endpoints, formatters). Coverage thresholds: branches 80 / functions 70 / lines 75 / statements 75. There are still no tests for `FullApp.js`, `AppContext.js`, or `server.js`.

## Beta Headers & Skills

### Beta Headers
Located under API Key in the Configuration sidebar. Toggle buttons for:
- `skills-2025-10-02` - Skills API
- `files-api-2025-04-14` - Files API (required for the Files tab and container skills; auto-included for those calls)
- `computer-use-2025-11-24` - Computer use (Opus 4.5+)
- `computer-use-2025-01-24` - Computer use (legacy models)
- `compact-2026-01-12` - Compaction (for long conversations)
- `context-1m-2025-08-07` - 1M context window (legacy models — 4.6+ have it natively, no header)
- `context-management-2025-06-27` - Context editing (tool result/thinking block clearing)
- `interleaved-thinking-2025-05-14` - Interleaved thinking
- `advisor-tool-2026-03-01` - Advisor tool (also auto-injected when the Advisor server tool is toggled on)
- `cache-diagnosis-2026-04-07` - Cache diagnostics (reveals a `previous_message_id` input in Advanced Options → Output)
- `task-budgets-2026-03-13` - Task budgets (Opus 4.7+; header toggle only — no `task_budget` param UI yet)

**Auto-injected (not in the toggle list):** `fast-mode-2026-02-01` (when `speed: fast`), `advisor-tool-2026-03-01` (when an `advisor_*` tool is configured), `skills-2025-10-02` (Skills API calls), `files-api-2025-04-14` (Files API calls).

**Graduated to GA (no header needed):** prompt caching, code execution, web search, web fetch, memory tool, tool search tool, structured outputs, effort parameter, 1M context on 4.6+.

State: `betaHeaders` (array) in AppContext, persisted to localStorage. `storage.getBetaHeaders()` filters out headers whose feature graduated or was removed from the app (`output-300k-2026-03-24`, `code-execution-2025-08-25`).

### Skills API Tab
A dedicated tab for managing custom skills via the Skills API (Beta).

**Operations:** List (with source filter), Create (folder drag & drop, skill name inferred from folder), Get, Delete (with version listing/deletion first).

**State:** `skillsList`, `skillDetail`, `skillsSourceFilter`, `skillVersions` in AppContext.

**Note:** The Skills API automatically includes the `anthropic-beta: skills-2025-10-02` header.

### Files API Tab
A dedicated tab for managing files via the Files API (Beta). All file operations are free — billing only happens when a `file_id` is referenced in a Messages request.

**Operations:** List (`GET /v1/files`, paginated), Upload (`POST /v1/files`, multipart, 500 MB max), Get metadata, Delete (irreversible), Download (`GET /v1/files/:id/content`, only for skill/code-execution-generated files).

**State:** `filesList`, `fileDetail`, `filesLoading`, `filesError` in AppContext. Nothing persisted.

**Note:** The Files tab automatically includes `anthropic-beta: files-api-2025-04-14` — both client-side and server-side (the `/v1/files*` proxy routes inject it via `withBetaFlag`).

### Container Skills (Messages API)
Located in Advanced Options → Skills tab. Configure `container.skills` for document processing.

**Pre-built skills:** xlsx, pdf, docx, pptx

**API Format:**
```json
{ "container": { "skills": [ { "type": "anthropic", "skill_id": "xlsx", "version": "latest" } ] } }
```

State: `skillsJson` (string) in AppContext, persisted to localStorage. The `code_execution_20260521` tool is auto-injected when container skills are set (code execution is GA — no beta header). The Skills + Files API beta headers are still required for container skills.

## Server Proxy Routes (`server.js`, port 3002)

| Method | Route | Purpose |
|---|---|---|
| POST | `/v1/messages` | Messages |
| POST | `/v1/messages/stream` | Messages (SSE pipe-through) |
| POST | `/v1/messages/count_tokens` | Token counting (the Count button) |
| GET | `/v1/models` | Live model metadata for the model dropdown |
| GET/POST/DELETE | `/v1/skills*` | Skills API (list/get/create/delete + versions) |
| GET/POST/DELETE | `/v1/files*` | Files API (list/upload/get/delete/download) |

## Security

```javascript
// ✅ Store in browser storage
localStorage.setItem('api_key', key);

// ❌ NEVER log or hardcode API keys
console.log('Key:', apiKey);
const key = "sk-ant-...";
```

## Performance

```javascript
// ✅ useMemo for context value
const value = useMemo(() => ({ ... }), [deps]);

// ✅ Functional updates for arrays
setImages(prev => [...prev, newImage]);
```

## Debugging

| Issue | Solution |
|-------|----------|
| "Module not found" | Check .js extension in imports |
| "Failed to fetch" | Verify proxy running (localhost:3002), check API key |
| React errors | Use `class` not `className`, ensure htm bound |
| State not updating | Use functional updates, check useMemo deps |

## Known Limitations

- History only for Messages endpoint
- Streaming does not reconstruct `tool_use` blocks (text + thinking only)
- No client-side tool execution: `stop_reason: "tool_use"` ends the turn (the `tool_use` block is rendered)
- Not yet built (conscious skips, easy follow-ups): task-budget `task_budget` param UI, mid-conversation `role: "system"` messages (Opus 4.8), Fable 5 `fallbacks` param, Rate Limits API
- **Conversation Mode:**
  - Cannot edit past messages in chat (switch to MessageBuilder for edits)
  - No conversation branching or forking
  - Long conversations may hit context limits

## Technical Debt

1. FullApp.js ~2200 lines (SkillsPanel, FilesPanel, ConfigPanel could be extracted to `src/components/panels/`)
2. No TypeScript
3. No tests for `FullApp.js`, `AppContext.js`, or `server.js`
4. AppContext.js ~1400 lines — the Skills and Files handlers are self-contained and extractable into hooks
5. The `api-freshness-check/` plugin's reference docs need regenerating whenever models/betas/tools change

---

**Version:** 4.0 | **Updated:** 2026-06-29 | **Owner:** Karl

**Recent Changes:**
- v4.0: API catch-up + slim-down — **Models:** added Claude Opus 4.8 (new flagship) and Claude Fable 5; removed retired Sonnet 4 / Opus 4; flagged Opus 4.1 deprecated (retires 2026-08-05); Sonnet 4.6 maxOutput → 128k; relabeled Opus 4.7 as Legacy. **Capability refactor:** per-model `capabilities` matrix + helper exports in `models.js` now drive every adaptive/manual-thinking, xhigh, and fast-mode guard (previously duplicated model-ID lists in FullApp + AppContext); unknown IDs are never blocked. **Tools/betas:** bumped `web_search_20260318`, `web_fetch_20260318`, `code_execution_20260521`; added Advisor tool (`advisor_20260301` + auto-injected header); added Cache Diagnostics (header toggle + `diagnostics.previous_message_id` input + `cache_miss_reason` display) and Task Budgets header toggles; removed the batch-only `output-300k` toggle. **Response view:** `thinking_tokens`, `usage.speed`, `stop_reason: "refusal"` banner with `stop_details`. **Removed (unused):** Batches, Models, Usage, and Cost tabs (their panels, response views, handlers, proxy routes) and the entire client-side demo/real tool system (`toolExecutors/`, `toolConfig.js`, mode toggle, API-key plumbing) — `tool_use` now ends the turn; plus dead code (`parameters.js`, unused formatters, write-only state, stale `TODO.md`). 40 tests; coverage thresholds re-baselined to 80/70/75/75.
- v3.4: API catch-up + Files tab - Added Opus 4.7 as flagship; relabeled Opus 4.6/Sonnet 4.5 as Legacy; widened adaptive-thinking guard; added `xhigh` effort; Fast Mode beta header auto-injection; `computer_20251124`; new Files API tab with 5 server proxy routes + `FilesResponseView`
- v3.3: API catch-up + workbench foundation - Added Sonnet 4.6, live model metadata from /v1/models, new request params (speed, thinking.display, top-level cache_control), Raw Request Inspector, Internal Model Mode
- v3.2: Architecture cleanup - Removed dead tools, ErrorBoundary component, React 19 CDN upgrade, Copy as cURL export, api-docs-validator agent
- v3.1: UX polish - Image preview thumbnails, server-side tools section, history delete button
- v3.0: Streaming + Thinking - SSE streaming, extended thinking, adaptive thinking, structured outputs
- v2.x: Multi-endpoint architecture, batches/models/usage/cost APIs (removed in v4.0), skills tab, hybrid tool system (removed in v4.0), conversation mode, testing infrastructure
- v1.0: Initial release with Messages API

**Note:** Keep the version displayed in the UI (FullApp.js header) in sync with this version.
- Remember to use subagents to help you. You can find the available ones in the /agents folder.
