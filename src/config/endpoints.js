/**
 * Anthropic API Endpoints Configuration
 * Defines all supported API endpoints, their parameters, and characteristics
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
      optional: ['system', 'temperature', 'top_p', 'top_k', 'tools', 'stream', 'metadata', 'stop_sequences']
    },
    requestType: 'synchronous',
    responseType: 'message'
  },

  batches: {
    id: 'batches',
    name: 'Message Batches',
    description: 'Process large batches of messages asynchronously at 50% cost',
    method: 'POST',
    path: '/v1/messages/batches',
    requiresModel: false, // Model is specified per request in the batch
    supportsStreaming: false,
    parameters: {
      required: ['requests'], // Array of {custom_id, params}
      optional: []
    },
    requestType: 'asynchronous',
    responseType: 'batch',
    subEndpoints: {
      get: {
        id: 'batches-get',
        name: 'Get Batch Status',
        description: 'Retrieve status and results of a batch',
        method: 'GET',
        path: '/v1/messages/batches/:id',
        parameters: {
          required: ['batch_id'],
          optional: []
        }
      },
      list: {
        id: 'batches-list',
        name: 'List Batches',
        description: 'List all batches',
        method: 'GET',
        path: '/v1/messages/batches',
        parameters: {
          required: [],
          optional: ['limit', 'before_id', 'after_id']
        }
      },
      cancel: {
        id: 'batches-cancel',
        name: 'Cancel Batch',
        description: 'Cancel a batch that is in progress',
        method: 'POST',
        path: '/v1/messages/batches/:id/cancel',
        parameters: {
          required: ['batch_id'],
          optional: []
        }
      }
    }
  },

  models: {
    id: 'models',
    name: 'Models',
    description: 'List available Claude models and their details',
    method: 'GET',
    path: '/v1/models',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: [],
      optional: ['limit', 'before_id', 'after_id']
    },
    requestType: 'synchronous',
    responseType: 'list'
  },

  usage: {
    id: 'usage',
    name: 'Usage Reports',
    description: 'Track token usage across your organization with detailed breakdowns',
    method: 'GET',
    path: '/v1/organizations/usage_report/messages',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: ['starting_at', 'ending_at', 'bucket_width'],
      optional: ['models', 'service_tiers', 'context_window', 'api_key_ids', 'workspace_ids', 'group_by', 'limit', 'page']
    },
    requestType: 'synchronous',
    responseType: 'usage',
    note: 'Requires Admin API key (sk-ant-admin...). Data appears within 5 minutes of request completion.'
  },

  cost: {
    id: 'cost',
    name: 'Cost Reports',
    description: 'View detailed cost breakdowns for token usage and services',
    method: 'GET',
    path: '/v1/organizations/cost_report',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: ['starting_at', 'ending_at'],
      optional: ['group_by', 'limit', 'page']
    },
    requestType: 'synchronous',
    responseType: 'cost',
    note: 'Requires Admin API key (sk-ant-admin...). All costs are in USD (cents). Priority Tier costs not included.'
  }
};

/**
 * Get endpoint configuration by ID
 */
export function getEndpoint(endpointId) {
  return endpoints[endpointId];
}

/**
 * Get all endpoint configurations
 */
export function getAllEndpoints() {
  return endpoints;
}

/**
 * Get list of endpoint IDs for navigation
 */
export function getEndpointIds() {
  return Object.keys(endpoints);
}

/**
 * Check if an endpoint supports a specific feature
 */
export function endpointSupports(endpointId, feature) {
  const endpoint = endpoints[endpointId];
  if (!endpoint) return false;

  switch (feature) {
    case 'streaming':
      return endpoint.supportsStreaming;
    case 'model':
      return endpoint.requiresModel;
    case 'async':
      return endpoint.requestType === 'asynchronous';
    default:
      return false;
  }
}

export default endpoints;
