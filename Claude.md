# Claude API Explorer - Development Guide

A visual web app for testing Anthropic API endpoints. Uses React + htm (no build step).

## Quick Reference

**Tech Stack:** React 18 (CDN), htm 3.1.1, Express 5.x proxy, Tailwind CSS (CDN)

**Supported Endpoints:**
- Messages API - Send messages to Claude
- Message Batches API - Async batch processing at 50% cost
- Models API - List available models
- Usage Reports API - Token usage tracking (requires Admin key)
- Cost Reports API - Cost breakdowns (requires Admin key)

## Architecture

### Core Philosophy
- **No build step** - Edit → refresh → test (htm instead of JSX)
- **Single file components** - Main app in `FullApp.js` (split at 1000+ lines)
- **Express proxy** - Required for CORS (browser can't call Anthropic directly)

### Project Structure
```
src/
├── main.js                    # Entry point
├── FullApp.js                 # All UI components (~1450 lines)
├── components/common/         # Reusable components (Button, Toggle, Tabs)
├── context/AppContext.js      # Global state (API keys, config, history)
├── config/
│   ├── models.js              # Model definitions
│   ├── endpoints.js           # Endpoint definitions
│   └── toolConfig.js          # Tool registry
└── utils/
    ├── localStorage.js        # Storage operations
    ├── formatters.js          # Demo tool implementations
    └── toolExecutors/         # Real tool implementations
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

## Hybrid Tool System

Tools run in two modes:
- **Demo Mode** (default): Mock data for offline testing
- **Real Mode**: Actual API calls

**Developer Tools (no API):** Calculator, JSON Validator, Code Formatter, Token Counter, Regex Tester
**External API Tools:** Weather (OpenWeatherMap), Search (Brave)

State: `toolMode` and `toolApiKeys` in AppContext (persisted to localStorage)

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
- Hybrid tool UI incomplete (backend ready)

## Technical Debt

1. FullApp.js ~1450 lines (approaching split threshold)
2. No TypeScript
3. No automated tests
4. Response panel logic complex with multiple formats

---

**Version:** 2.1 | **Updated:** 2025-11-06 | **Owner:** Karl

**Recent Changes:**
- v2.1: Added Usage/Cost APIs, Claude Haiku 4.5
- v2.0: Multi-endpoint architecture, Batches/Models APIs
- v1.0: Initial release with Messages API
