# Current Anthropic API Endpoints

Source: [Anthropic API Overview](https://platform.claude.com/docs/en/api/overview)

Last updated: 2026-01-30

## GA Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/messages` | Create a message (send messages to Claude) |
| `POST` | `/v1/messages/batches` | Create a message batch |
| `GET` | `/v1/messages/batches` | List message batches |
| `GET` | `/v1/messages/batches/:id` | Get batch status |
| `POST` | `/v1/messages/batches/:id/cancel` | Cancel a batch |
| `GET` | `/v1/messages/batches/:id/results` | Get batch results |
| `POST` | `/v1/messages/count_tokens` | Count tokens for a message |
| `GET` | `/v1/models` | List available models |
| `GET` | `/v1/models/:id` | Get a specific model |

## Beta Endpoints

### Files API (Beta)

Requires header: `anthropic-beta: files-api-2025-04-14`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/files` | Upload a file |
| `GET` | `/v1/files` | List files |
| `GET` | `/v1/files/:id` | Get file metadata |
| `GET` | `/v1/files/:id/content` | Download file content |
| `DELETE` | `/v1/files/:id` | Delete a file |

### Skills API (Beta)

Requires header: `anthropic-beta: skills-2025-10-02`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/skills` | Create a skill |
| `GET` | `/v1/skills` | List skills |
| `GET` | `/v1/skills/:id` | Get a skill |
| `DELETE` | `/v1/skills/:id` | Delete a skill |
| `GET` | `/v1/skills/:id/versions` | List skill versions |
| `DELETE` | `/v1/skills/:id/versions/:version` | Delete a skill version |
