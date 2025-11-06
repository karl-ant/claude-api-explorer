# Claude API Explorer - Development Guide

This document serves as a guide for AI assistants (and developers) working on this project. It captures architectural decisions, code standards, and best practices to maintain consistency.

## Project Overview

**Purpose:** A visual, interactive web application for testing multiple Anthropic API endpoints
**Target Users:** Developers testing Claude API integrations
**Design Philosophy:** Simple, maintainable, no build step required

### Supported API Endpoints

The application now supports multiple Anthropic API endpoints:

1. **Messages API** - Send messages to Claude and receive responses (synchronous)
2. **Message Batches API** - Process large batches of messages asynchronously at 50% cost
3. **Models API** - List available Claude models and their metadata
4. **Admin API** - Organization and user management (placeholder for future implementation)

Users can switch between endpoints using the tabbed interface at the top of the application.

## Architecture Decisions

### Why No Build Step?

**Decision:** Use htm (Hyperscript Tagged Markup) instead of JSX
**Rationale:**
- Simpler development workflow (edit → refresh)
- No webpack/vite/babel complexity
- Fewer dependencies and failure points
- Easier for others to contribute
- Faster iteration during development

**Trade-offs accepted:**
- Slightly more verbose syntax than JSX
- No TypeScript (could add with build step later)
- Less familiar to some React developers

### Why Single File Components?

**Decision:** Main app in `FullApp.js`, not split into many component files
**Rationale:**
- This is a relatively small application
- Easier to understand data flow
- Reduces file navigation overhead
- Simplifies refactoring
- Common components extracted to `/common/`

**When to split:** If any component exceeds ~300 lines or is reused in multiple places

### Why Express Proxy?

**Decision:** Use Express proxy server instead of direct API calls
**Rationale:**
- Browser CORS restrictions prevent direct API calls
- Anthropic API doesn't support CORS for security reasons
- Simple proxy is cleaner than complex CORS workarounds
- Can add rate limiting or logging later if needed

**Alternative considered:** Browser extension (rejected: too complex for users)

### Multi-Endpoint Architecture

**Decision:** Use a tabbed interface with endpoint-specific panels
**Rationale:**
- Single, unified interface for all API endpoints
- Easy to switch between different API features
- Maintains the "no build step" philosophy
- Endpoints share common components (API key, response panel)
- Each endpoint has its own configuration panel

**Architecture layers:**
1. **Endpoint Configuration** (`src/config/endpoints.js`) - Central definition of all endpoints
2. **Proxy Server** (`server.js`) - Dynamic routing to Anthropic API endpoints
3. **State Management** (`AppContext.js`) - Endpoint-specific state and handlers
4. **UI Layer** (`FullApp.js`) - Tabbed navigation and endpoint-specific panels

**Endpoint-specific components:**
- `MessagesPanel` - Messages API configuration (model, messages, tools, vision)
- `BatchesPanel` - Batch request builder and status checker
- `ModelsPanel` - Simple model listing interface
- `AdminPanel` - Placeholder for future admin features
- `ResponsePanel` - Format-agnostic response display

## Tech Stack

### Core Dependencies
- **React 18** - UI framework (loaded via CDN)
- **htm 3.1.1** - JSX-like syntax without build step
- **Express 5.x** - Proxy server for CORS
- **Tailwind CSS** - Utility-first CSS (loaded via CDN)

### Why These Choices?
- **React:** Industry standard, good for interactive UIs
- **htm:** Enables React without build complexity
- **Express:** Minimal, well-known, easy to understand
- **Tailwind:** Fast styling without writing CSS files

## Code Standards

### File Naming Conventions

```
Components:     PascalCase.js      (Button.js, Toggle.js)
Utilities:      camelCase.js       (localStorage.js, formatters.js)
Config:         camelCase.js       (models.js, parameters.js)
Main files:     PascalCase.js      (FullApp.js, AppContext.js)
```

### Import Conventions

```javascript
// Always use .js extension in imports
import Button from './components/common/Button.js';  // ✅ Correct
import Button from './components/common/Button';     // ❌ Wrong

// htm must be bound to React.createElement
import React from 'react';
import htm from 'htm';
const html = htm.bind(React.createElement);  // ✅ Required pattern
```

### Component Structure (htm)

```javascript
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  const handleEvent = () => {
    // Event handlers as functions, not inline
  };

  return html`
    <div class="container">
      <button onClick=${handleEvent}>
        ${prop1}
      </button>
    </div>
  `;
}
```

### State Management Rules

1. **Global state** → AppContext (API keys, config, history)
2. **Component state** → useState (UI toggles, form inputs)
3. **Derived state** → useMemo (expensive computations)
4. **Never** mutate state directly - always use setters

### Event Handler Patterns

```javascript
// ✅ GOOD: Function references
const handleClick = () => { ... };
return html`<button onClick=${handleClick}>Click</button>`;

// ✅ GOOD: Inline arrow for simple cases with parameters
return html`<button onClick=${() => doSomething(id)}>Click</button>`;

// ❌ AVOID: Complex inline logic
return html`<button onClick=${() => {
  const x = compute();
  if (x > 10) { ... }
}}>Click</button>`;
```

### Styling Conventions

```javascript
// ✅ Use Tailwind classes directly in htm
html`<div class="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">`

// ✅ Dynamic classes with template literals
html`<div class="px-4 py-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}">`

// ❌ Don't use className (React convention doesn't work in htm)
html`<div className="container">`  // Wrong!
```

## Project Structure Rules

### Where Things Go

```
src/
├── main.js                    # Entry point only - minimal code
├── FullApp.js                 # All UI components (keep together)
├── components/common/         # Reusable components only
│   ├── Button.js             # Must be used in 2+ places
│   ├── Toggle.js             # Toggle switch component
│   └── Tabs.js               # Tabs component
├── context/                   # Global state management
│   └── AppContext.js         # Single source of truth
├── config/                    # Static configuration
│   ├── models.js             # Must export default object
│   ├── parameters.js         # Must export default object (if used)
│   └── endpoints.js          # ⭐ NEW: Endpoint definitions
└── utils/                     # Pure functions only
    ├── localStorage.js       # Storage operations
    └── formatters.js         # Data transformations
```

### File Size Guidelines

- **Components:** < 400 lines (split if larger)
- **Utilities:** < 200 lines (split by concern)
- **FullApp.js:** Current size OK (~600 lines), split at 1000+

## Development Workflow

### Making Changes

1. **Edit code** in your editor
2. **Save file**
3. **Refresh browser** (Cmd+R / Ctrl+R)
4. **Test immediately** - no build step!

### Adding New Features

1. **Update AppContext** if it needs global state
2. **Add component** to `FullApp.js` or create in `/common/`
3. **Update this file** if you make architectural decisions
4. **Test thoroughly** - no automated tests yet

### Debugging

```javascript
// ✅ Console logging is fine for development
console.log('Debug:', someVariable);

// ✅ Use browser DevTools React extension
// Install: https://react.dev/learn/react-developer-tools

// ❌ Don't commit console.logs to production
```

## Common Tasks

### Adding a New Model

1. Edit `src/config/models.js`
2. Add to the `models` array:
```javascript
{
  "id": "claude-new-model-20250101",
  "name": "Claude New Model",
  "description": "Description here"
}
```
3. That's it! It will appear in the dropdown automatically

### Adding a New Parameter

1. Edit `src/config/parameters.js`
2. Add to AppContext state
3. Add UI control in `ModelSelector` component
4. Include in request body in `handleSendRequest`

### Adding localStorage Persistence

1. Add to `saveLastConfig` in AppContext.js
2. Add to `getLastConfig` loading in AppContext.js
3. Test with browser DevTools → Application → Local Storage

### Modifying the Proxy Server

The proxy server now uses a helper function for all endpoints:
```javascript
// Add new endpoint route
app.get('/v1/new-endpoint', async (req, res) => {
  await proxyToAnthropic(req, res, 'GET', '/v1/new-endpoint');
});
```

### Adding a New API Endpoint

**Complete workflow for adding a new Anthropic API endpoint:**

1. **Define the endpoint** in `src/config/endpoints.js`:
```javascript
newEndpoint: {
  id: 'new-endpoint',
  name: 'New Endpoint',
  description: 'Description of what this endpoint does',
  method: 'POST',
  path: '/v1/new-endpoint',
  requiresModel: true,
  supportsStreaming: false,
  parameters: {
    required: ['param1'],
    optional: ['param2']
  },
  requestType: 'synchronous',
  responseType: 'custom'
}
```

2. **Add proxy route** in `server.js`:
```javascript
app.post('/v1/new-endpoint', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/new-endpoint');
});
```

3. **Add state and handler** in `AppContext.js`:
```javascript
// State
const [newEndpointData, setNewEndpointData] = useState(null);

// Handler
const handleNewEndpoint = async () => {
  // Implementation
};

// Add to context value
const value = useMemo(() => ({
  // ... existing
  newEndpointData,
  handleNewEndpoint,
}), [/* dependencies */]);
```

4. **Create UI panel** in `FullApp.js`:
```javascript
function NewEndpointPanel() {
  const { handleNewEndpoint } = useApp();
  // Panel implementation
}

// Add to ConfigPanel's conditional rendering
${selectedEndpoint === 'new-endpoint' && html`<${NewEndpointPanel} />`}
```

5. **Update ResponsePanel** in `FullApp.js`:
```javascript
// Add response type detection
if (selectedEndpoint === 'new-endpoint' && response) return 'new-endpoint';

// Add formatted view rendering
${responseType === 'new-endpoint' && html`
  <!-- Custom display for new endpoint response -->
`}
```

6. **Add tab** to `AppContent` endpoint tabs:
```javascript
{ id: 'new-endpoint', label: 'New Endpoint', description: endpoints.newEndpoint.description }
```

### Working with Batch Requests

**Create a batch:**
1. Switch to "Batches" tab
2. Add multiple requests with unique custom_ids
3. Click "Create Batch"
4. Copy the returned batch ID

**Check batch status:**
1. Paste batch ID in "Check Batch Status" field
2. Click "Check"
3. View processing status and request counts
4. Download results when status is "ended"

### Working with Models API

**List models:**
1. Switch to "Models" tab
2. Click "List Models"
3. View all available Claude models with metadata
4. Use pagination parameters for large result sets

## Code Quality Standards

### Must Have
- ✅ Functional components only (no class components)
- ✅ Hooks must follow React rules (no conditionals)
- ✅ PropTypes not required (but helpful)
- ✅ Error boundaries for production (not yet implemented)
- ✅ Meaningful variable names
- ✅ Comments for complex logic

### Should Have
- ✅ Functions < 50 lines when possible
- ✅ Single responsibility principle
- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent formatting (Prettier recommended)

### Nice to Have
- 📝 JSDoc comments for utility functions
- 📝 Unit tests (none currently)
- 📝 E2E tests (none currently)

## Security Considerations

### API Key Handling
```javascript
// ✅ GOOD: Store in browser storage only
localStorage.setItem('api_key', key);

// ❌ NEVER: Log API keys
console.log('API Key:', apiKey);  // Don't do this!

// ❌ NEVER: Commit API keys
const apiKey = "sk-ant-...";  // Don't hardcode!
```

### Proxy Server Security
- Only forwards to Anthropic API (hardcoded domain)
- No logging of requests or responses
- CORS allows all origins (development only)
- **TODO:** Add rate limiting for production

## Performance Considerations

### Context Optimization
```javascript
// ✅ GOOD: useMemo for context value
const value = useMemo(() => ({
  // values
}), [dependencies]);

// ❌ BAD: Recreating object every render
const value = {
  // values - causes re-renders!
};
```

### State Updates
```javascript
// ✅ GOOD: Functional updates for arrays
setImages(prev => [...prev, newImage]);

// ❌ BAD: Reading stale state
setImages([...images, newImage]);  // Closure bug!
```

## Known Issues & Limitations

### Current Limitations
1. **Streaming not implemented** - Shows loading state only
2. **No image previews** - Vision tab shows metadata only
3. **History only for Messages endpoint** - Batches/Models don't save to history
4. **Admin API placeholder** - Not yet implemented, needs user requirements
5. **No error boundaries** - Whole app crashes on error
6. **No keyboard shortcuts** - Mouse/click only
7. **Batch results download** - No automatic download of .jsonl results

### Multi-Endpoint Specific Limitations
1. **No batch result preview** - Must download .jsonl file manually
2. **Models API pagination** - UI doesn't support before_id/after_id navigation
3. **No cross-endpoint history** - Each endpoint operates independently
4. **Batch status polling** - Manual refresh required, no auto-polling

### Technical Debt
1. All components in one file (FullApp.js) - Now ~1000 lines
2. No TypeScript
3. No automated tests
4. No CI/CD pipeline
5. Manual server startup (two terminals)
6. Response panel logic getting complex with multiple formats

## Future Enhancement Guidelines

### Adding Streaming Support

**Location:** AppContext.js `handleSendRequest` function
**Requirements:**
- Use fetch with ReadableStream
- Parse SSE (Server-Sent Events) format
- Update `streamingText` state progressively
- Handle stream errors gracefully

**Reference:** Anthropic docs on streaming

### Adding Image Previews

**Location:** FullApp.js `AdvancedOptions` component
**Requirements:**
- Show thumbnail after upload
- Support remove button
- Limit image size (localStorage quota)
- Add loading state for base64 conversion

### Migrating to TypeScript

**Considerations:**
- Would require build step (defeats current philosophy)
- Could use JSDoc type comments as alternative
- Weigh benefits vs complexity
- Consider only if team size grows

## Testing Guidelines

### Manual Testing Checklist

Before committing changes:
- [ ] Test API key persistence (both options)
- [ ] Test all parameter controls
- [ ] Test multi-message conversations
- [ ] Test image uploads (all three methods)
- [ ] Test tool definitions
- [ ] Test history (save, load, export, clear)
- [ ] Test error handling (invalid API key, etc.)
- [ ] Test both view modes (Message/JSON)
- [ ] Check browser console for errors
- [ ] Test in different browsers if possible

### Browser Compatibility Testing

Priority browsers:
1. Chrome (primary development)
2. Firefox
3. Safari
4. Edge

## Debugging Common Issues

### "Module not found" errors
- Check file extensions (.js required in imports)
- Verify file path is correct
- Ensure file actually exists

### "Failed to fetch" errors
- Verify proxy server is running (localhost:3001)
- Check API key is valid
- Look for CORS errors in console
- Test API key at console.anthropic.com

### React errors in console
- Check htm syntax (use `class` not `className`)
- Verify all html template strings are closed
- Ensure React is imported in every component
- Check htm is bound to React.createElement

### State not updating
- Check if using functional updates for arrays/objects
- Verify dependencies in useMemo/useEffect
- Look for stale closures in event handlers

## Git Best Practices

### Commit Messages
```
Good: "Add vision API support with file uploads"
Good: "Fix stale closure bug in image upload handler"
Bad:  "updates"
Bad:  "fix bug"
```

### What to Commit
- ✅ Source code
- ✅ Configuration files
- ✅ Documentation
- ✅ package.json

### What NOT to Commit
- ❌ node_modules/
- ❌ .env files
- ❌ API keys
- ❌ .DS_Store
- ❌ IDE config (.vscode/, .idea/)

## Questions for Future Sessions

When working on this project, ask yourself:

1. **Does this maintain the "no build step" philosophy?**
2. **Is this the simplest solution that works?**
3. **Will this be easy to understand in 6 months?**
4. **Am I duplicating code that already exists?**
5. **Does this need to be in global state or component state?**
6. **Have I tested the CORS proxy still works?**
7. **Have I updated the README if I changed features?**

## Resources

### Documentation
- [React Docs](https://react.dev)
- [htm GitHub](https://github.com/developit/htm)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Helpful Tools
- React DevTools extension
- Browser DevTools (Network tab for API calls)
- JSONLint for validating config files

## Contact & Support

For questions or issues:
- Check this file first
- Review the README.md
- Check browser console for errors
- Test with a fresh API key
- Try in incognito/private window

---

**Last Updated:** 2025-11-06
**Version:** 2.0
**Maintained by:** Karl (project owner)

---

## Change Log

### 2025-11-06 - Version 2.0: Multi-Endpoint Support
**Major architectural update - Added support for multiple Anthropic API endpoints**

**New Features:**
- ✨ Multi-endpoint architecture with tabbed navigation
- ✨ Message Batches API support (create batches, check status, view results)
- ✨ Models API support (list all available Claude models)
- ✨ Admin API placeholder for future implementation
- ✨ Endpoint configuration system (`src/config/endpoints.js`)
- ✨ Dynamic proxy routing for all endpoints
- ✨ Format-agnostic response panel (handles Messages, Batches, Models formats)

**Infrastructure Changes:**
- 🔧 Refactored `server.js` with `proxyToAnthropic()` helper function
- 🔧 Extended `AppContext.js` with endpoint-specific state and handlers
- 🔧 Refactored `FullApp.js` with endpoint-specific panels:
  - `MessagesPanel` - Messages API (existing functionality)
  - `BatchesPanel` - Batch request builder and status checker
  - `ModelsPanel` - Model listing interface
  - `AdminPanel` - Placeholder for future features
- 🔧 Updated `ResponsePanel` to handle multiple response formats

**Developer Experience:**
- 📚 Updated CLAUDE.md with multi-endpoint architecture documentation
- 📚 Added "Adding a New API Endpoint" guide
- 📚 Added "Working with Batch Requests" guide
- 📚 Added "Working with Models API" guide

**Breaking Changes:**
- None - Messages API functionality remains identical
- Backward compatible with existing localStorage data

**File Size:**
- `FullApp.js`: ~600 lines → ~1050 lines (still maintainable)
- `AppContext.js`: ~250 lines → ~400 lines
- `server.js`: ~50 lines → ~90 lines

**Next Steps:**
- Implement batch result preview/download functionality
- Add auto-polling for batch status
- Implement Admin API endpoints based on user needs
- Consider splitting FullApp.js if it exceeds 1200 lines

### 2025-10-31 - Version 1.0: Initial Release
- Project created with React + htm
- Two-panel layout implemented
- Vision and Tools support added
- History and persistence working
- Cleaned up duplicate files
- Initial documentation created
