# Claude API Explorer - Development Guide

A visual web app for testing Anthropic API endpoints. Uses React + htm (no build step).

## Quick Reference

**Tech Stack:** React 18 (CDN), htm 3.1.1, Express 5.x proxy, Tailwind CSS (CDN), Jest 30 (testing)

**Supported Endpoints:**
- Messages API - Send messages to Claude with multi-turn conversation support
- Message Batches API - Async batch processing at 50% cost with in-app results viewing
- Models API - List available models
- Skills API - Create and manage custom skills (Beta)
- Usage Reports API - Token usage tracking (requires Admin key)
- Cost Reports API - Cost breakdowns (requires Admin key)

**Beta Features:**
- Beta Headers - Toggle buttons for anthropic-beta header (Skills, Code Exec, Files API, etc.)
- Skills Tab - Manage custom skills (List, Create, Get, Delete) with folder drag & drop upload
- Skills Versions - List and manage skill versions before deletion
- Container Skills - Configure container.skills for document processing in Messages API

**Multi-Turn Conversations:**
- Conversation Mode toggle for chat-style interactions
- Automatically maintains conversation context across multiple exchanges
- Chat interface with user/assistant message display
- Continue conversations from history with full context restoration
- Seamless tool execution within conversations

## Architecture

### Core Philosophy
- **No build step** - Edit → refresh → test (htm instead of JSX)
- **Single file components** - Main app in `FullApp.js` (~2150 lines, consider splitting)
- **Express proxy** - Required for CORS (browser can't call Anthropic directly)

### Project Structure
```
.claude/
├── agents/                    # Custom subagents
│   ├── design-reviewer.md     # UI/UX consistency enforcement
│   ├── test-coverage-reviewer.md  # Test adequacy validation
│   └── code-reviewer.md       # Code quality review
└── commands/                  # Slash commands
    ├── explore.md             # Codebase exploration
    ├── design-review.md       # Design enforcement
    └── sync-docs.md           # Documentation sync
src/
├── main.js                    # Entry point
├── FullApp.js                 # All UI components (~2150 lines)
│                              # Includes ConversationModeToggle, ChatInterface
├── components/common/         # Reusable components (Button, Toggle, Tabs)
├── context/AppContext.js      # Global state (API keys, config, history, conversations)
│                              # conversationMode, conversationHistory state
├── config/
│   ├── models.js              # Model definitions
│   ├── models.test.js         # Model config tests
│   ├── endpoints.js           # Endpoint definitions
│   ├── endpoints.test.js      # Endpoint config tests
│   ├── toolConfig.js          # Tool registry
│   └── toolConfig.test.js     # Tool config tests
└── utils/
    ├── localStorage.js        # Storage operations (includes conversation persistence)
    ├── formatters.js          # Demo tool implementations
    ├── formatters.test.js     # Formatter tests
    └── toolExecutors/         # Real tool implementations
        ├── calculator.js      # Math expression evaluator
        ├── calculator.test.js # Calculator tests (17 tests)
        ├── jsonValidator.js   # JSON validation
        ├── jsonValidator.test.js  # JSON validator tests (10 tests)
        ├── regexTester.js     # Regex pattern testing
        └── regexTester.test.js    # Regex tester tests (14 tests)
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
text-purple-400                  // Tool execution
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

// Examples
html`<input class="font-mono text-slate-100" />`
html`<span class="font-mono text-amber-400">${model.id}</span>`
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

### Using Conversation Mode
1. **Send first message** using normal MessageBuilder interface
2. **Wait for response** - conversation toggle appears after first successful API call
3. **Enable Conversation Mode** toggle (located above Send Request button)
4. **Chat interface activates** - shows conversation history with chat bubbles
5. **Send follow-up messages** - full context automatically maintained
6. **Continue from history** - Use "Continue" button on history items marked with "Chat" badge

**Technical notes:**
- Toggle only appears after first response (prevents empty messages validation error)
- Tool execution seamlessly integrates (tool_result messages filtered from display)
- Conversation history passed directly to avoid React state timing issues
- Use `handleSendRequest(overrideConversationHistory)` parameter for immediate context

### Adding a New Model
Edit `src/config/models.js`:
```javascript
{ "id": "claude-new-model-20250101", "name": "Claude New", "description": "..." }
```

### Adding a New API Endpoint
1. Define in `src/config/endpoints.js`
2. Add proxy route in `server.js`
3. Add state/handler in `AppContext.js`
4. Create UI panel in `FullApp.js`
5. Update ResponsePanel formatting
6. Add tab to endpoint navigation

### Adding a New Tool
1. Add to `src/config/toolConfig.js` registry
2. Create real implementation in `src/utils/toolExecutors/`
3. Add to executor router in `toolExecutors/index.js`
4. Add tool definition in `FullApp.js`

### Working with Batch Results
1. **Create batch** - Use the Batches tab to create a batch with multiple requests
2. **Check status** - Use "Check Batch Status" or click "Refresh" button on the status card
3. **View results** - When batch is complete, click "View Results" button next to results_url
4. **Explore responses** - Results display as expandable cards showing custom_id, status, and response
5. **Expand/collapse** - Click individual cards or use "Expand All" / "Collapse All" toggle

**Technical details:**
- Results fetched with API key authentication (requires `x-api-key` header)
- JSONL format parsed automatically (one JSON object per line)
- Direct fetch attempted first, falls back to proxy if CORS blocked
- Refresh buttons available on both status card (left panel) and batch info (response panel)
- State: `batchResultsData`, `batchResultsLoading`, `batchResultsError` in AppContext (lines 59-61)
- Handler: `handleFetchBatchResults` in AppContext.js (lines 1106-1165)
- Proxy route: `/proxy-batch-results` in server.js (lines 110-132)

### Running Tests
```bash
npm test              # Run all tests once
npm run test:watch   # Run in watch mode
npm run test:coverage # Run with coverage report
```

**Test coverage targets:**
- 101 tests across 7 files (utilities + config)
- 42% overall coverage (excellent on tested files)
- Colocated test files: `file.js` → `file.test.js`

## Beta Headers & Skills

### Beta Headers
Located under API Key in the Configuration sidebar. Toggle buttons for:
- `skills-2025-10-02` - Skills API
- `code-execution-2025-08-25` - Code execution (required for container skills)
- `files-api-2025-04-14` - Files API (required for container skills)
- `prompt-caching-2024-07-31` - Prompt caching
- `computer-use-2024-10-22` - Computer use
- `max-tokens-3-5-sonnet-2024-07-15` - Extended max tokens

State: `betaHeaders` (array) in AppContext, persisted to localStorage.

### Skills API Tab
A dedicated tab for managing custom skills via the Skills API (Beta). Features:

**Operations:**
- **List Skills** - Browse skills with source filter (custom vs anthropic)
- **Create Skill** - Drag & drop a folder to create (auto-detects skill name from folder)
- **Get Skill** - View buttons in Response panel to retrieve skill details
- **Delete Skill** - List versions, delete versions, then delete skill

**Folder Upload:** The Create tab accepts folder drag & drop. The skill name is inferred from the folder name, and all files maintain their relative paths (e.g., `my-skill/SKILL.md`).

**State:** `skillsList`, `skillDetail`, `skillsSourceFilter`, `skillVersions` in AppContext.

**Note:** The Skills API automatically includes `anthropic-beta: skills-2025-10-02` header. Version deletion may not be fully supported in the beta.

### Container Skills (Messages API)
Located in Advanced Options → Skills tab. Configure `container.skills` for document processing.

**Pre-built skills:** xlsx, pdf, docx, pptx

**API Format:**
```json
{
  "container": {
    "skills": [
      { "type": "anthropic", "skill_id": "xlsx", "version": "latest" }
    ]
  }
}
```

State: `skillsJson` (string) in AppContext, persisted to localStorage.

**Note:** Container skills require all 3 beta headers (Skills, Code Exec, Files API) and the code_execution tool.

## Hybrid Tool System

**Status:** Complete - Free APIs (no signup required, updated 2025-12-03)

Tools execute in two modes that users can toggle in the UI:
- **Demo Mode** (default): Returns mock data for offline testing
- **Real Mode**: Makes actual API calls using **free APIs** (no signup or API keys required)

### Available Tools

**Developer Tools (no API required):**
- Calculator - Enhanced expression evaluator
- JSON Validator - Validates and formats JSON
- Code Formatter - Formats JavaScript, Python, JSON
- Token Counter - Estimates Claude token counts
- Regex Tester - Tests regex patterns with match results

**External API Tools (free, no signup required):**
- Weather - **Open-Meteo API** (free weather data with geocoding)
- Web Search - **DuckDuckGo Instant Answers** (Wikipedia, definitions, facts)

**Note:** Search returns instant answers, not full web results. Good for factual queries.

### UI Location

**Advanced Options → Tools tab** (FullApp.js ~line 630)

**Components:**
1. **Tool Mode Toggle** - Button toggle between Demo/Real modes
2. **Developer Category** - Tool button section with 4 developer tools

**No API Keys panel needed** - Real mode works instantly without configuration.

### State Management

**AppContext state:**
- `toolMode` - Current mode ('demo' or 'real')
- Persists automatically via localStorage

**Tool execution:**
```javascript
import { executeTool } from './utils/toolExecutors/index.js';
const result = await executeTool(toolName, input, toolMode);
```

### Architecture

**Configuration:** `src/config/toolConfig.js`
- `TOOL_REGISTRY` - Metadata for all tools (requirements, categories)
- All tools have `requiresApiKey: false`
- `isToolAvailable()` - Check if tool can run in given mode

**Executors:** `src/utils/toolExecutors/`
- `index.js` - Router that dispatches to demo or real implementations
- Individual files for each tool (weather.js, search.js, calculator.js, etc.)
- **weather.js** - Calls Open-Meteo geocoding + weather APIs directly
- **search.js** - Calls DuckDuckGo Instant Answer API directly

**No proxy routes needed** - Tools call free APIs directly from the browser

### Implementation Notes

**Tool definitions:** Lines ~387-565 in FullApp.js
- All 12 tools defined with proper input schemas
- Claude automatically discovers and can use any defined tool

**API Details:**
- **Open-Meteo**: `https://api.open-meteo.com/v1/forecast` (free, no key)
- **DuckDuckGo**: `https://api.duckduckgo.com/?format=json` (free, no key)

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
| "Failed to fetch" | Verify proxy running (localhost:3001), check API key |
| React errors | Use `class` not `className`, ensure htm bound |
| State not updating | Use functional updates, check useMemo deps |

## Known Limitations

- No streaming support
- No image previews in Vision tab
- History only for Messages endpoint
- No error boundaries
- Usage/Cost APIs require Admin key (sk-ant-admin...)
- Token counting API doesn't support skills/beta headers
- Skills version endpoints require `?beta=true` query parameter
- **Conversation Mode:**
  - Cannot edit past messages in chat (switch to MessageBuilder for edits)
  - tool_result messages hidden from chat display (API plumbing)
  - No conversation branching or forking
  - Long conversations may hit context limits

## Technical Debt

1. FullApp.js ~2150 lines (needs splitting into separate panel components)
2. No TypeScript
3. Response panel logic complex with multiple formats
4. Test coverage incomplete (main app and integration tests needed)
5. Conversation mode state management complex (React timing issues require parameter passing)
6. No conversation branching or editing past messages in chat mode

---

**Version:** 2.10 | **Updated:** 2025-12-04 | **Owner:** Karl

**Recent Changes:**
- v2.10: Batch results viewer - View JSONL results in-app with expandable cards, API key authentication, refresh buttons on status cards
- v2.9: Multi-turn conversation support - Conversation mode toggle, chat-style UI, history continuation, seamless tool execution in conversations
- v2.8: Unit testing infrastructure - 101 Jest tests (42% coverage), 3 custom review subagents, /sync-docs command
- v2.7: Free APIs - Real mode now uses Open-Meteo & DuckDuckGo (no signup/keys required)
- v2.6: Hybrid Tool System UI complete - Tool mode toggle, API keys panel, 4 new developer tools
- v2.5: Skills folder upload (drag & drop folders), Delete tab with version management, text wrapping fixes
- v2.4: Added Skills API tab (List, Create, Get), dynamic model dropdown from /v1/models API
- v2.3: Added Beta Headers toggle UI, Container Skills support
- v2.2: Added Usage/Cost APIs, Claude Haiku 4.5
- v2.1: Multi-endpoint architecture, Batches/Models APIs
- v1.0: Initial release with Messages API

**Note:** Keep the version displayed in the UI (FullApp.js header) in sync with this version.
- Remember to use subagents to help you. You can find the available ones in the /agents folder.