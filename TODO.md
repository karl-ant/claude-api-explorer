# TODO: Hybrid Tool System Implementation

**Status:** Phase 3 Complete (Backend Infrastructure Done)
**Started:** 2025-11-10
**Last Updated:** 2025-11-10

## ✅ Completed

### Phase 1: Infrastructure
- [x] Create tool configuration system (src/config/toolConfig.js)
- [x] Create tool executor architecture (src/utils/toolExecutors/index.js)
- [x] Update AppContext.js with toolMode and toolApiKeys state
- [x] Update localStorage.js with tool mode and API keys persistence

### Phase 2: Tools Without External APIs
- [x] Implement enhanced calculator with expression support (calculator.js)
- [x] Implement JSON validator tool (jsonValidator.js)
- [x] Implement code formatter tool (codeFormatter.js)
- [x] Implement token counter tool (tokenCounter.js)
- [x] Implement regex tester tool (regexTester.js)

### Phase 3: External API Tools
- [x] Implement weather API integration (weather.js)
- [x] Implement web search API integration (search.js)
- [x] Add proxy routes for external APIs in server.js

## 🚧 Remaining Work

### Phase 4: UI & Error Handling (~2-3 hours)

#### 1. Add Tool Mode Toggle UI (FullApp.js)
**Location:** AdvancedOptions section, after Tools section
**Tasks:**
- Add toggle switch: "🎭 Demo Mode" / "🚀 Real Mode"
- Import `TOOL_MODES` from toolConfig.js
- Use `toolMode` and `setToolMode` from AppContext
- Add visual indicator showing current mode

#### 2. Add API Keys Configuration Panel (FullApp.js)
**Location:** Below tool mode toggle
**Tasks:**
- Create collapsible section: "⚙️ API Keys for Real Tools"
- Add input fields:
  - OpenWeatherMap API Key (for weather)
  - Brave Search API Key (for web search)
- Include "Where to get API keys" help links:
  - https://openweathermap.org/api
  - https://brave.com/search/api/
- Use `toolApiKeys` and `setToolApiKeys` from AppContext
- Show/hide based on tool mode (only show in Real mode)

#### 3. Update Tool Definitions with New Developer Tools (FullApp.js)
**Location:** Line ~260, predefined tools array
**Tasks:**
- Add `json_validator` tool definition
- Add `code_formatter` tool definition
- Add `token_counter` tool definition
- Add `regex_tester` tool definition
- Each needs proper schema (input parameters, descriptions)

**Example schema structure:**
```javascript
{
  name: 'json_validator',
  description: 'Validate and format JSON strings',
  input_schema: {
    type: 'object',
    properties: {
      json_string: {
        type: 'string',
        description: 'The JSON string to validate'
      }
    },
    required: ['json_string']
  }
}
```

#### 4. Enhanced Tool Display (Optional)
**Tasks:**
- Show badge on each tool indicating "DEMO" or "REAL" mode
- Show availability status (e.g., grayed out if API key missing)
- Add tool execution time/performance metrics

### Phase 5: Documentation & Testing (~1 hour)

#### 1. Update CLAUDE.md Documentation
**Sections to add:**
- **Hybrid Tool System Architecture** (new section)
  - Explain demo vs real modes
  - Tool configuration system
  - How to add new tools
- **Working with Real Tools** (new section)
  - How to get API keys
  - Configuring tool API keys
  - Switching between demo and real modes
- **Tool Executor Architecture** (technical section)
  - File structure
  - How tools are routed
  - Error handling patterns
- **Update Known Issues & Limitations**
  - Note which tools are demo-only
  - API key requirements
  - External API dependencies

#### 2. Testing Checklist
**Demo Mode:**
- [ ] All 8 existing tools work in demo mode
- [ ] 4 new developer tools work (calculator, json_validator, code_formatter, token_counter, regex_tester)
- [ ] Tool mode toggle switches correctly
- [ ] State persists across page refreshes

**Real Mode:**
- [ ] Enhanced calculator evaluates complex expressions
- [ ] JSON validator validates and formats JSON
- [ ] Code formatter formats JavaScript, Python, JSON
- [ ] Token counter estimates token counts
- [ ] Regex tester tests patterns and shows matches
- [ ] Weather API returns real data (with valid API key)
- [ ] Web search returns real results (with valid API key)
- [ ] Graceful error messages when API keys missing
- [ ] Fallback to demo mode on errors (if implemented)

**Integration:**
- [ ] Tools work correctly with Claude's automatic tool execution
- [ ] Tool results display properly in ResponsePanel
- [ ] Tool execution details show correct mode (demo/real)
- [ ] API keys persist across sessions
- [ ] Tool mode preference persists across sessions

**Error Handling:**
- [ ] Invalid API keys show helpful error messages
- [ ] Network failures handled gracefully
- [ ] Malformed tool inputs handled safely
- [ ] Server proxy errors displayed clearly

## 📋 Implementation Notes

### File Changes Made
```
Created:
  src/config/toolConfig.js (210 lines)
  src/utils/toolExecutors/index.js (120 lines)
  src/utils/toolExecutors/calculator.js (180 lines)
  src/utils/toolExecutors/jsonValidator.js (160 lines)
  src/utils/toolExecutors/codeFormatter.js (170 lines)
  src/utils/toolExecutors/tokenCounter.js (140 lines)
  src/utils/toolExecutors/regexTester.js (200 lines)
  src/utils/toolExecutors/weather.js (80 lines)
  src/utils/toolExecutors/search.js (80 lines)

Modified:
  src/context/AppContext.js (~40 lines changed)
    - Added toolMode and toolApiKeys state
    - Modified executeTool call to be async with mode and keys
    - Added useEffect hooks for persistence
    - Added to context value and dependencies

  src/utils/localStorage.js (~40 lines added)
    - Added TOOL_MODE and TOOL_API_KEYS keys
    - Added saveToolMode, getToolMode
    - Added saveToolApiKeys, getToolApiKeys

  server.js (~70 lines added)
    - Added /api/weather proxy route
    - Added /api/search proxy route
```

### Known Issues to Address
1. TypeScript warnings about 'await' on non-promises (can be ignored or fixed by removing await on sync calls)
2. Calculator uses `with` statement and Function constructor (safe in this context, but note for future)
3. Code formatter is basic - could be enhanced with prettier-like logic
4. Token counter is heuristic-based - not exact Claude tokenization

### Architecture Decisions Made
1. **Hybrid approach**: Keep demo tools, add real implementations
2. **Tool executor router**: Single entry point routes to demo/real
3. **Configuration-driven**: TOOL_REGISTRY defines all tool metadata
4. **User-managed API keys**: Stored in localStorage, no backend secrets
5. **Proxy pattern**: External APIs proxied through server.js for CORS
6. **Graceful degradation**: Tools can fallback if real mode unavailable

## 🚀 Next Session Quick Start

To continue:
1. Open `src/FullApp.js`
2. Find the `AdvancedOptions` component (~line 390)
3. Add tool mode toggle and API keys panel UI
4. Find predefined tools array (~line 260)
5. Add 4 new developer tool definitions
6. Test with: `npm start` (server should already be running)
7. Update CLAUDE.md with new sections
8. Run testing checklist

## 📚 References

**Tool Configuration:**
- `src/config/toolConfig.js` - Tool registry and configuration
- `getRequiredApiKeys()` - Get list of API keys needed
- `isToolAvailable(toolName, mode, apiKeys)` - Check availability
- `getToolMode(toolName, preferredMode, apiKeys)` - Get actual mode to use

**Tool Execution:**
- `src/utils/toolExecutors/index.js` - Main executor
- `executeTool(toolName, input, mode, apiKeys)` - Execute with mode
- Individual tool files in `src/utils/toolExecutors/`

**State Management:**
- `toolMode` - Current mode (DEMO or REAL)
- `toolApiKeys` - Object with API keys: `{ openweathermap: '...', brave_search: '...' }`
- Both persist in localStorage automatically

**API Proxies:**
- `GET /api/weather?location=...&units=...&apiKey=...`
- `GET /api/search?query=...&count=...&apiKey=...`
