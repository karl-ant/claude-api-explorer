import React, { useState } from 'react';
import htm from 'htm';
import { AppProvider, useApp } from './context/AppContext.js';
import { Button } from './components/common/Button.js';
import { Toggle } from './components/common/Toggle.js';
import { Tabs } from './components/common/Tabs.js';
import { fileToBase64, getImageMediaType, extractMessageText } from './utils/formatters.js';

const html = htm.bind(React.createElement);

function ApiKeySection() {
  const { apiKey, setApiKey, persistKey, setPersistKey, clearApiKey } = useApp();
  const [showKey, setShowKey] = useState(false);

  return html`
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              type=${showKey ? 'text' : 'password'}
              value=${apiKey}
              onInput=${(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            />
            <button
              onClick=${() => setShowKey(!showKey)}
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ${showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          ${apiKey && html`
            <${Button} variant="ghost" size="sm" onClick=${clearApiKey}>Clear</${Button}>
          `}
        </div>
      </div>
      <div class="flex items-center justify-between">
        <${Toggle}
          label="Remember API key"
          checked=${persistKey}
          onChange=${setPersistKey}
        />
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-blue-600 hover:underline"
        >
          Get API key →
        </a>
      </div>
      ${!persistKey && html`
        <p class="text-xs text-gray-500">Key will be cleared when browser closes</p>
      `}
    </div>
  `;
}

function ModelSelector() {
  const { model, setModel, models, maxTokens, setMaxTokens, temperature, setTemperature, topP, setTopP, topK, setTopK, stream, setStream } = useApp();

  return html`
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select
          value=${model}
          onChange=${(e) => setModel(e.target.value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          ${models.map((m) => html`
            <option key=${m.id} value=${m.id}>${m.name}</option>
          `)}
        </select>
        <p class="text-xs text-gray-500 mt-1">
          ${models.find((m) => m.id === model)?.description}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
          <input
            type="number"
            value=${maxTokens}
            onInput=${(e) => setMaxTokens(parseInt(e.target.value, 10))}
            min="1"
            max="8192"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
          <input
            type="number"
            value=${temperature}
            onInput=${(e) => setTemperature(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Top P</label>
          <input
            type="number"
            value=${topP}
            onInput=${(e) => setTopP(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Top K</label>
          <input
            type="number"
            value=${topK}
            onInput=${(e) => setTopK(parseInt(e.target.value, 10))}
            min="0"
            max="500"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t">
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            checked=${stream}
            onChange=${(e) => setStream(e.target.checked)}
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label class="text-sm font-medium text-gray-700">Stream Response</label>
        </div>
      </div>
    </div>
  `;
}

function MessageBuilder() {
  const { messages, setMessages, system, setSystem } = useApp();

  const addMessage = () => {
    setMessages([...messages, { role: 'user', content: '' }]);
  };

  const updateMessage = (index, field, value) => {
    const updated = [...messages];
    updated[index] = { ...updated[index], [field]: value };
    setMessages(updated);
  };

  const removeMessage = (index) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  return html`
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">System Prompt (Optional)</label>
        <textarea
          value=${system}
          onInput=${(e) => setSystem(e.target.value)}
          placeholder="You are a helpful assistant..."
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
        ></textarea>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">Messages</label>
          <${Button} variant="ghost" size="sm" onClick=${addMessage}>+ Add Message</${Button}>
        </div>

        <div class="space-y-3">
          ${messages.map((message, index) => html`
            <div key=${index} class="border border-gray-200 rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <select
                  value=${message.role}
                  onChange=${(e) => updateMessage(index, 'role', e.target.value)}
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>

                ${messages.length > 1 && html`
                  <button
                    onClick=${() => removeMessage(index)}
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                `}
              </div>

              <textarea
                value=${message.content}
                onInput=${(e) => updateMessage(index, 'content', e.target.value)}
                placeholder="Enter ${message.role} message..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              ></textarea>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

function AdvancedOptions() {
  const { tools, setTools, images, setImages } = useApp();
  const [activeTab, setActiveTab] = useState('vision');
  const [toolJson, setToolJson] = useState('');

  const tabs = [
    { id: 'vision', label: 'Vision' },
    { id: 'tools', label: 'Tools' },
  ];

  // Vision handlers
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        const mediaType = getImageMediaType(file);
        newImages.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
      }
    }
    setImages(prev => [...prev, ...newImages]);
  };

  const handleUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setImages(prev => [...prev, { type: 'image', source: { type: 'url', url } }]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Tools handlers
  const addToolFromJson = () => {
    try {
      const tool = JSON.parse(toolJson);
      setTools(prev => [...prev, tool]);
      setToolJson('');
    } catch (error) {
      alert('Invalid JSON: ' + error.message);
    }
  };

  const addPredefinedTool = (toolType) => {
    const predefined = {
      calculator: {
        name: 'calculator',
        description: 'Perform mathematical calculations. Supports basic arithmetic, exponents, and common math functions.',
        input_schema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "pow(2, 3)")'
            }
          },
          required: ['expression']
        }
      },
      get_weather: {
        name: 'get_weather',
        description: 'Get the current weather for a specific location',
        input_schema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g., San Francisco, CA'
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'The unit of temperature to return'
            }
          },
          required: ['location']
        }
      },
      web_search: {
        name: 'web_search',
        description: 'Search the web for current information',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute'
            },
            num_results: {
              type: 'integer',
              description: 'Number of results to return (1-10)',
              minimum: 1,
              maximum: 10
            }
          },
          required: ['query']
        }
      },
      get_stock_price: {
        name: 'get_stock_price',
        description: 'Get the current stock price for a given ticker symbol',
        input_schema: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'The stock ticker symbol (e.g., AAPL, GOOGL, MSFT)'
            }
          },
          required: ['ticker']
        }
      },
      send_email: {
        name: 'send_email',
        description: 'Send an email to a recipient',
        input_schema: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'The email address of the recipient'
            },
            subject: {
              type: 'string',
              description: 'The subject line of the email'
            },
            body: {
              type: 'string',
              description: 'The body content of the email'
            }
          },
          required: ['to', 'subject', 'body']
        }
      },
      get_current_time: {
        name: 'get_current_time',
        description: 'Get the current time in a specific timezone',
        input_schema: {
          type: 'object',
          properties: {
            timezone: {
              type: 'string',
              description: 'The timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo)'
            }
          },
          required: ['timezone']
        }
      },
      file_search: {
        name: 'file_search',
        description: 'Search for files in a directory based on criteria',
        input_schema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'The directory path to search in'
            },
            pattern: {
              type: 'string',
              description: 'File name pattern to match (e.g., "*.txt", "report_*")'
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to search subdirectories recursively'
            }
          },
          required: ['directory', 'pattern']
        }
      },
      database_query: {
        name: 'database_query',
        description: 'Execute a read-only SQL query against a database',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL SELECT query to execute'
            },
            database: {
              type: 'string',
              description: 'The database name to query'
            }
          },
          required: ['query', 'database']
        }
      },
    };

    if (predefined[toolType]) {
      setTools(prev => [...prev, predefined[toolType]]);
    }
  };

  const removeTool = (index) => {
    setTools(prev => prev.filter((_, i) => i !== index));
  };

  return html`
    <div class="space-y-4">
      <${Tabs} tabs=${tabs} activeTab=${activeTab} onChange=${setActiveTab} />

      <div class="pt-2">
        ${activeTab === 'vision' && html`
          <div class="space-y-3">
            <p class="text-sm text-gray-600">Add images to your messages</p>

            <div class="flex flex-wrap gap-2">
              <label class="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange=${handleFileUpload}
                  class="hidden"
                />
                <span class="inline-block px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Upload File
                </span>
              </label>

              <${Button} variant="secondary" size="sm" onClick=${handleUrlAdd}>
                Add URL
              </${Button}>
            </div>

            ${images.length > 0 && html`
              <div class="space-y-2">
                <p class="text-sm font-medium text-gray-700">${images.length} image(s) added</p>
                ${images.map((img, index) => html`
                  <div key=${index} class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600 truncate">
                      Image ${index + 1} (${img.source.type})
                    </span>
                    <button
                      onClick=${() => removeImage(index)}
                      class="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                `)}
              </div>
            `}
          </div>
        `}

        ${activeTab === 'tools' && html`
          <div class="space-y-3">
            <p class="text-sm text-gray-600">Configure tools for Claude to use. These demonstrate tool calling capabilities but don't actually execute.</p>

            <div class="space-y-3">
              <p class="text-sm font-medium text-gray-700">Predefined Tools</p>

              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-600 uppercase">Data & Information</div>
                <div class="grid grid-cols-2 gap-2">
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('get_weather')}>
                    🌤️ Weather
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('get_stock_price')}>
                    📈 Stock Price
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('get_current_time')}>
                    🕐 Current Time
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('web_search')}>
                    🔍 Web Search
                  </${Button}>
                </div>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-600 uppercase">Computation</div>
                <div class="grid grid-cols-2 gap-2">
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('calculator')}>
                    🧮 Calculator
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('database_query')}>
                    🗄️ Database Query
                  </${Button}>
                </div>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-medium text-gray-600 uppercase">Actions</div>
                <div class="grid grid-cols-2 gap-2">
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('send_email')}>
                    📧 Send Email
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('file_search')}>
                    📁 File Search
                  </${Button}>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700">Custom Tool (JSON)</p>
              <textarea
                value=${toolJson}
                onInput=${(e) => setToolJson(e.target.value)}
                placeholder='{"name": "my_tool", "description": "...", "input_schema": {...}}'
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono resize-none"
              ></textarea>
              <${Button} variant="primary" size="sm" onClick=${addToolFromJson}>
                Add Tool
              </${Button}>
            </div>

            ${tools.length > 0 && html`
              <div class="space-y-2 border-t pt-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-700">${tools.length} tool(s) configured</p>
                  <button
                    onClick=${() => setTools([])}
                    class="text-xs text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  ${tools.map((tool, index) => html`
                    <div key=${index} class="p-3 bg-gray-50 border border-gray-200 rounded">
                      <div class="flex items-start justify-between mb-1">
                        <span class="text-sm text-gray-900 font-medium">${tool.name}</span>
                        <button
                          onClick=${() => removeTool(index)}
                          class="text-red-600 hover:text-red-700 text-xs ml-2"
                        >
                          Remove
                        </button>
                      </div>
                      ${tool.description && html`
                        <p class="text-xs text-gray-600">${tool.description}</p>
                      `}
                      <div class="mt-1 text-xs text-gray-500">
                        ${tool.input_schema?.required?.length > 0
                          ? `Required: ${tool.input_schema.required.join(', ')}`
                          : 'No required parameters'
                        }
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `}
          </div>
        `}
      </div>
    </div>
  `;
}

function MessagesPanel() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return html`
    <div class="space-y-6">
      <${ModelSelector} />

      <div class="border-t pt-4">
        <${MessageBuilder} />
      </div>

      <div class="border-t pt-4">
        <button
          onClick=${() => setShowAdvanced(!showAdvanced)}
          class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>Advanced Options (Vision & Tools)</span>
          <span>${showAdvanced ? '▼' : '▶'}</span>
        </button>

        ${showAdvanced && html`
          <div class="mt-4">
            <${AdvancedOptions} />
          </div>
        `}
      </div>
    </div>
  `;
}

function ModelsPanel() {
  const { modelsList, modelsLoading, handleListModels } = useApp();

  return html`
    <div class="space-y-4">
      <div>
        <p class="text-sm text-gray-600 mb-4">
          List all available Claude models from the Anthropic API
        </p>
        <${Button}
          onClick=${() => handleListModels({ limit: 20 })}
          disabled=${modelsLoading}
          variant="primary"
        >
          ${modelsLoading ? 'Loading...' : 'List Models'}
        </${Button}>
      </div>

      ${modelsList && html`
        <div class="border-t pt-4">
          <h3 class="text-sm font-medium text-gray-900 mb-2">
            Found ${modelsList.data?.length || 0} models
          </h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${modelsList.data?.map((model) => html`
              <div key=${model.id} class="p-3 bg-gray-50 rounded border border-gray-200">
                <div class="font-medium text-sm text-gray-900">${model.display_name || model.id}</div>
                <div class="text-xs text-gray-600 font-mono mt-1">${model.id}</div>
                <div class="text-xs text-gray-500 mt-1">
                  Created: ${new Date(model.created_at).toLocaleDateString()}
                </div>
              </div>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
}

function BatchesPanel() {
  const { batchRequests, setBatchRequests, handleCreateBatch, handleGetBatchStatus, batchStatus } = useApp();
  const [batchId, setBatchId] = useState('');

  const addBatchRequest = () => {
    setBatchRequests([...batchRequests, {
      custom_id: '',
      params: {
        model: 'claude-sonnet-4-20250514',
        messages: [{ role: 'user', content: '' }],
        max_tokens: 1024
      }
    }]);
  };

  const updateBatchRequest = (index, field, value) => {
    const updated = [...batchRequests];
    if (field === 'custom_id') {
      updated[index].custom_id = value;
    } else if (field === 'model') {
      updated[index].params.model = value;
    } else if (field === 'message') {
      updated[index].params.messages[0].content = value;
    } else if (field === 'max_tokens') {
      updated[index].params.max_tokens = parseInt(value, 10);
    }
    setBatchRequests(updated);
  };

  const removeBatchRequest = (index) => {
    if (batchRequests.length > 1) {
      setBatchRequests(batchRequests.filter((_, i) => i !== index));
    }
  };

  return html`
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-sm text-blue-900">
          💡 Message Batches process requests asynchronously at 50% cost
        </p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">Batch Requests</label>
          <${Button} variant="ghost" size="sm" onClick=${addBatchRequest}>+ Add Request</${Button}>
        </div>

        <div class="space-y-3 max-h-64 overflow-y-auto">
          ${batchRequests.map((req, index) => html`
            <div key=${index} class="border border-gray-200 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between">
                <input
                  type="text"
                  value=${req.custom_id}
                  onInput=${(e) => updateBatchRequest(index, 'custom_id', e.target.value)}
                  placeholder="Custom ID (unique identifier)"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                ${batchRequests.length > 1 && html`
                  <button
                    onClick=${() => removeBatchRequest(index)}
                    class="ml-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                `}
              </div>
              <textarea
                value=${req.params.messages[0].content}
                onInput=${(e) => updateBatchRequest(index, 'message', e.target.value)}
                placeholder="Message content..."
                rows="2"
                class="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
              ></textarea>
            </div>
          `)}
        </div>
      </div>

      <div class="border-t pt-4">
        <${Button}
          onClick=${handleCreateBatch}
          variant="primary"
          fullWidth=${true}
        >
          Create Batch
        </${Button}>
      </div>

      <div class="border-t pt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Check Batch Status</label>
        <div class="flex gap-2">
          <input
            type="text"
            value=${batchId}
            onInput=${(e) => setBatchId(e.target.value)}
            placeholder="Batch ID"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <${Button}
            onClick=${() => handleGetBatchStatus(batchId)}
            variant="secondary"
            disabled=${!batchId}
          >
            Check
          </${Button}>
        </div>
      </div>

      ${batchStatus && html`
        <div class="border-t pt-4">
          <div class="p-3 bg-gray-50 rounded border border-gray-200">
            <div class="text-sm font-medium text-gray-900 mb-2">Batch Status</div>
            <div class="text-xs text-gray-600 space-y-1">
              <div>ID: ${batchStatus.id}</div>
              <div>Status: ${batchStatus.processing_status || 'unknown'}</div>
              ${batchStatus.request_counts && html`
                <div class="mt-2">
                  Processing: ${batchStatus.request_counts.processing || 0} |
                  Succeeded: ${batchStatus.request_counts.succeeded || 0} |
                  Errored: ${batchStatus.request_counts.errored || 0}
                </div>
              `}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function UsagePanel() {
  const { handleGetUsageReport, usageLoading } = useApp();
  const [startingAt, setStartingAt] = useState('');
  const [endingAt, setEndingAt] = useState('');
  const [bucketWidth, setBucketWidth] = useState('1h');
  const [selectedModels, setSelectedModels] = useState([]);
  const [serviceTiers, setServiceTiers] = useState([]);
  const [groupBy, setGroupBy] = useState([]);

  // Set default date range (last 7 days)
  React.useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartingAt(start.toISOString().split('.')[0] + 'Z');
    setEndingAt(end.toISOString().split('.')[0] + 'Z');
  }, []);

  const handleGetReport = () => {
    const params = {
      starting_at: startingAt,
      ending_at: endingAt,
      bucket_width: bucketWidth,
    };

    if (selectedModels.length > 0) params.models = selectedModels;
    if (serviceTiers.length > 0) params.service_tiers = serviceTiers;
    if (groupBy.length > 0) params.group_by = groupBy;

    handleGetUsageReport(params);
  };

  const toggleArrayValue = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  return html`
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-xs text-blue-900 font-medium mb-1">Admin API Key Required</p>
        <p class="text-xs text-blue-800">
          This endpoint requires an Admin API key (sk-ant-admin...) available only to organization admins.
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Starting At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${startingAt.slice(0, 16)}
            onChange=${(e) => setStartingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ending At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${endingAt.slice(0, 16)}
            onChange=${(e) => setEndingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bucket Width</label>
          <select
            value=${bucketWidth}
            onChange=${(e) => setBucketWidth(e.target.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="1m">1 minute (real-time monitoring)</option>
            <option value="1h">1 hour (daily patterns)</option>
            <option value="1d">1 day (weekly/monthly reports)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group By (Optional)</label>
          <div class="space-y-2 text-sm">
            ${['model', 'workspace_id', 'service_tier', 'api_key_id'].map(option => html`
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked=${groupBy.includes(option)}
                  onChange=${() => toggleArrayValue(groupBy, setGroupBy, option)}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-700">${option}</span>
              </label>
            `)}
          </div>
        </div>

        <${Button}
          onClick=${handleGetReport}
          loading=${usageLoading}
          disabled=${!startingAt || !endingAt}
          fullWidth=${true}
        >
          Get Usage Report
        </${Button}>
      </div>
    </div>
  `;
}

function CostPanel() {
  const { handleGetCostReport, costLoading } = useApp();
  const [startingAt, setStartingAt] = useState('');
  const [endingAt, setEndingAt] = useState('');
  const [groupBy, setGroupBy] = useState([]);

  // Set default date range (last 7 days)
  React.useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartingAt(start.toISOString().split('.')[0] + 'Z');
    setEndingAt(end.toISOString().split('.')[0] + 'Z');
  }, []);

  const handleGetReport = () => {
    const params = {
      starting_at: startingAt,
      ending_at: endingAt,
    };

    if (groupBy.length > 0) params.group_by = groupBy;

    handleGetCostReport(params);
  };

  const toggleArrayValue = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value));
    } else {
      setArray([...array, value]);
    }
  };

  return html`
    <div class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-xs text-blue-900 font-medium mb-1">Admin API Key Required</p>
        <p class="text-xs text-blue-800">
          This endpoint requires an Admin API key (sk-ant-admin...). All costs are in USD (cents).
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Starting At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${startingAt.slice(0, 16)}
            onChange=${(e) => setStartingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ending At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${endingAt.slice(0, 16)}
            onChange=${(e) => setEndingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Group By (Optional)</label>
          <div class="space-y-2 text-sm">
            ${['workspace_id', 'description'].map(option => html`
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked=${groupBy.includes(option)}
                  onChange=${() => toggleArrayValue(groupBy, setGroupBy, option)}
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-700">${option}</span>
              </label>
            `)}
          </div>
        </div>

        <${Button}
          onClick=${handleGetReport}
          loading=${costLoading}
          disabled=${!startingAt || !endingAt}
          fullWidth=${true}
        >
          Get Cost Report
        </${Button}>
      </div>
    </div>
  `;
}

function ConfigPanel() {
  const { selectedEndpoint, handleSendRequest, handleCreateBatch, loading, apiKey, history, loadFromHistory, clearHistory, exportHistory, clearConfiguration } = useApp();
  const [showHistory, setShowHistory] = useState(false);

  // Determine which action handler to use
  const handleAction = () => {
    if (selectedEndpoint === 'messages') {
      handleSendRequest();
    } else if (selectedEndpoint === 'batches') {
      handleCreateBatch();
    }
    // Models and Admin don't have a primary action button
  };

  // Determine button text
  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (selectedEndpoint === 'messages') return 'Send Request';
    if (selectedEndpoint === 'batches') return 'Create Batch';
    return 'Execute';
  };

  // Check if action button should be shown
  const showActionButton = selectedEndpoint === 'messages' || selectedEndpoint === 'batches';

  return html`
    <div class="h-full flex flex-col bg-white border-r border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Configuration</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <${ApiKeySection} />

        ${selectedEndpoint === 'messages' && html`
          <div class="border-t pt-4">
            <${Button}
              variant="secondary"
              size="sm"
              onClick=${clearConfiguration}
              fullWidth=${true}
            >
              Clear Configuration
            </${Button}>
          </div>
        `}

        <div class="border-t pt-4">
          ${selectedEndpoint === 'messages' && html`<${MessagesPanel} />`}
          ${selectedEndpoint === 'batches' && html`<${BatchesPanel} />`}
          ${selectedEndpoint === 'models' && html`<${ModelsPanel} />`}
          ${selectedEndpoint === 'usage' && html`<${UsagePanel} />`}
          ${selectedEndpoint === 'cost' && html`<${CostPanel} />`}
        </div>

        ${selectedEndpoint === 'messages' && html`
          <div class="border-t pt-4">
            <button
              onClick=${() => setShowHistory(!showHistory)}
              class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <span>Request History (${history.length})</span>
              <span>${showHistory ? '▼' : '▶'}</span>
            </button>

            ${showHistory && html`
              <div class="mt-4 space-y-2">
                ${history.length === 0 ? html`
                  <p class="text-sm text-gray-500 text-center py-4">No history yet</p>
                ` : html`
                  <div class="flex gap-2 mb-3">
                    <${Button} variant="secondary" size="sm" onClick=${exportHistory} fullWidth=${true}>
                      Export
                    </${Button}>
                    <${Button} variant="danger" size="sm" onClick=${clearHistory} fullWidth=${true}>
                      Clear All
                    </${Button}>
                  </div>

                  <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${history.map((item) => html`
                      <div
                        key=${item.id}
                        onClick=${() => loadFromHistory(item)}
                        class="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div class="flex items-start justify-between mb-1">
                          <span class="text-xs font-medium text-gray-700">${item.model}</span>
                          <span class="text-xs text-gray-500">
                            ${new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p class="text-xs text-gray-600 truncate">${item.prompt}</p>
                        ${item.tokenUsage && html`
                          <p class="text-xs text-gray-500 mt-1">
                            ${item.tokenUsage.input_tokens} in / ${item.tokenUsage.output_tokens} out
                          </p>
                        `}
                      </div>
                    `)}
                  </div>
                `}
              </div>
            `}
          </div>
        `}
      </div>

      ${showActionButton && html`
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <${Button}
            onClick=${handleAction}
            disabled=${loading || !apiKey}
            fullWidth=${true}
            size="lg"
          >
            ${getButtonText()}
          </${Button}>
        </div>
      `}
    </div>
  `;
}

function ResponsePanel() {
  const { response, loading, error, selectedEndpoint, modelsList, batchStatus, usageReport, costReport, toolExecutionStatus, toolExecutionDetails } = useApp();
  const [viewMode, setViewMode] = useState('formatted');

  // Determine if we should show view mode toggle
  const showViewModeToggle = response || modelsList || batchStatus || usageReport || costReport;

  // Determine the response type
  const getResponseType = () => {
    if (selectedEndpoint === 'models' && modelsList) return 'models';
    if (selectedEndpoint === 'batches' && (batchStatus || response?.id)) return 'batch';
    if (selectedEndpoint === 'messages' && response?.content) return 'message';
    if (selectedEndpoint === 'usage' && (usageReport || response?.data)) return 'usage';
    if (selectedEndpoint === 'cost' && (costReport || response?.data)) return 'cost';
    return 'generic';
  };

  const responseType = getResponseType();

  return html`
    <div class="h-full flex flex-col bg-white">
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">Response</h2>

          ${showViewModeToggle && html`
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">View:</span>
              <button
                onClick=${() => setViewMode('formatted')}
                class="px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'formatted' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }"
              >
                Formatted
              </button>
              <button
                onClick=${() => setViewMode('json')}
                class="px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }"
              >
                JSON
              </button>
            </div>
          `}
        </div>

        ${loading && html`
          <div class="flex items-center gap-2 text-blue-600">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span class="text-sm font-medium">
              ${toolExecutionStatus || 'Processing request...'}
            </span>
          </div>
        `}
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        ${error && html`
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-red-800 mb-1">Error</h3>
            <p class="text-sm text-red-700">${error}</p>
          </div>
        `}

        ${!loading && !error && viewMode === 'json' && (response || modelsList || batchStatus || usageReport || costReport) && html`
          <pre class="bg-gray-900 text-green-300 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
            ${JSON.stringify(response || modelsList || batchStatus || usageReport || costReport, null, 2)}
          </pre>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'message' && response && html`
          <div class="space-y-4">
            <div class="bg-gray-50 border border-gray-300 rounded-lg p-6">
              <div class="text-base leading-relaxed text-gray-900 whitespace-pre-wrap font-sans">
                ${extractMessageText(response.content)}
              </div>
            </div>

            ${toolExecutionDetails && toolExecutionDetails.length > 0 && html`
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <span>🔧</span>
                  <span>Tools Executed (${toolExecutionDetails.length})</span>
                </h3>
                <div class="space-y-3">
                  ${toolExecutionDetails.map((tool, idx) => html`
                    <div key=${idx} class="bg-white rounded-lg p-3 border border-purple-100">
                      <div class="font-medium text-purple-900 mb-2">
                        ${tool.tool_name}
                      </div>
                      <div class="space-y-2 text-xs">
                        <div>
                          <div class="text-purple-700 font-medium mb-1">Input:</div>
                          <pre class="bg-purple-50 p-2 rounded text-purple-900 overflow-x-auto">${JSON.stringify(tool.tool_input, null, 2)}</pre>
                        </div>
                        <div>
                          <div class="text-purple-700 font-medium mb-1">Result:</div>
                          <pre class="bg-green-50 p-2 rounded text-green-900 overflow-x-auto">${tool.tool_result}</pre>
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `}

            ${response.usage && html`
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 font-medium">Model:</span>
                  <span class="font-semibold text-gray-900">${response.model}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 font-medium">Input Tokens:</span>
                  <span class="font-semibold text-gray-900">${response.usage.input_tokens}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 font-medium">Output Tokens:</span>
                  <span class="font-semibold text-gray-900">${response.usage.output_tokens}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-700 font-medium">Total Tokens:</span>
                  <span class="font-semibold text-gray-900">
                    ${response.usage.input_tokens + response.usage.output_tokens}
                  </span>
                </div>
                ${response.stop_reason && html`
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-700 font-medium">Stop Reason:</span>
                    <span class="font-semibold text-gray-900">${response.stop_reason}</span>
                  </div>
                `}
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'batch' && (response || batchStatus) && html`
          <div class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-blue-900 mb-3">Batch Information</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-blue-700 font-medium">Batch ID:</span>
                  <span class="font-mono text-blue-900">${(response || batchStatus).id}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-blue-700 font-medium">Status:</span>
                  <span class="font-semibold text-blue-900">${(response || batchStatus).processing_status}</span>
                </div>
                ${(response || batchStatus).request_counts && html`
                  <div class="mt-3 pt-3 border-t border-blue-200">
                    <div class="text-blue-700 font-medium mb-2">Request Counts:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex justify-between">
                        <span class="text-blue-600">Processing:</span>
                        <span class="font-semibold">${(response || batchStatus).request_counts.processing || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-green-600">Succeeded:</span>
                        <span class="font-semibold">${(response || batchStatus).request_counts.succeeded || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-red-600">Errored:</span>
                        <span class="font-semibold">${(response || batchStatus).request_counts.errored || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Canceled:</span>
                        <span class="font-semibold">${(response || batchStatus).request_counts.canceled || 0}</span>
                      </div>
                    </div>
                  </div>
                `}
                ${(response || batchStatus).results_url && html`
                  <div class="mt-3 pt-3 border-t border-blue-200">
                    <div class="text-blue-700 font-medium mb-1">Results URL:</div>
                    <a
                      href=${(response || batchStatus).results_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-blue-600 hover:underline break-all"
                    >
                      ${(response || batchStatus).results_url}
                    </a>
                  </div>
                `}
              </div>
            </div>
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'models' && modelsList && html`
          <div class="space-y-3">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 class="text-sm font-semibold text-blue-900">
                Found ${modelsList.data?.length || 0} models
              </h3>
            </div>
            ${modelsList.data?.map((model) => html`
              <div key=${model.id} class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="font-medium text-base text-gray-900 mb-1">
                  ${model.display_name || model.id}
                </div>
                <div class="text-sm text-gray-600 font-mono mb-2">${model.id}</div>
                <div class="text-xs text-gray-500">
                  Created: ${new Date(model.created_at).toLocaleDateString()}
                </div>
              </div>
            `)}
            ${modelsList.has_more && html`
              <div class="text-sm text-gray-500 text-center py-2">
                More models available (use pagination parameters)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'usage' && (usageReport || response) && html`
          <div class="space-y-3">
            ${((usageReport || response)?.data || []).map((bucket, idx) => html`
              <div key=${idx} class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="font-medium text-base text-gray-900 mb-3">
                  ${new Date(bucket.start_time).toLocaleString()} - ${new Date(bucket.end_time).toLocaleString()}
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="space-y-1">
                    <div class="text-gray-600 text-xs font-medium">Input Tokens</div>
                    <div class="text-lg font-semibold text-gray-900">
                      ${(bucket.input_tokens || 0).toLocaleString()}
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="text-gray-600 text-xs font-medium">Output Tokens</div>
                    <div class="text-lg font-semibold text-gray-900">
                      ${(bucket.output_tokens || 0).toLocaleString()}
                    </div>
                  </div>
                  ${bucket.cache_creation_input_tokens !== undefined && html`
                    <div class="space-y-1">
                      <div class="text-gray-600 text-xs font-medium">Cache Creation</div>
                      <div class="text-base font-semibold text-blue-900">
                        ${(bucket.cache_creation_input_tokens || 0).toLocaleString()}
                      </div>
                    </div>
                  `}
                  ${bucket.cache_read_input_tokens !== undefined && html`
                    <div class="space-y-1">
                      <div class="text-gray-600 text-xs font-medium">Cache Read</div>
                      <div class="text-base font-semibold text-green-900">
                        ${(bucket.cache_read_input_tokens || 0).toLocaleString()}
                      </div>
                    </div>
                  `}
                </div>
                ${bucket.model && html`
                  <div class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                    Model: <span class="font-mono">${bucket.model}</span>
                  </div>
                `}
                ${bucket.workspace_id && html`
                  <div class="mt-1 text-xs text-gray-600">
                    Workspace: <span class="font-mono">${bucket.workspace_id}</span>
                  </div>
                `}
              </div>
            `)}
            ${(usageReport || response)?.has_more && html`
              <div class="text-sm text-gray-500 text-center py-2">
                More data available (use pagination)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'cost' && (costReport || response) && html`
          <div class="space-y-3">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-green-900">Total Cost</span>
                <span class="text-2xl font-bold text-green-900">
                  $${((costReport || response)?.data?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            ${((costReport || response)?.data || []).map((item, idx) => html`
              <div key=${idx} class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    ${item.description && html`
                      <div class="font-medium text-base text-gray-900">${item.description}</div>
                    `}
                    ${item.workspace_id && html`
                      <div class="text-xs text-gray-600 font-mono mt-1">
                        Workspace: ${item.workspace_id}
                      </div>
                    `}
                  </div>
                  <div class="text-right">
                    <div class="text-xl font-bold text-gray-900">
                      $${(parseFloat(item.amount || 0) / 100).toFixed(2)}
                    </div>
                    <div class="text-xs text-gray-500">USD</div>
                  </div>
                </div>
                ${item.start_time && item.end_time && html`
                  <div class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    ${new Date(item.start_time).toLocaleDateString()} - ${new Date(item.end_time).toLocaleDateString()}
                  </div>
                `}
              </div>
            `)}
            ${(costReport || response)?.has_more && html`
              <div class="text-sm text-gray-500 text-center py-2">
                More data available (use pagination)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && !response && !modelsList && !batchStatus && !usageReport && !costReport && html`
          <div class="flex items-center justify-center h-full text-gray-400">
            <div class="text-center">
              <svg
                class="mx-auto h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p class="text-sm">No response yet</p>
              <p class="text-xs mt-1">Configure your request and send</p>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function AppContent() {
  const { selectedEndpoint, setSelectedEndpoint, endpoints } = useApp();

  const endpointTabs = [
    { id: 'messages', label: 'Messages', description: endpoints.messages.description },
    { id: 'batches', label: 'Batches', description: endpoints.batches.description },
    { id: 'models', label: 'Models', description: endpoints.models.description },
    { id: 'usage', label: 'Usage', description: endpoints.usage.description },
    { id: 'cost', label: 'Cost', description: endpoints.cost.description },
  ];

  return html`
    <div class="h-screen flex flex-col bg-gray-100">
      <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div class="px-6 py-4">
          <h1 class="text-2xl font-bold">Claude API Explorer</h1>
          <p class="text-blue-100 text-sm mt-1">
            Test and explore Anthropic's Claude API with an interactive interface
          </p>
        </div>
      </header>

      <div class="bg-white border-b border-gray-200 px-6">
        <div class="flex gap-1">
          ${endpointTabs.map((tab) => html`
            <button
              key=${tab.id}
              onClick=${() => setSelectedEndpoint(tab.id)}
              class="px-4 py-3 text-sm font-medium transition-colors relative ${
                selectedEndpoint === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }"
              title=${tab.description}
            >
              ${tab.label}
            </button>
          `)}
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <div class="w-2/5 min-w-[400px] max-w-[600px]">
          <${ConfigPanel} />
        </div>

        <div class="flex-1">
          <${ResponsePanel} />
        </div>
      </div>

      <footer class="bg-white border-t border-gray-200 px-6 py-3">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div>Built with React, htm, and the Anthropic API</div>
          <div class="flex items-center gap-4">
            <a
              href="https://docs.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-blue-600 transition-colors"
            >
              API Documentation →
            </a>
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-blue-600 transition-colors"
            >
              Console →
            </a>
          </div>
        </div>
      </footer>
    </div>
  `;
}

export default function FullApp() {
  return html`
    <${AppProvider}>
      <${AppContent} />
    </${AppProvider}>
  `;
}
