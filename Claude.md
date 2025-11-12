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
4. **Usage Reports API** - Track token usage across your organization with detailed breakdowns
5. **Cost Reports API** - View detailed cost breakdowns for token usage and services

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
- `UsagePanel` - Usage report configuration with filtering and time granularity options
- `CostPanel` - Cost report configuration with grouping options
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
html`<div class="flex items-center gap-2 p-4 bg-slate-800 rounded-lg">`

// ✅ Dynamic classes with template literals
html`<div class="px-4 py-2 ${isActive ? 'bg-amber-500' : 'bg-slate-700'}">`

// ❌ Don't use className (React convention doesn't work in htm)
html`<div className="container">`  // Wrong!
```

## UI Design Standards

**CRITICAL:** This application uses a sophisticated dark theme design system. All new components and modifications MUST follow these standards to maintain visual consistency.

### Design Philosophy

**"Developer's Command Center"** - A refined, technical aesthetic that feels professional and distinctive, avoiding generic "AI slop" design patterns.

**Core Principles:**
- Terminal-inspired aesthetic with glowing effects
- Precise micro-interactions and smooth animations
- Atmospheric depth with layering and transparency
- Monospace typography for technical elements
- Cohesive color system with intentional accents

### Color Palette

**Background Colors (Dark Slate):**
```javascript
// Primary backgrounds
bg-slate-950  // #0a0d12 - Main app background
bg-slate-900  // #0f1419 - Panel backgrounds, inputs
bg-slate-850  // #1a202e - Secondary panels
bg-slate-800  // Dark input fields, cards

// Borders and dividers
border-slate-800  // Primary borders
border-slate-700  // Interactive borders, hover states
border-slate-600  // Lighter accent borders
```

**Accent Colors:**
```javascript
// Amber - Primary actions, highlights, key information
text-amber-400   // #fbbf24 - Primary accent text
text-amber-500   // #f59e0b - Hover states
bg-amber-500     // Primary button backgrounds
bg-gradient-to-r from-amber-500 to-amber-600  // Button gradients

// Mint Green - Success, metrics, positive values
text-mint-400    // #4ade80 - Success text, token counts
text-mint-500    // #22c55e - Hover states
bg-mint-500      // Status indicators

// Slate Text - Content hierarchy
text-slate-100   // Primary text, headings
text-slate-200   // Secondary text
text-slate-300   // Interactive text, labels
text-slate-400   // Tertiary text, descriptions
text-slate-500   // Muted text
text-slate-600   // Disabled text

// Semantic Colors
text-red-400     // Errors, destructive actions
text-purple-400  // Tool execution, special features
```

**DO NOT use:**
- ❌ Blue gradients (too generic)
- ❌ White backgrounds
- ❌ Gray-50, gray-100, gray-200 (use slate equivalents)
- ❌ Generic primary colors without context

### Typography

**MANDATORY font usage:**

```javascript
// Technical elements - ALWAYS use font-mono (JetBrains Mono)
font-mono  // Code, API keys, IDs, timestamps, data, parameters

// UI labels and text - Use default (Outfit)
// Labels, buttons, headings, descriptions

// Examples:
✅ html`<input class="font-mono text-slate-100" />`  // Input fields
✅ html`<label class="font-mono text-slate-300">API Key</label>`  // Labels
✅ html`<span class="font-mono text-amber-400">${model.id}</span>`  // Technical data
✅ html`<div class="text-sm text-slate-400 font-mono">Processing...</div>`  // Status text
```

**Font Scale:**
```javascript
text-xs    // 0.75rem - Metadata, timestamps, secondary info
text-sm    // 0.875rem - Labels, descriptions, body text
text-base  // 1rem - Primary text
text-lg    // 1.125rem - Section headings
text-xl    // 1.25rem - Metrics, important numbers
text-2xl   // 1.5rem - Page titles, large metrics
```

### Component Patterns

**Input Fields:**
```javascript
// Standard input/textarea/select pattern
class="
  w-full px-3 py-2.5
  bg-slate-800 border border-slate-700 rounded-lg
  focus:outline-none
  text-sm font-mono text-slate-100
  placeholder-slate-600
  hover:border-slate-600 transition-colors
"

// Focus state is handled by global CSS with amber glow
```

**Buttons (use Button component):**
```javascript
<${Button} variant="primary">Primary Action</${Button}>    // Amber gradient
<${Button} variant="secondary">Secondary</${Button}>       // Dark slate
<${Button} variant="danger">Delete</${Button}>            // Red accent
<${Button} variant="ghost">Cancel</${Button}>             // Transparent
```

**Cards/Panels:**
```javascript
// Standard card pattern
class="
  bg-slate-800/50 border border-slate-700 rounded-lg p-4
  backdrop-blur-sm hover-lift
"

// Info/alert cards
class="
  bg-amber-900/20 border border-amber-700/50 rounded-lg p-3
  backdrop-blur-sm
"
```

**Section Dividers:**
```javascript
class="border-t border-slate-800 pt-4"  // Between sections
class="border-b border-slate-800"       // Under headers
```

### Animations

**REQUIRED animations for new content:**

```javascript
// Appearing content (dropdowns, modals, panels)
class="animate-slide-up"

// Fading in responses
class="animate-fade-in"

// Cards and interactive elements
class="hover-lift"  // Defined in index.html

// Loading spinners
class="spinner-glow"  // Amber glowing spinner
```

**Transition classes:**
```javascript
transition-colors    // Color changes
transition-all       // Multiple properties
duration-200         // Standard timing
```

### Icons and Visual Elements

**Status Indicators:**
```javascript
// Active/online indicator
html`<span class="w-2 h-2 bg-mint-500 rounded-full status-dot"></span>`

// Section markers
html`<span class="text-amber-400">▸</span> Configuration`
html`<span class="text-mint-400">▸</span> Response`
```

**Emojis:** Use sparingly, only for:
- Tool categories (🔧, 📊, 🌤️)
- Info notices (💡)
- Warnings (⚠)

### Response Panel Formatting

**Message responses:**
```javascript
// Main response card
bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm hover-lift

// Metadata panel
bg-slate-800/30 border border-slate-700 rounded-lg p-4 backdrop-blur-sm

// Token usage display
text-slate-400 font-mono  // Labels
text-mint-400 font-mono   // Token counts
text-amber-400 font-mono  // Model names
```

**Terminal-style JSON:**
```javascript
class="
  bg-slate-950 text-mint-300 p-6 rounded-lg
  border border-slate-800 shadow-xl terminal-glow
  font-mono animate-fade-in
"
```

### Common Anti-Patterns to AVOID

```javascript
❌ bg-white                     → ✅ bg-slate-900
❌ bg-gray-50                   → ✅ bg-slate-800
❌ border-gray-300              → ✅ border-slate-700
❌ text-gray-700                → ✅ text-slate-300
❌ bg-blue-600                  → ✅ bg-amber-500
❌ focus:ring-2 focus:ring-blue → ✅ (handled globally with amber)
❌ <input class="text-sm" />    → ✅ <input class="text-sm font-mono" />
❌ Stark white text inputs      → ✅ Dark slate with light text
```

### Testing Your Design

**Visual Checklist:**
- [ ] All text inputs are dark slate with monospace font
- [ ] Primary actions use amber gradient buttons
- [ ] Borders use slate-700 or slate-800
- [ ] All technical data uses font-mono
- [ ] Cards have backdrop-blur-sm
- [ ] Hover states have smooth transitions
- [ ] New panels match existing panel aesthetic
- [ ] No generic blue or stark white elements

### Design Debt to Avoid

1. **Inconsistent borders** - Always use slate-700/slate-800
2. **Missing font-mono** - All code/data MUST be monospace
3. **Wrong accent colors** - Amber for actions, mint for success, red for errors
4. **No transitions** - All interactive elements need transition-colors
5. **Stark backgrounds** - Use transparency and backdrop-blur for depth

## Design Enforcement Sub-Agent

**Purpose:** Automatically review code changes to ensure they comply with the UI Design Standards defined above.

### Sub-Agent Specification

**Agent Type:** `design-reviewer`
**Trigger:** After any code modifications to UI components
**Scope:** `src/FullApp.js`, `src/components/common/*.js`, `index.html`

### Implementation Approach

**Option 1: Post-Edit Hook (Recommended)**
```javascript
// .claude/hooks/post-edit.js
// Triggered after any file edit
if (isUIFile(filePath)) {
  await runDesignReviewAgent(filePath, changes);
}
```

**Option 2: Pre-Commit Hook**
```bash
# .git/hooks/pre-commit
# Run design review before allowing commit
claude-agent design-review --files=$(git diff --cached --name-only)
```

**Option 3: On-Demand Slash Command**
```bash
# .claude/commands/design-review.md
/design-review src/FullApp.js
```

### Agent Behavior

**1. Pattern Detection**

The agent scans for anti-patterns:
```javascript
const antiPatterns = {
  colors: [
    { pattern: /bg-white/g, fix: 'bg-slate-900', severity: 'high' },
    { pattern: /bg-gray-50/g, fix: 'bg-slate-800', severity: 'high' },
    { pattern: /border-gray-300/g, fix: 'border-slate-700', severity: 'high' },
    { pattern: /text-gray-700/g, fix: 'text-slate-300', severity: 'medium' },
    { pattern: /bg-blue-600/g, fix: 'bg-amber-500', severity: 'high' },
    { pattern: /focus:ring-blue/g, fix: '(remove - handled globally)', severity: 'medium' },
  ],
  typography: [
    { pattern: /<input[^>]*class="(?!.*font-mono)/g, fix: 'Add font-mono', severity: 'high' },
    { pattern: /<textarea[^>]*class="(?!.*font-mono)/g, fix: 'Add font-mono', severity: 'high' },
    { pattern: /<select[^>]*class="(?!.*font-mono)/g, fix: 'Add font-mono', severity: 'high' },
  ],
  structure: [
    { pattern: /className=/g, fix: 'Use class= instead', severity: 'high' },
    { pattern: /style={{/g, fix: 'Use Tailwind classes', severity: 'medium' },
  ]
};
```

**2. Component Analysis**

```javascript
// Check for required patterns
const requiredPatterns = {
  Button: {
    mustHave: ['font-mono', 'transition-all', 'rounded-lg'],
    variants: ['primary', 'secondary', 'danger', 'ghost']
  },
  Input: {
    mustHave: ['bg-slate-800', 'border-slate-700', 'font-mono', 'text-slate-100'],
    shouldHave: ['hover:border-slate-600', 'transition-colors']
  },
  Card: {
    mustHave: ['bg-slate-800', 'border-slate-700', 'rounded-lg'],
    shouldHave: ['backdrop-blur-sm', 'hover-lift']
  }
};
```

**3. Review Output Format**

```markdown
## Design Review Results for src/FullApp.js

### ❌ Critical Issues (Must Fix)
- Line 245: Input field missing `font-mono` class
  ```diff
  - class="w-full px-3 py-2 bg-slate-800 border border-slate-700"
  + class="w-full px-3 py-2 bg-slate-800 border border-slate-700 font-mono"
  ```

- Line 389: Using generic blue color instead of amber
  ```diff
  - class="bg-blue-600 text-white"
  + class="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
  ```

### ⚠️ Warnings (Should Fix)
- Line 512: Card missing hover effect
  ```diff
  - class="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
  + class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover-lift"
  ```

### ✅ Passed Checks
- All buttons use correct variant system
- Consistent border colors (slate-700/800)
- Monospace fonts on all technical data
- Proper animation classes on dynamic content

### Summary
- Critical: 2 issues
- Warnings: 1 issue
- Passed: 15 checks

**Recommendation:** Fix critical issues before committing.
```

### Agent Prompt Template

```markdown
You are a UI design enforcement agent for the Claude API Explorer project.

Your task is to review the provided code changes and ensure they comply with
the project's UI Design Standards documented in CLAUDE.md.

Review the following file:
{filePath}

Changed lines:
{diffContent}

Check for:
1. **Color Compliance**: No white/gray backgrounds, use slate instead
2. **Typography**: All inputs/code must have font-mono
3. **Accent Colors**: Amber for actions, mint for success
4. **Animations**: Dynamic content should have animate-slide-up or animate-fade-in
5. **Component Patterns**: Match established patterns for inputs, buttons, cards
6. **Transitions**: Interactive elements need transition-colors or transition-all

For each violation found:
- Identify the line number
- Explain why it violates the design standard
- Provide a specific fix with before/after code

Categorize issues as:
- CRITICAL: Breaks design system (wrong colors, missing font-mono on inputs)
- WARNING: Inconsistent with best practices (missing animations, hover states)
- INFO: Suggestions for improvement

Format your response as a structured design review report.
```

### Integration Methods

**Method 1: Claude Code Plugin (Recommended)**
```javascript
// .claude/plugins/design-reviewer/agent.js
export default {
  name: 'design-reviewer',
  trigger: 'post-edit',
  files: ['src/**/*.js', 'src/components/**/*.js'],
  async run(context) {
    const { filePath, changes } = context;
    const violations = await detectViolations(filePath, changes);

    if (violations.critical.length > 0) {
      return {
        status: 'error',
        message: `Found ${violations.critical.length} critical design violations`,
        details: formatViolations(violations)
      };
    }

    return {
      status: 'success',
      warnings: violations.warnings
    };
  }
};
```

**Method 2: Slash Command**
```bash
# Usage: /design-review [filepath]
# Runs design review on demand

/design-review src/FullApp.js
/design-review src/components/common/Button.js
/design-review --all  # Review all UI files
```

**Method 3: Pre-Commit Git Hook**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running design review..."
changed_files=$(git diff --cached --name-only | grep -E '\.(js|jsx)$')

for file in $changed_files; do
  if [[ $file == src/* ]]; then
    claude-agent run design-reviewer --file="$file"
    if [ $? -ne 0 ]; then
      echo "Design review failed for $file"
      echo "Fix design violations before committing"
      exit 1
    fi
  fi
done
```

### Example Sub-Agent Session

```
User: [Edits src/FullApp.js, adding a new input field]

Design Reviewer Agent: 🎨 Running design review on src/FullApp.js...

❌ CRITICAL: Line 456 - Input field violates design standards

Found:
  <input class="w-full px-3 py-2 border border-gray-300 rounded text-sm" />

Issues:
  1. Using border-gray-300 instead of border-slate-700
  2. Missing font-mono class
  3. Missing background color (should be bg-slate-800)
  4. Missing text color (should be text-slate-100)

Recommended fix:
  <input class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                focus:outline-none text-sm font-mono text-slate-100
                placeholder-slate-600 hover:border-slate-600 transition-colors" />

Would you like me to apply this fix automatically? [y/n]
```

### Configuration File

```json
// .claude/design-review.config.json
{
  "enabled": true,
  "autoFix": false,
  "strictMode": true,
  "rules": {
    "colors": {
      "severity": "error",
      "allowList": ["slate", "amber", "mint", "red", "purple"]
    },
    "typography": {
      "severity": "error",
      "requireFontMono": ["input", "textarea", "select", "code", "pre"]
    },
    "animations": {
      "severity": "warning",
      "requireAnimations": ["modal", "dropdown", "panel"]
    }
  },
  "exclude": [
    "*.test.js",
    "*.spec.js"
  ]
}
```

### Future Enhancements

1. **Visual Regression Testing**
   - Screenshot comparison before/after changes
   - Detect color drift over time

2. **Accessibility Checks**
   - Contrast ratio validation
   - Focus state verification

3. **Performance Monitoring**
   - CSS bundle size tracking
   - Animation performance analysis

4. **Auto-Fix Mode**
   - Automatically apply common fixes
   - Generate PR with design corrections

5. **Design Metrics Dashboard**
   - Track design consistency over time
   - Report on technical debt accumulation

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

### Working with Usage and Cost APIs

**Important:** These endpoints require an Admin API key (sk-ant-admin...) available only to organization admins.

**Get usage report:**
1. Switch to "Usage" tab
2. Set date range (starting_at and ending_at)
3. Select bucket width (1m, 1h, or 1d)
4. Optionally filter by model, service tier, or workspace
5. Optionally group results by dimension (model, workspace_id, etc.)
6. Click "Get Usage Report"
7. View token breakdowns with cache metrics

**Get cost report:**
1. Switch to "Cost" tab
2. Set date range (starting_at and ending_at)
3. Optionally group by workspace_id or description
4. Click "Get Cost Report"
5. View costs in USD with detailed breakdowns

**Notes:**
- Data appears within 5 minutes of request completion
- All costs are in USD (cents)
- Priority Tier costs are not included in cost reports
- Both endpoints support pagination for large datasets

## Working with the Hybrid Tool System

**Status:** Backend infrastructure complete (Phase 1-3), UI pending (Phase 4-5)
**See:** `TODO.md` for remaining work

### Architecture Overview

The hybrid tool system allows tools to run in two modes:
- **Demo Mode**: Mock data for offline testing (default)
- **Real Mode**: Actual API calls and implementations

### File Structure

```
src/
├── config/
│   └── toolConfig.js         # Tool registry, configuration, availability checks
├── utils/
│   ├── formatters.js          # Demo tool implementations (legacy + enhanced)
│   └── toolExecutors/
│       ├── index.js           # Execution router (demo vs real)
│       ├── calculator.js      # Enhanced math expressions
│       ├── jsonValidator.js   # JSON validation
│       ├── codeFormatter.js   # Code formatting
│       ├── tokenCounter.js    # Token estimation
│       ├── regexTester.js     # Regex testing
│       ├── weather.js         # OpenWeatherMap API
│       └── search.js          # Brave Search API
```

### Key Components

**1. Tool Configuration (`toolConfig.js`)**
- `TOOL_REGISTRY`: Defines all tools with metadata
- `isToolAvailable(toolName, mode, apiKeys)`: Check if tool can execute
- `getToolMode(toolName, preferredMode, apiKeys)`: Determine actual mode to use
- `getRequiredApiKeys()`: Get list of API keys needed

**2. Tool Executor Router (`toolExecutors/index.js`)**
- `executeTool(toolName, input, mode, apiKeys)`: Main entry point
- Routes between demo (formatters.js) and real implementations
- Handles errors and fallbacks

**3. State Management (`AppContext.js`)**
- `toolMode`: Current mode ('demo' or 'real')
- `toolApiKeys`: Object with API keys (e.g., `{openweathermap: '...', brave_search: '...'}`)
- Both persist in localStorage automatically

**4. API Proxies (`server.js`)**
- `/api/weather`: OpenWeatherMap proxy
- `/api/search`: Brave Search proxy

### Tools Available

**Developer Tools (No External APIs):**
1. **Enhanced Calculator** - Math expressions with functions (sqrt, sin, cos, pow, log, etc.)
2. **JSON Validator** - Validate, format, and analyze JSON
3. **Code Formatter** - Format JavaScript, Python, JSON
4. **Token Counter** - Estimate Claude token counts
5. **Regex Tester** - Test patterns with match details

**External API Tools (Require Keys):**
6. **Weather** - OpenWeatherMap integration
7. **Web Search** - Brave Search integration

### Adding a New Tool

**1. Add to Tool Registry** (`toolConfig.js`):
```javascript
new_tool: {
  name: 'new_tool',
  displayName: 'New Tool',
  description: 'What this tool does',
  hasDemo: true,
  hasReal: true,
  requiresApiKey: false,
  category: 'developer'
}
```

**2. Create Real Implementation** (`toolExecutors/newTool.js`):
```javascript
export async function executeNewTool(input, apiKey) {
  try {
    // Implementation
    return JSON.stringify({
      success: true,
      result: /* ... */,
      mode: 'real'
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message,
      mode: 'real'
    });
  }
}
```

**3. Add to Executor Router** (`toolExecutors/index.js`):
```javascript
import { executeNewTool } from './newTool.js';

// In executeRealTool function:
case 'new_tool':
  return await executeNewTool(input, apiKeys.api_key_name);
```

**4. (Optional) Add Demo Implementation** (`formatters.js`):
```javascript
new_tool: (input) => {
  // Mock implementation
  return JSON.stringify({ /* mock data */ });
}
```

**5. Add Tool Definition** (`FullApp.js`):
```javascript
{
  name: 'new_tool',
  description: 'What this tool does',
  input_schema: {
    type: 'object',
    properties: {
      /* parameters */
    },
    required: [/* required params */]
  }
}
```

### Current Tool Behavior

**Default Mode:** Demo (mock data)
**Tool Execution:** Automatic when Claude requests tools
**Format Support:** Both old (`{operation, num1, num2}`) and new (`{expression}`) for calculator

### Pending UI Work (See TODO.md)

1. **Tool Mode Toggle** - Switch between demo/real in FullApp.js
2. **API Keys Panel** - Input fields for OpenWeatherMap and Brave Search keys
3. **Tool Definitions** - Add 4 new developer tools to predefined tools array
4. **Visual Indicators** - Show which mode each tool is using

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
1. **Streaming not implemented** - Streaming checkbox removed, non-streaming only
2. **No image previews** - Vision tab shows metadata only
3. **History only for Messages endpoint** - Batches/Models/Usage/Cost don't save to history
4. **No error boundaries** - Whole app crashes on error
5. **No keyboard shortcuts** - Mouse/click only
6. **Batch results download** - No automatic download of .jsonl results
7. **Admin API key requirement** - Usage and Cost APIs require special admin permissions
8. **Hybrid tool UI incomplete** - Backend ready, but mode toggle and API key panel UI pending (see TODO.md)

### Multi-Endpoint Specific Limitations
1. **No batch result preview** - Must download .jsonl file manually
2. **Models API pagination** - UI doesn't support before_id/after_id navigation
3. **Usage/Cost pagination** - UI doesn't support page token navigation
4. **No cross-endpoint history** - Each endpoint operates independently
5. **Batch status polling** - Manual refresh required, no auto-polling
6. **No usage/cost filtering UI** - Advanced filters (models, service_tiers, api_key_ids) require manual input

### Technical Debt
1. All components in one file (FullApp.js) - Now ~1450 lines (approaching split threshold)
2. No TypeScript
3. No automated tests
4. No CI/CD pipeline
5. Response panel logic getting complex with multiple formats
6. Hybrid tool system backend complete but UI pending (TODO.md)

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
**Version:** 2.1
**Maintained by:** Karl (project owner)

---

## Change Log

### 2025-11-06 - Version 2.1: Usage & Cost APIs + Claude Haiku 4.5
**Added Admin API functionality with Usage and Cost reporting endpoints**

**New Features:**
- ✨ Usage Reports API - Track token usage with detailed breakdowns by model, workspace, service tier
- ✨ Cost Reports API - View cost breakdowns in USD with grouping options
- ✨ Claude Haiku 4.5 model support - Latest Haiku with near-frontier performance at lower cost
- ✨ Time granularity options for usage reports (1m, 1h, 1d buckets)
- ✨ Advanced filtering and grouping for usage data
- ✨ Formatted views for usage and cost responses with visual breakdowns

**Infrastructure Changes:**
- 🔧 Replaced Admin API placeholder with functional Usage and Cost endpoints
- 🔧 Added `UsagePanel` component with date range, bucket width, and filtering options
- 🔧 Added `CostPanel` component with date range and grouping options
- 🔧 Extended `ResponsePanel` with usage and cost response formatters
- 🔧 Added proxy routes for `/v1/organizations/usage_report/messages` and `/v1/organizations/cost_report`
- 🔧 Extended `AppContext.js` with `handleGetUsageReport()` and `handleGetCostReport()` handlers
- 🔧 Updated endpoint configuration in `endpoints.js` with usage and cost definitions

**Model Updates:**
- 📦 Added Claude Haiku 4.5 (`claude-haiku-4-5`) to model selector
- 📦 Marked Claude 3.5 Haiku as "Legacy"

**Developer Experience:**
- 📚 Added "Working with Usage and Cost APIs" guide to CLAUDE.md
- 📚 Updated Known Issues & Limitations section
- 📚 Updated Supported API Endpoints documentation

**Breaking Changes:**
- ⚠️ Removed "Admin" tab, replaced with "Usage" and "Cost" tabs
- Admin API key (sk-ant-admin...) now required for Usage and Cost endpoints

**File Size:**
- `FullApp.js`: ~1050 lines → ~1450 lines (approaching split threshold)
- `AppContext.js`: ~400 lines → ~520 lines
- `server.js`: ~90 lines → ~110 lines
- `endpoints.js`: ~150 lines (updated)
- `models.js`: 6 models → 7 models

**Requirements:**
- Admin API key required for Usage and Cost endpoints
- Organization admin role needed to provision Admin API keys

**Next Steps:**
- Add pagination UI for usage and cost reports
- Implement advanced filter UI (models, service_tiers, api_key_ids)
- Consider splitting FullApp.js if it continues to grow
- Add organization management endpoints if needed

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
