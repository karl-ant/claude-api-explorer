# Current Anthropic Models

Source: [Anthropic Models Documentation](https://platform.claude.com/docs/en/about-claude/models/overview)

Last updated: 2026-06-29

## Current (Latest) Models

| Model ID | Name | Input $/MTok | Output $/MTok | Max output | Context |
|----------|------|-------------|--------------|-----------|---------|
| `claude-fable-5` | Claude Fable 5 | $10 | $50 | 128k | 1M |
| `claude-opus-4-8` | Claude Opus 4.8 | $5 | $25 | 128k | 1M |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | $3 | $15 | 128k | 1M |
| `claude-haiku-4-5-20251001` | Claude Haiku 4.5 | $1 | $5 | 64k | 200k |

## Legacy Models (still callable)

| Model ID | Name | Input $/MTok | Output $/MTok | Status |
|----------|------|-------------|--------------|--------|
| `claude-opus-4-7` | Claude Opus 4.7 | $5 | $25 | Active (legacy) |
| `claude-opus-4-6` | Claude Opus 4.6 | $5 | $25 | Active (legacy) |
| `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 | $3 | $15 | Active (legacy) |
| `claude-opus-4-5-20251101` | Claude Opus 4.5 | $5 | $25 | Active (legacy) |
| `claude-opus-4-1-20250805` | Claude Opus 4.1 | $15 | $75 | Deprecated — retires 2026-08-05 |

## Retired Models (API returns an error)

| Model ID | Retired |
|----------|---------|
| `claude-sonnet-4-20250514` | 2026-06-15 |
| `claude-opus-4-20250514` | 2026-06-15 |
| `claude-3-haiku-20240307` | 2026-04-20 |
| `claude-3-7-sonnet-20250219` | 2026-02-19 |
| `claude-3-5-haiku-20241022` | 2026-02-19 |

## Notes

- Starting with the 4.6 generation, model IDs are dateless but still pinned snapshots (`claude-opus-4-8`, `claude-fable-5`, `claude-sonnet-4-6`).
- `claude-mythos-5` / `claude-mythos-preview` exist but are invitation-only (Project Glasswing) — not generally callable.
- Adaptive thinking only (manual `budget_tokens` → 400): Fable 5, Opus 4.8, Opus 4.7. Adaptive thinking always on: Fable 5.
- `xhigh` effort: Fable 5, Opus 4.8, Opus 4.7. `max` effort: Fable 5, Opus 4.8/4.7/4.6, Sonnet 4.6.
- Fast mode (`speed: "fast"`, header `fast-mode-2026-02-01`): Opus 4.8 (research preview, $10/$50); deprecated on Opus 4.7 (removed 2026-07-24) and Opus 4.6 (removed 2026-06-29).
