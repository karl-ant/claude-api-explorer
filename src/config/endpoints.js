/**
 * Anthropic API Endpoints Configuration
 * Defines the API endpoints exposed as tabs, their parameters, and characteristics
 */

const endpoints = {
  messages: {
    id: 'messages',
    name: 'Messages',
    description: 'Send messages to Claude and receive responses',
    method: 'POST',
    path: '/v1/messages',
    requiresModel: true,
    supportsStreaming: true,
    parameters: {
      required: ['model', 'messages', 'max_tokens'],
      optional: ['system', 'temperature', 'top_p', 'top_k', 'tools', 'tool_choice', 'stream', 'metadata', 'stop_sequences', 'thinking', 'output_config', 'speed', 'container', 'diagnostics', 'inference_geo', 'context_management', 'service_tier']
    },
    requestType: 'synchronous',
    responseType: 'message'
  },

  skills: {
    id: 'skills',
    name: 'Skills',
    description: 'Create and manage custom skills for document processing (Beta)',
    method: 'GET',
    path: '/v1/skills',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: [],
      optional: ['source', 'limit', 'page']
    },
    requestType: 'synchronous',
    responseType: 'skills',
    note: 'Requires anthropic-beta: skills-2025-10-02 header (auto-included).',
    subEndpoints: {
      create: {
        id: 'skills-create',
        name: 'Create Skill',
        description: 'Upload files to create a new skill (requires SKILL.md)',
        method: 'POST',
        path: '/v1/skills',
        parameters: {
          required: ['files'],
          optional: ['display_title']
        }
      },
      get: {
        id: 'skills-get',
        name: 'Get Skill',
        description: 'Retrieve details of a specific skill',
        method: 'GET',
        path: '/v1/skills/:id',
        parameters: {
          required: ['skill_id'],
          optional: []
        }
      },
      delete: {
        id: 'skills-delete',
        name: 'Delete Skill',
        description: 'Permanently remove a skill',
        method: 'DELETE',
        path: '/v1/skills/:id',
        parameters: {
          required: ['skill_id'],
          optional: []
        }
      }
    }
  },

  files: {
    id: 'files',
    name: 'Files',
    description: 'Upload and manage files referenced by file_id in Messages requests (Beta)',
    method: 'GET',
    path: '/v1/files',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: [],
      optional: ['limit', 'before_id', 'after_id']
    },
    requestType: 'synchronous',
    responseType: 'files',
    note: 'Requires anthropic-beta: files-api-2025-04-14 header (auto-included). File operations are free; you are billed only when a file_id is referenced in a Messages request.',
    subEndpoints: {
      upload: {
        id: 'files-upload',
        name: 'Upload File',
        description: 'Upload a file (multipart/form-data, 500 MB max per file)',
        method: 'POST',
        path: '/v1/files',
        parameters: {
          required: ['file'],
          optional: []
        }
      },
      get: {
        id: 'files-get',
        name: 'Get File Metadata',
        description: 'Retrieve metadata for a specific file',
        method: 'GET',
        path: '/v1/files/:id',
        parameters: {
          required: ['file_id'],
          optional: []
        }
      },
      delete: {
        id: 'files-delete',
        name: 'Delete File',
        description: 'Permanently delete a file (irreversible)',
        method: 'DELETE',
        path: '/v1/files/:id',
        parameters: {
          required: ['file_id'],
          optional: []
        }
      },
      download: {
        id: 'files-download',
        name: 'Download File Content',
        description: 'Download file content (only for files created by skills or code execution)',
        method: 'GET',
        path: '/v1/files/:id/content',
        parameters: {
          required: ['file_id'],
          optional: []
        }
      }
    }
  }
};

export default endpoints;
