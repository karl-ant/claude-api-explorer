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
        <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">API Key</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              type=${showKey ? 'text' : 'password'}
              value=${apiKey}
              onInput=${(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 transition-colors hover:border-slate-600"
            />
            <button
              onClick=${() => setShowKey(!showKey)}
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors text-lg"
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
          class="text-xs text-amber-400 hover:text-amber-300 transition-colors font-mono"
        >
          Get API key →
        </a>
      </div>
      ${!persistKey && html`
        <p class="text-xs text-slate-500 font-mono">Key will be cleared when browser closes</p>
      `}
    </div>
  `;
}

function ModelSelector() {
  const { model, setModel, models, maxTokens, setMaxTokens, temperature, setTemperature, topP, setTopP, topK, setTopK } = useApp();

  return html`
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Model</label>
        <select
          value=${model}
          onChange=${(e) => setModel(e.target.value)}
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
        >
          ${models.map((m) => html`
            <option key=${m.id} value=${m.id}>${m.name}</option>
          `)}
        </select>
        <p class="text-xs text-slate-500 mt-2 font-mono">
          ${models.find((m) => m.id === model)?.description}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Max Tokens</label>
          <input
            type="number"
            value=${maxTokens}
            onInput=${(e) => setMaxTokens(parseInt(e.target.value, 10))}
            min="1"
            max="8192"
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Temperature</label>
          <input
            type="number"
            value=${temperature}
            onInput=${(e) => setTemperature(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Top P</label>
          <input
            type="number"
            value=${topP}
            onInput=${(e) => setTopP(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Top K</label>
          <input
            type="number"
            value=${topK}
            onInput=${(e) => setTopK(parseInt(e.target.value, 10))}
            min="0"
            max="500"
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
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
        <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">System Prompt (Optional)</label>
        <textarea
          value=${system}
          onInput=${(e) => setSystem(e.target.value)}
          placeholder="You are a helpful assistant..."
          rows="3"
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm resize-none text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
        ></textarea>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-300 font-mono">Messages</label>
          <${Button} variant="ghost" size="sm" onClick=${addMessage}>+ Add Message</${Button}>
        </div>

        <div class="space-y-3">
          ${messages.map((message, index) => html`
            <div key=${index} class="border border-slate-700 rounded-lg p-3 bg-slate-800/30 backdrop-blur-sm">
              <div class="flex items-center justify-between mb-2">
                <select
                  value=${message.role}
                  onChange=${(e) => updateMessage(index, 'role', e.target.value)}
                  class="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none font-mono text-slate-100 cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>

                ${messages.length > 1 && html`
                  <button
                    onClick=${() => removeMessage(index)}
                    class="text-red-400 hover:text-red-300 text-sm font-mono transition-colors"
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
                class="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-sm resize-none text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
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
            <p class="text-sm text-slate-400 font-mono">Add images to your messages</p>

            <div class="flex flex-wrap gap-2">
              <label class="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange=${handleFileUpload}
                  class="hidden"
                />
                <span class="inline-block px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-sm rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all font-mono font-medium shadow-lg shadow-amber-500/30">
                  Upload File
                </span>
              </label>

              <${Button} variant="secondary" size="sm" onClick=${handleUrlAdd}>
                Add URL
              </${Button}>
            </div>

            ${images.length > 0 && html`
              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-300 font-mono">${images.length} image(s) added</p>
                ${images.map((img, index) => html`
                  <div key=${index} class="flex items-center justify-between p-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <span class="text-sm text-slate-300 truncate font-mono">
                      Image ${index + 1} (${img.source.type})
                    </span>
                    <button
                      onClick=${() => removeImage(index)}
                      class="text-red-400 hover:text-red-300 text-sm font-mono transition-colors"
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
            <p class="text-sm text-slate-400 font-mono">Configure tools for Claude to use. These demonstrate tool calling capabilities but don't actually execute.</p>

            <div class="space-y-3">
              <p class="text-sm font-medium text-slate-300 font-mono">Predefined Tools</p>

              <div class="space-y-2">
                <div class="text-xs font-medium text-slate-500 uppercase font-mono">Data & Information</div>
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
                <div class="text-xs font-medium text-slate-500 uppercase font-mono">Computation</div>
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
                <div class="text-xs font-medium text-slate-500 uppercase font-mono">Actions</div>
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
              <p class="text-sm font-medium text-slate-300 font-mono">Custom Tool (JSON)</p>
              <textarea
                value=${toolJson}
                onInput=${(e) => setToolJson(e.target.value)}
                placeholder='{"name": "my_tool", "description": "...", "input_schema": {...}}'
                rows="4"
                class="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono resize-none text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              ></textarea>
              <${Button} variant="primary" size="sm" onClick=${addToolFromJson}>
                Add Tool
              </${Button}>
            </div>

            ${tools.length > 0 && html`
              <div class="space-y-2 border-t border-slate-700 pt-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-300 font-mono">${tools.length} tool(s) configured</p>
                  <button
                    onClick=${() => setTools([])}
                    class="text-xs text-red-400 hover:text-red-300 font-mono transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  ${tools.map((tool, index) => html`
                    <div key=${index} class="p-3 bg-slate-800/50 border border-slate-700 rounded-lg backdrop-blur-sm">
                      <div class="flex items-start justify-between mb-1">
                        <span class="text-sm text-slate-100 font-medium font-mono">${tool.name}</span>
                        <button
                          onClick=${() => removeTool(index)}
                          class="text-red-400 hover:text-red-300 text-xs ml-2 font-mono transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      ${tool.description && html`
                        <p class="text-xs text-slate-400 font-mono">${tool.description}</p>
                      `}
                      <div class="mt-1 text-xs text-slate-500 font-mono">
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

      <div class="border-t border-slate-800 pt-4">
        <${MessageBuilder} />
      </div>

      <div class="border-t border-slate-800 pt-4">
        <button
          onClick=${() => setShowAdvanced(!showAdvanced)}
          class="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors"
        >
          <span class="font-mono">Advanced Options (Vision & Tools)</span>
          <span class="text-amber-400">${showAdvanced ? '▼' : '▶'}</span>
        </button>

        ${showAdvanced && html`
          <div class="mt-4 animate-slide-up">
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
        <p class="text-sm text-slate-400 mb-4 font-mono">
          List all available Claude models from the Anthropic API
        </p>
        <${Button}
          onClick=${() => handleListModels({ limit: 20 })}
          disabled=${modelsLoading}
          variant="primary"
          loading=${modelsLoading}
        >
          List Models
        </${Button}>
      </div>

      ${modelsList && html`
        <div class="border-t border-slate-800 pt-4">
          <h3 class="text-sm font-medium text-slate-100 mb-3 font-mono">
            Found ${modelsList.data?.length || 0} models
          </h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            ${modelsList.data?.map((model) => html`
              <div key=${model.id} class="p-3 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm hover-lift">
                <div class="font-medium text-sm text-slate-100 font-mono">${model.display_name || model.id}</div>
                <div class="text-xs text-amber-400 font-mono mt-1">${model.id}</div>
                <div class="text-xs text-slate-500 mt-1 font-mono">
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
      <div class="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 backdrop-blur-sm">
        <p class="text-sm text-amber-300 font-mono">
          💡 Message Batches process requests asynchronously at 50% cost
        </p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-slate-300 font-mono">Batch Requests</label>
          <${Button} variant="ghost" size="sm" onClick=${addBatchRequest}>+ Add Request</${Button}>
        </div>

        <div class="space-y-3 max-h-64 overflow-y-auto">
          ${batchRequests.map((req, index) => html`
            <div key=${index} class="border border-slate-700 rounded-lg p-3 space-y-2 bg-slate-800/30 backdrop-blur-sm">
              <div class="flex items-center justify-between">
                <input
                  type="text"
                  value=${req.custom_id}
                  onInput=${(e) => updateBatchRequest(index, 'custom_id', e.target.value)}
                  placeholder="Custom ID (unique identifier)"
                  class="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
                />
                ${batchRequests.length > 1 && html`
                  <button
                    onClick=${() => removeBatchRequest(index)}
                    class="ml-2 text-red-400 hover:text-red-300 text-sm font-mono transition-colors"
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
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm resize-none font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              ></textarea>
            </div>
          `)}
        </div>
      </div>

      <div class="border-t border-slate-800 pt-4">
        <${Button}
          onClick=${handleCreateBatch}
          variant="primary"
          fullWidth=${true}
        >
          Create Batch
        </${Button}>
      </div>

      <div class="border-t border-slate-800 pt-4">
        <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Check Batch Status</label>
        <div class="flex gap-2">
          <input
            type="text"
            value=${batchId}
            onInput=${(e) => setBatchId(e.target.value)}
            placeholder="Batch ID"
            class="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
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
        <div class="border-t border-slate-800 pt-4">
          <div class="p-3 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm">
            <div class="text-sm font-medium text-slate-100 mb-2 font-mono">Batch Status</div>
            <div class="text-xs text-slate-400 space-y-1 font-mono">
              <div>ID: <span class="text-amber-400">${batchStatus.id}</span></div>
              <div>Status: <span class="text-mint-400">${batchStatus.processing_status || 'unknown'}</span></div>
              ${batchStatus.request_counts && html`
                <div class="mt-2 pt-2 border-t border-slate-700">
                  <span class="text-slate-500">Processing:</span> <span class="text-mint-400">${batchStatus.request_counts.processing || 0}</span> |
                  <span class="text-slate-500">Succeeded:</span> <span class="text-mint-400">${batchStatus.request_counts.succeeded || 0}</span> |
                  <span class="text-slate-500">Errored:</span> <span class="text-red-400">${batchStatus.request_counts.errored || 0}</span>
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
      <div class="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 backdrop-blur-sm">
        <p class="text-xs text-amber-400 font-medium mb-1 font-mono">Admin API Key Required</p>
        <p class="text-xs text-amber-300/80 font-mono">
          This endpoint requires an Admin API key (sk-ant-admin...) available only to organization admins.
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Starting At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${startingAt.slice(0, 16)}
            onChange=${(e) => setStartingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Ending At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${endingAt.slice(0, 16)}
            onChange=${(e) => setEndingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Bucket Width</label>
          <select
            value=${bucketWidth}
            onChange=${(e) => setBucketWidth(e.target.value)}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <option value="1m">1 minute (real-time monitoring)</option>
            <option value="1h">1 hour (daily patterns)</option>
            <option value="1d">1 day (weekly/monthly reports)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Group By (Optional)</label>
          <div class="space-y-2 text-sm">
            ${['model', 'workspace_id', 'service_tier', 'api_key_id'].map(option => html`
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked=${groupBy.includes(option)}
                  onChange=${() => toggleArrayValue(groupBy, setGroupBy, option)}
                  class="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <span class="text-slate-300 font-mono group-hover:text-slate-200 transition-colors">${option}</span>
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
      <div class="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 backdrop-blur-sm">
        <p class="text-xs text-amber-400 font-medium mb-1 font-mono">Admin API Key Required</p>
        <p class="text-xs text-amber-300/80 font-mono">
          This endpoint requires an Admin API key (sk-ant-admin...). All costs are in USD (cents).
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Starting At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${startingAt.slice(0, 16)}
            onChange=${(e) => setStartingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Ending At (ISO 8601)</label>
          <input
            type="datetime-local"
            value=${endingAt.slice(0, 16)}
            onChange=${(e) => setEndingAt(e.target.value + ':00Z')}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Group By (Optional)</label>
          <div class="space-y-2 text-sm">
            ${['workspace_id', 'description'].map(option => html`
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked=${groupBy.includes(option)}
                  onChange=${() => toggleArrayValue(groupBy, setGroupBy, option)}
                  class="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <span class="text-slate-300 font-mono group-hover:text-slate-200 transition-colors">${option}</span>
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

function TokenCountCard({ tokenCount, costs, stale, onClear }) {
  return html`
    <div class="bg-slate-800/50 border ${stale ? 'border-amber-700/50' : 'border-mint-700/50'} rounded-lg p-3 backdrop-blur-sm animate-slide-up">
      ${stale && html`
        <div class="flex items-center gap-2 text-xs text-amber-400 font-mono mb-2">
          <span>⚠</span>
          <span>Config changed - recount for accuracy</span>
        </div>
      `}

      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-300 font-mono">Input Tokens</span>
        <span class="text-xl font-bold ${stale ? 'text-slate-400' : 'text-mint-400'} font-mono">
          ${tokenCount.toLocaleString()}
        </span>
      </div>

      ${costs && html`
        <div class="space-y-1 text-xs font-mono border-t border-slate-700 pt-2 mt-2">
          <div class="flex justify-between text-slate-400">
            <span>Est. input cost:</span>
            <span class="text-amber-400">$${costs.inputCost.toFixed(5)}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>+ Max output cost:</span>
            <span>$${costs.maxOutputCost.toFixed(5)}</span>
          </div>
          <div class="flex justify-between text-slate-300 font-medium pt-1 border-t border-slate-700/50">
            <span>Total range:</span>
            <span class="text-amber-400">$${costs.inputCost.toFixed(4)} - $${costs.total.toFixed(4)}</span>
          </div>
          <div class="text-slate-600 text-center pt-1">
            Prices as of Nov 2025
          </div>
        </div>
      `}

      <button
        onClick=${onClear}
        class="mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors font-mono"
      >
        Clear
      </button>
    </div>
  `;
}

function ActualCostCard({ usage, model, models, maxTokens, tokenCount, selectedModel }) {
  const getPricing = (modelId) => {
    const modelConfig = models.find(m => m.id === modelId);
    return modelConfig?.pricing || { input: 3, output: 15 };
  };

  // Actual costs use response model pricing
  const actualPricing = getPricing(model);
  const inputCost = (usage.input_tokens / 1_000_000) * actualPricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * actualPricing.output;
  const totalCost = inputCost + outputCost;
  const totalTokens = usage.input_tokens + usage.output_tokens;

  // Estimated costs use selected model pricing (what user expected before sending)
  const estPricing = getPricing(selectedModel || model);
  const estInputCost = tokenCount ? (tokenCount / 1_000_000) * estPricing.input : inputCost;
  const estOutputCost = (maxTokens / 1_000_000) * estPricing.output;
  const estTotalCost = estInputCost + estOutputCost;

  return html`
    <div class="bg-slate-800/50 border border-mint-700/50 rounded-lg p-3 backdrop-blur-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-300 font-mono">Total Tokens</span>
        <span class="text-xl font-bold text-mint-400 font-mono">
          ${totalTokens.toLocaleString()}
        </span>
      </div>

      <div class="text-xs font-mono border-t border-slate-700 pt-2 mt-2">
        <div class="grid grid-cols-3 gap-2 mb-1">
          <span class="text-slate-500"></span>
          <span class="text-slate-500 text-right">Estimate</span>
          <span class="text-slate-500 text-right">Actual</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-400">
          <span>Input:</span>
          <span class="text-right text-slate-500">$${estInputCost.toFixed(5)}</span>
          <span class="text-right text-mint-400">$${inputCost.toFixed(5)}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-400">
          <span>Output:</span>
          <span class="text-right text-slate-500">$${estOutputCost.toFixed(5)}</span>
          <span class="text-right text-mint-400">$${outputCost.toFixed(5)}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 text-slate-300 font-medium pt-1 border-t border-slate-700/50 mt-1">
          <span>Total:</span>
          <span class="text-right text-slate-400">$${estTotalCost.toFixed(5)}</span>
          <span class="text-right text-amber-400">$${totalCost.toFixed(5)}</span>
        </div>
        <div class="text-slate-600 text-center pt-2">
          Prices as of Nov 2025
        </div>
      </div>
    </div>
  `;
}

function ConfigPanel() {
  const {
    selectedEndpoint, handleSendRequest, handleCreateBatch, loading, apiKey,
    history, loadFromHistory, clearHistory, exportHistory, clearConfiguration,
    handleCountTokens, tokenCount, tokenCountLoading, tokenCountStale, setTokenCount,
    model, maxTokens, models
  } = useApp();
  const [showHistory, setShowHistory] = useState(false);

  // Cost calculation helpers
  const getModelPricing = () => {
    const modelConfig = models.find(m => m.id === model);
    return modelConfig?.pricing || { input: 3, output: 15 }; // Default to Sonnet pricing
  };

  const calculateCosts = () => {
    if (!tokenCount) return null;
    const pricing = getModelPricing();
    const inputCost = (tokenCount / 1_000_000) * pricing.input;
    const maxOutputCost = (maxTokens / 1_000_000) * pricing.output;
    return { inputCost, maxOutputCost, total: inputCost + maxOutputCost };
  };

  // Check if action button should be shown
  const showActionButton = selectedEndpoint === 'messages' || selectedEndpoint === 'batches';

  return html`
    <div class="h-full flex flex-col bg-slate-900">
      <div class="p-4 border-b border-slate-800">
        <h2 class="text-lg font-semibold text-slate-100 font-mono tracking-wide flex items-center gap-2">
          <span class="text-amber-400">▸</span> Configuration
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <${ApiKeySection} />

        ${selectedEndpoint === 'messages' && html`
          <div class="border-t border-slate-800 pt-4">
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

        <div class="border-t border-slate-800 pt-4">
          ${selectedEndpoint === 'messages' && html`<${MessagesPanel} />`}
          ${selectedEndpoint === 'batches' && html`<${BatchesPanel} />`}
          ${selectedEndpoint === 'models' && html`<${ModelsPanel} />`}
          ${selectedEndpoint === 'usage' && html`<${UsagePanel} />`}
          ${selectedEndpoint === 'cost' && html`<${CostPanel} />`}
        </div>

        ${selectedEndpoint === 'messages' && html`
          <div class="border-t border-slate-800 pt-4">
            <button
              onClick=${() => setShowHistory(!showHistory)}
              class="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors"
            >
              <span class="font-mono">Request History (${history.length})</span>
              <span class="text-amber-400">${showHistory ? '▼' : '▶'}</span>
            </button>

            ${showHistory && html`
              <div class="mt-4 space-y-2 animate-slide-up">
                ${history.length === 0 ? html`
                  <p class="text-sm text-slate-500 text-center py-4 font-mono">No history yet</p>
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
                        class="p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 hover:border-amber-500/50 transition-all hover-lift"
                      >
                        <div class="flex items-start justify-between mb-1">
                          <span class="text-xs font-medium text-amber-400 font-mono">${item.model}</span>
                          <span class="text-xs text-slate-500 font-mono">
                            ${new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p class="text-xs text-slate-300 truncate font-mono">${item.prompt}</p>
                        ${item.tokenUsage && html`
                          <p class="text-xs text-slate-500 mt-1 font-mono">
                            <span class="text-mint-400">${item.tokenUsage.input_tokens}</span> in /
                            <span class="text-mint-400">${item.tokenUsage.output_tokens}</span> out
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
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          ${selectedEndpoint === 'messages' && html`
            <div class="flex gap-2">
              <${Button}
                onClick=${handleSendRequest}
                disabled=${loading || !apiKey}
                fullWidth=${true}
                size="lg"
              >
                ${loading ? 'Processing...' : 'Send Request'}
              </${Button}>
              <${Button}
                onClick=${handleCountTokens}
                disabled=${tokenCountLoading || loading || !apiKey}
                variant="secondary"
                size="lg"
                loading=${tokenCountLoading}
              >
                ${tokenCountStale ? 'Recount' : 'Count'}
              </${Button}>
            </div>

            ${tokenCount !== null && html`
              <${TokenCountCard}
                tokenCount=${tokenCount}
                costs=${calculateCosts()}
                stale=${tokenCountStale}
                onClear=${() => setTokenCount(null)}
              />
            `}
          `}
          ${selectedEndpoint === 'batches' && html`
            <${Button}
              onClick=${handleCreateBatch}
              disabled=${loading || !apiKey}
              fullWidth=${true}
              size="lg"
            >
              ${loading ? 'Processing...' : 'Create Batch'}
            </${Button}>
          `}
        </div>
      `}
    </div>
  `;
}

function ResponsePanel() {
  const { response, loading, error, selectedEndpoint, modelsList, batchStatus, usageReport, costReport, toolExecutionStatus, toolExecutionDetails, models, maxTokens, tokenCount, model } = useApp();
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
    <div class="h-full flex flex-col bg-slate-900">
      <div class="p-4 border-b border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <span class="text-mint-400">▸</span> Response
          </h2>

          ${showViewModeToggle && html`
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-400 font-mono">View:</span>
              <button
                onClick=${() => setViewMode('formatted')}
                class="px-3 py-1.5 text-sm font-medium rounded-lg font-mono transition-all ${
                  viewMode === 'formatted'
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }"
              >
                Formatted
              </button>
              <button
                onClick=${() => setViewMode('json')}
                class="px-3 py-1.5 text-sm font-medium rounded-lg font-mono transition-all ${
                  viewMode === 'json'
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }"
              >
                JSON
              </button>
            </div>
          `}
        </div>

        ${loading && html`
          <div class="flex items-center gap-3 text-mint-400 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
            <div class="rounded-full h-5 w-5 spinner-glow"></div>
            <span class="text-sm font-medium font-mono terminal-glow">
              ${toolExecutionStatus || 'Processing request...'}
            </span>
          </div>
        `}
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        ${error && html`
          <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-4 backdrop-blur-sm animate-slide-up">
            <h3 class="text-sm font-semibold text-red-400 mb-2 font-mono flex items-center gap-2">
              <span>⚠</span> Error
            </h3>
            <p class="text-sm text-red-300 font-mono">${error}</p>
          </div>
        `}

        ${!loading && !error && viewMode === 'json' && (response || modelsList || batchStatus || usageReport || costReport) && html`
          <pre class="bg-slate-950 text-mint-300 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800 shadow-xl terminal-glow animate-fade-in">
            ${JSON.stringify(response || modelsList || batchStatus || usageReport || costReport, null, 2)}
          </pre>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'message' && response && html`
          <div class="space-y-4 animate-slide-up">
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm hover-lift">
              <div class="text-base leading-relaxed text-slate-100 whitespace-pre-wrap">
                ${extractMessageText(response.content)}
              </div>
            </div>

            ${toolExecutionDetails && toolExecutionDetails.length > 0 && html`
              <div class="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 backdrop-blur-sm">
                <h3 class="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2 font-mono">
                  <span>🔧</span>
                  <span>Tools Executed (${toolExecutionDetails.length})</span>
                </h3>
                <div class="space-y-3">
                  ${toolExecutionDetails.map((tool, idx) => html`
                    <div key=${idx} class="bg-slate-800/50 rounded-lg p-3 border border-purple-700/30">
                      <div class="font-medium text-purple-300 mb-2 font-mono">
                        ${tool.tool_name}
                      </div>
                      <div class="space-y-2 text-xs">
                        <div>
                          <div class="text-purple-400 font-medium mb-1 font-mono">Input:</div>
                          <pre class="bg-slate-950 p-2 rounded text-purple-200 overflow-x-auto font-mono border border-slate-700">${JSON.stringify(tool.tool_input, null, 2)}</pre>
                        </div>
                        <div>
                          <div class="text-mint-400 font-medium mb-1 font-mono">Result:</div>
                          <pre class="bg-slate-950 p-2 rounded text-mint-200 overflow-x-auto font-mono border border-slate-700">${tool.tool_result}</pre>
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `}

            ${response.usage && html`
              <div class="space-y-3">
                <div class="flex items-center justify-between text-sm bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <span class="text-slate-400 font-medium font-mono">Model:</span>
                  <span class="font-semibold text-amber-400 font-mono">${response.model}</span>
                </div>
                <${ActualCostCard}
                  usage=${response.usage}
                  model=${response.model}
                  models=${models}
                  maxTokens=${maxTokens}
                  tokenCount=${tokenCount}
                  selectedModel=${model}
                />
                ${response.stop_reason && html`
                  <div class="flex items-center justify-between text-sm bg-slate-800/30 border border-slate-700 rounded-lg px-4 py-2 backdrop-blur-sm">
                    <span class="text-slate-400 font-medium font-mono">Stop Reason:</span>
                    <span class="font-semibold text-slate-300 font-mono">${response.stop_reason}</span>
                  </div>
                `}
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'batch' && (response || batchStatus) && html`
          <div class="space-y-4 animate-slide-up">
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
              <h3 class="text-sm font-semibold text-slate-100 mb-3 font-mono">Batch Information</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-400 font-medium font-mono">Batch ID:</span>
                  <span class="font-mono text-amber-400">${(response || batchStatus).id}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400 font-medium font-mono">Status:</span>
                  <span class="font-semibold text-mint-400 font-mono">${(response || batchStatus).processing_status}</span>
                </div>
                ${(response || batchStatus).request_counts && html`
                  <div class="mt-3 pt-3 border-t border-slate-700">
                    <div class="text-slate-300 font-medium mb-2 font-mono">Request Counts:</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex justify-between">
                        <span class="text-slate-500 font-mono">Processing:</span>
                        <span class="font-semibold text-slate-300 font-mono">${(response || batchStatus).request_counts.processing || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500 font-mono">Succeeded:</span>
                        <span class="font-semibold text-mint-400 font-mono">${(response || batchStatus).request_counts.succeeded || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500 font-mono">Errored:</span>
                        <span class="font-semibold text-red-400 font-mono">${(response || batchStatus).request_counts.errored || 0}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500 font-mono">Canceled:</span>
                        <span class="font-semibold text-slate-400 font-mono">${(response || batchStatus).request_counts.canceled || 0}</span>
                      </div>
                    </div>
                  </div>
                `}
                ${(response || batchStatus).results_url && html`
                  <div class="mt-3 pt-3 border-t border-slate-700">
                    <div class="text-slate-300 font-medium mb-1 font-mono">Results URL:</div>
                    <a
                      href=${(response || batchStatus).results_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-amber-400 hover:text-amber-300 break-all font-mono transition-colors"
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
          <div class="space-y-3 animate-slide-up">
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
              <h3 class="text-sm font-semibold text-slate-100 font-mono">
                Found ${modelsList.data?.length || 0} models
              </h3>
            </div>
            ${modelsList.data?.map((model) => html`
              <div key=${model.id} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
                <div class="font-medium text-base text-slate-100 mb-1 font-mono">
                  ${model.display_name || model.id}
                </div>
                <div class="text-sm text-amber-400 font-mono mb-2">${model.id}</div>
                <div class="text-xs text-slate-500 font-mono">
                  Created: ${new Date(model.created_at).toLocaleDateString()}
                </div>
              </div>
            `)}
            ${modelsList.has_more && html`
              <div class="text-sm text-slate-500 text-center py-2 font-mono">
                More models available (use pagination parameters)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'usage' && (usageReport || response) && html`
          <div class="space-y-3 animate-slide-up">
            ${((usageReport || response)?.data || []).map((bucket, idx) => html`
              <div key=${idx} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
                <div class="font-medium text-base text-slate-100 mb-3 font-mono">
                  ${new Date(bucket.start_time).toLocaleString()} - ${new Date(bucket.end_time).toLocaleString()}
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="space-y-1">
                    <div class="text-slate-400 text-xs font-medium font-mono">Input Tokens</div>
                    <div class="text-lg font-semibold text-mint-400 font-mono">
                      ${(bucket.input_tokens || 0).toLocaleString()}
                    </div>
                  </div>
                  <div class="space-y-1">
                    <div class="text-slate-400 text-xs font-medium font-mono">Output Tokens</div>
                    <div class="text-lg font-semibold text-mint-400 font-mono">
                      ${(bucket.output_tokens || 0).toLocaleString()}
                    </div>
                  </div>
                  ${bucket.cache_creation_input_tokens !== undefined && html`
                    <div class="space-y-1">
                      <div class="text-slate-400 text-xs font-medium font-mono">Cache Creation</div>
                      <div class="text-base font-semibold text-amber-400 font-mono">
                        ${(bucket.cache_creation_input_tokens || 0).toLocaleString()}
                      </div>
                    </div>
                  `}
                  ${bucket.cache_read_input_tokens !== undefined && html`
                    <div class="space-y-1">
                      <div class="text-slate-400 text-xs font-medium font-mono">Cache Read</div>
                      <div class="text-base font-semibold text-mint-300 font-mono">
                        ${(bucket.cache_read_input_tokens || 0).toLocaleString()}
                      </div>
                    </div>
                  `}
                </div>
                ${bucket.model && html`
                  <div class="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400 font-mono">
                    Model: <span class="text-amber-400">${bucket.model}</span>
                  </div>
                `}
                ${bucket.workspace_id && html`
                  <div class="mt-1 text-xs text-slate-400 font-mono">
                    Workspace: <span class="text-amber-400">${bucket.workspace_id}</span>
                  </div>
                `}
              </div>
            `)}
            ${(usageReport || response)?.has_more && html`
              <div class="text-sm text-slate-500 text-center py-2 font-mono">
                More data available (use pagination)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'cost' && (costReport || response) && html`
          <div class="space-y-3 animate-slide-up">
            <div class="bg-mint-900/20 border border-mint-700/50 rounded-lg p-4 mb-4 backdrop-blur-sm">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-mint-300 font-mono">Total Cost</span>
                <span class="text-2xl font-bold text-mint-400 font-mono">
                  $${((costReport || response)?.data?.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            ${((costReport || response)?.data || []).map((item, idx) => html`
              <div key=${idx} class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm hover-lift">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    ${item.description && html`
                      <div class="font-medium text-base text-slate-100 font-mono">${item.description}</div>
                    `}
                    ${item.workspace_id && html`
                      <div class="text-xs text-slate-400 font-mono mt-1">
                        Workspace: <span class="text-amber-400">${item.workspace_id}</span>
                      </div>
                    `}
                  </div>
                  <div class="text-right">
                    <div class="text-xl font-bold text-mint-400 font-mono">
                      $${(parseFloat(item.amount || 0) / 100).toFixed(2)}
                    </div>
                    <div class="text-xs text-slate-500 font-mono">USD</div>
                  </div>
                </div>
                ${item.start_time && item.end_time && html`
                  <div class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700 font-mono">
                    ${new Date(item.start_time).toLocaleDateString()} - ${new Date(item.end_time).toLocaleDateString()}
                  </div>
                `}
              </div>
            `)}
            ${(costReport || response)?.has_more && html`
              <div class="text-sm text-slate-500 text-center py-2 font-mono">
                More data available (use pagination)
              </div>
            `}
          </div>
        `}

        ${!loading && !error && !response && !modelsList && !batchStatus && !usageReport && !costReport && html`
          <div class="flex items-center justify-center h-full text-slate-500">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700">
                <svg
                  class="h-8 w-8 text-slate-600"
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
              </div>
              <p class="text-sm font-mono text-slate-400">No response yet</p>
              <p class="text-xs mt-1 font-mono text-slate-600">Configure your request and send</p>
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
    <div class="h-screen flex flex-col bg-slate-950 gradient-mesh">
      <header class="bg-slate-900 border-b border-slate-800 shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-mint-500/10"></div>
        <div class="relative px-6 py-5">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <span class="text-slate-900 font-bold text-lg font-mono">C</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-100 tracking-tight">Claude API Explorer</h1>
              <p class="text-slate-400 text-xs font-mono mt-0.5">
                <span class="text-amber-400">v2.1</span> • Developer Command Center
              </p>
            </div>
          </div>
        </div>
      </header>

      <div class="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6">
        <div class="flex gap-2">
          ${endpointTabs.map((tab) => html`
            <button
              key=${tab.id}
              onClick=${() => setSelectedEndpoint(tab.id)}
              class="px-5 py-3 text-sm font-medium transition-all duration-200 relative group ${
                selectedEndpoint === tab.id
                  ? 'text-amber-400 tab-indicator'
                  : 'text-slate-400 hover:text-slate-200'
              }"
              title=${tab.description}
            >
              <span class="relative z-10">${tab.label}</span>
              ${selectedEndpoint !== tab.id && html`
                <span class="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/50 rounded-t-lg transition-colors"></span>
              `}
            </button>
          `)}
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <div class="w-2/5 min-w-[400px] max-w-[600px] border-r border-slate-800">
          <${ConfigPanel} />
        </div>

        <div class="flex-1">
          <${ResponsePanel} />
        </div>
      </div>

      <footer class="bg-slate-900 border-t border-slate-800 px-6 py-3">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-mint-500 rounded-full status-dot"></span>
            <span class="font-mono">Built with React, htm & Anthropic API</span>
          </div>
          <div class="flex items-center gap-4">
            <a
              href="https://docs.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-amber-400 transition-colors font-mono"
            >
              Docs →
            </a>
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-amber-400 transition-colors font-mono"
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
