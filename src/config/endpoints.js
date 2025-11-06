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

  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Organization and user management (requires admin permissions)',
    method: 'GET', // Default, varies by sub-endpoint
    path: '/v1/admin',
    requiresModel: false,
    supportsStreaming: false,
    parameters: {
      required: [],
      optional: []
    },
    requestType: 'synchronous',
    responseType: 'admin',
    note: 'Admin API requires special permissions and will be implemented based on specific needs'
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
