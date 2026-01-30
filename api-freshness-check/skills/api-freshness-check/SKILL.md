# API Freshness Check

Audit the Claude API Explorer app against the latest Anthropic API documentation and interactively update outdated configurations.

## Workflow

Follow these steps in order. Report findings per category, then ask the user before applying any changes.

### Step 1: Read Current App State

Read the following files to understand the current configuration:

1. **Models:** Read `src/config/models.js` to get the current model list (IDs, names, descriptions, pricing)
2. **Endpoints:** Read `src/config/endpoints.js` to get the current endpoint definitions
3. **Beta Headers:** Read `src/FullApp.js` and search for `BETA_HEADER_OPTIONS` (around line 76) to get the current beta header toggle options
4. **API Version:** Read `src/context/AppContext.js` and `server.js`, search for `anthropic-version` to find the current API version header value

### Step 2: Read Reference Data

Read the latest known-good state from the reference files in this skill's `references/` directory:

1. Read `references/current-models.md`
2. Read `references/current-endpoints.md`
3. Read `references/current-betas.md`

### Step 3: Compare and Report

Compare the current app state against the reference data. Report findings for each category using the format below. Be specific about what's outdated, missing, or incorrect.

#### Models Report

Compare `src/config/models.js` against `references/current-models.md`:

- **Missing models:** List any model IDs in the reference that are not in `models.js`
- **Pricing discrepancies:** Compare input/output pricing per model. Flag any mismatches.
- **Deprecated models:** List any models in `models.js` that are not in the reference at all (they may have been removed or renamed)
- **Name mismatches:** Flag any models where the display name differs

Format each finding as a bullet point with the specific model ID and what needs to change.

#### Endpoints Report

Compare `src/config/endpoints.js` against `references/current-endpoints.md`:

- **Missing GA endpoints:** List any GA endpoints in the reference not defined in `endpoints.js`
- **Missing beta endpoints:** List any beta endpoints in the reference not defined in `endpoints.js`
- **Missing proxy routes:** Check `server.js` for corresponding proxy routes for any missing endpoints

Format each finding with the HTTP method, path, and description.

#### Beta Headers Report

Compare `BETA_HEADER_OPTIONS` in `src/FullApp.js` against `references/current-betas.md`:

- **Missing active headers:** List any active beta headers from the reference not in `BETA_HEADER_OPTIONS`
- **Deprecated headers still present:** List any deprecated/graduated headers still in `BETA_HEADER_OPTIONS` without a deprecation note
- **Graduated features:** Note any features that have moved from beta to GA

Format each finding with the header value and what action to take.

#### API Version Report

Compare `anthropic-version` values found in `AppContext.js` and `server.js` against the version in `references/current-betas.md`:

- **Version matches:** Confirm if the version is current
- **Version mismatches:** Flag any files with outdated versions

### Step 4: Interactive Updates

After presenting the full report, ask the user for approval **per category** before making changes. Use AskUserQuestion with multi-select to let them choose which categories to update.

Example question: "Which categories should I update?"
- Options: Models, Endpoints, Beta Headers, API Version, None

For each approved category, make the necessary code changes:

#### Applying Model Updates
- Add missing models to the array in `src/config/models.js`
- Fix pricing values for existing models
- Add legacy/deprecated models in a separate section if appropriate
- Maintain the existing code style and structure

#### Applying Endpoint Updates
- Add missing endpoint definitions to `src/config/endpoints.js`
- Add corresponding proxy routes to `server.js` if needed
- Follow the existing patterns for endpoint definitions

#### Applying Beta Header Updates
- Add missing active headers to `BETA_HEADER_OPTIONS` in `src/FullApp.js`
- Add deprecation notes to graduated headers (e.g., append " (deprecated)" to the label)
- Follow the existing array structure and style

#### Applying API Version Updates
- Update `anthropic-version` header value in all files where it appears

### Step 5: Verify

After applying updates, suggest the user run:
```
npm test
```
to verify that existing tests still pass after the configuration changes.

## Important Notes

- **Do not make changes without asking first.** Always present the full report and get category-level approval.
- **Preserve existing code style.** Match indentation, quote style, and structure of each file.
- **Be conservative with removals.** Don't remove models or headers that might still be useful -- flag them with deprecation notes instead.
- **Reference data may be stale.** If the user mentions that the reference data itself is outdated, help them update the `references/*.md` files too.
