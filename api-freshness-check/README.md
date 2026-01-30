# API Freshness Check

A Claude Code plugin that audits the Claude API Explorer app against the latest Anthropic API documentation and interactively updates outdated configurations.

## What It Checks

- **Models** -- Compares `src/config/models.js` against latest Anthropic model catalog (IDs, names, pricing)
- **Endpoints** -- Compares `src/config/endpoints.js` against latest GA and beta API endpoints
- **Beta Headers** -- Compares `BETA_HEADER_OPTIONS` in `src/FullApp.js` against latest active/deprecated beta headers
- **API Version** -- Verifies `anthropic-version` header value across `AppContext.js` and `server.js`

## Usage

Run the skill from Claude Code:

```
/api-freshness-check
```

The skill will:
1. Read current app configuration files
2. Compare against reference data in `references/`
3. Report findings per category (models, endpoints, betas, API version)
4. Ask before applying updates to each category

## Updating Reference Data

When Anthropic releases new models or API changes, update the files in `skills/api-freshness-check/references/`:

- `current-models.md` -- Model IDs, names, pricing
- `current-endpoints.md` -- GA and beta API endpoints
- `current-betas.md` -- Active and deprecated beta headers

## Plugin Structure

```
api-freshness-check/
  .claude-plugin/
    plugin.json           # Plugin manifest
  README.md               # This file
  skills/
    api-freshness-check/
      SKILL.md            # Main skill instructions
      references/
        current-models.md
        current-endpoints.md
        current-betas.md
```
