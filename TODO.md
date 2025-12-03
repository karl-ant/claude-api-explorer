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

## ✅ Phase 4: UI & Error Handling - COMPLETED

**Completion Date:** 2025-11-24

All UI components for the hybrid tool system have been implemented:

#### 1. ✅ Tool Mode Toggle UI (FullApp.js)
- Added button-style toggle: "🎭 Demo Mode" / "🚀 Real Mode"
- Imported `TOOL_MODES` and `getRequiredApiKeys` from toolConfig.js
- Integrated with `toolMode` and `setToolMode` from AppContext
- Visual indicator shows current mode with descriptive text

#### 2. ✅ API Keys Configuration Panel (FullApp.js)
- Panel displays below tool mode toggle (only visible in Real mode)
- Dynamic generation using `getRequiredApiKeys()` function
- Input fields for:
  - OpenWeatherMap API Key (weather)
  - Brave Search API Key (web search)
- Info button (ⓘ) next to each key linking to provider's API key page
- Uses `toolApiKeys` and `setToolApiKeys` from AppContext with localStorage persistence
- Conditional rendering based on tool mode

#### 3. ✅ Developer Tools Added (FullApp.js)
- Added 4 new tool definitions to predefined tools object:
  - `json_validator` - Validate and format JSON
  - `code_formatter` - Format JavaScript, Python, JSON
  - `token_counter` - Estimate Claude token counts
  - `regex_tester` - Test regular expressions
- All tools include proper input schemas

#### 4. ✅ Developer Category UI
- New "Developer" category section added to tool buttons
- 4 tool buttons with emojis: ✅ 📝 🔢 🔍
- Matches existing design patterns (grid layout, button styling)

#### Enhanced Tool Display (Deferred)
**Status:** Not implemented in this phase
**Rationale:** Current implementation is sufficient for MVP. Can be added later if needed.
**Potential enhancements:**
- Badge indicators showing DEMO/REAL mode per tool
- Tool availability status (grayed out if API key missing)
- Execution time/performance metrics

## 🚧 Remaining Work

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
