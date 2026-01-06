---
name: sync-docs
description: Update project documentation (CLAUDE.md, README.md) with session changes and prepare for next session
---

# Documentation Sync & Session Handoff

You are a documentation manager. Update project documentation to reflect session changes and prepare for the next session.

## Your Mission

Analyze the current session's work and intelligently update CLAUDE.md and README.md to ensure the next session is productive and well-informed.

---

## Process

### 1. Analyze Current Session

Review the conversation history to identify:
- **New features added** (code, functionality, endpoints, tools)
- **Removed features or technical debt addressed**
- **Changed patterns** (architecture, conventions, standards)
- **New dependencies** added to package.json
- **Test coverage changes** (new test files, coverage improvements)
- **Configuration changes** (new agents, commands, settings)
- **Bug fixes or improvements**
- **Documentation gaps** that need filling

### 2. Read Current Documentation

Read the following files to understand current state:
- `CLAUDE.md` - Development guide for AI assistants
- `README.md` - User-facing project documentation
- `package.json` - Current dependencies and scripts

### 3. Determine Updates Needed

**For CLAUDE.md:**
- Update "Tech Stack" if dependencies changed
- Update "Project Structure" if files/directories added
- Update "Code Standards" if new patterns introduced
- Update "Common Tasks" if new workflows added
- Update "Technical Debt" section - remove solved items, add new ones
- Update version number and "Recent Changes" section
- Remove outdated information

**For README.md:**
- Update "Features" section with new capabilities
- Update "Tech Stack" if dependencies changed
- Update "Features Implemented" checklist
- Update "Future Enhancements" - remove completed items
- Update "Project Structure" if major changes
- Remove stale "Limitations" that were addressed
- Keep it user-friendly and high-level

**For both:**
- Ensure consistency between docs
- Remove contradictions
- Update examples if APIs changed
- Fix any inaccuracies discovered

### 4. Generate Update Plan

Before making changes, create a summary of what will be updated:

```markdown
## Documentation Sync Plan

### Session Summary
[Brief summary of what was accomplished this session]

### CLAUDE.md Updates
- [ ] Update X section: [reason]
- [ ] Remove Y (outdated): [reason]
- [ ] Add Z information: [reason]

### README.md Updates
- [ ] Update features list: [what changed]
- [ ] Update tech stack: [what changed]
- [ ] Remove from future enhancements: [what was completed]
- [ ] Add/update limitations: [what changed]

### Version Bump
- Current: X.Y
- Proposed: X.Z
- Reason: [what changed]
```

### 5. Execute Updates

Make the necessary edits to both files. For each edit:
- Preserve the existing structure and tone
- Be precise and factual
- Keep CLAUDE.md technical and detailed
- Keep README.md user-friendly and accessible
- Update version numbers and changelogs

### 6. Verification

After updates, perform a final check:
- Do both docs accurately reflect current state?
- Are there any contradictions between them?
- Is all outdated information removed?
- Are new features properly documented?
- Will the next session have clear context?

---

## Guidelines

### What to Update

**ALWAYS update:**
- Version numbers with semantic versioning
- "Recent Changes" / changelog sections
- Technical debt lists (remove solved, add new)
- Dependency lists when package.json changed
- Feature checklists when features added
- Test coverage information when tests added

**UPDATE when significant:**
- Architecture descriptions (major refactoring)
- Code patterns (new conventions adopted)
- Project structure (new directories, major files)
- Tech stack (framework version updates, new tools)

**DON'T update unnecessarily:**
- Minor bug fixes (unless user-facing)
- Refactoring that doesn't change APIs
- Internal improvements not relevant to developers
- Experimental changes not yet stable

### What to Remove

**ALWAYS remove:**
- Completed "Future Enhancements" items
- Solved "Technical Debt" items
- Fixed "Limitations"
- Outdated "Known Issues"
- Deprecated patterns or APIs

**REMOVE when obsolete:**
- Old architecture descriptions
- Superseded examples
- Incorrect information
- Contradictory statements

### Tone and Style

**CLAUDE.md:**
- Technical and precise
- Include code examples
- Reference file paths with line numbers
- Use developer terminology
- Explain "why" not just "what"

**README.md:**
- User-friendly and welcoming
- Focus on features and benefits
- Less technical jargon
- Clear setup instructions
- Encourage exploration

---

## Output Format

```markdown
## Documentation Sync Complete

### Session Summary
[2-3 sentences describing main accomplishments]

### Updates Made

**CLAUDE.md (vX.Y → vX.Z):**
- Updated [section]: [description]
- Removed [item]: [reason]
- Added [information]: [reason]

**README.md:**
- Updated [section]: [description]
- Removed [item]: [reason]
- Added [information]: [reason]

### Key Changes for Next Session
[Bullet points of what the next session should know]

### Remaining Documentation Gaps
[Any areas that still need attention in future sessions]
```

---

## Special Cases

### New Major Feature Added
- Add to features list in both docs
- Update tech stack if new dependencies
- Add usage instructions to README
- Add implementation details to CLAUDE.md
- Update "Recent Changes"

### Technical Debt Addressed
- Remove from CLAUDE.md Technical Debt section
- Update relevant code examples
- Note in changelog if significant

### Test Suite Added
- Update README "Features Implemented" (check off "Unit tests")
- Update CLAUDE.md with testing section
- Add npm test commands to README
- Remove from "Future Enhancements" if listed

### Refactoring Completed
- Update CLAUDE.md code patterns
- Update project structure if files moved
- Update import examples if changed
- Note architectural improvements

### Dependencies Changed
- Update package.json references in both docs
- Update Tech Stack sections
- Note breaking changes if any
- Update installation instructions if needed

---

## Execution

Now analyze this session and update the documentation accordingly.

If this is the end of a session, ensure both documents are publication-ready and will give the next session maximum context.
