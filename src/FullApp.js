import React, { useState } from 'react';
import htm from 'htm';
import { AppProvider, useApp } from './context/AppContext.js';
import { Button } from './components/common/Button.js';
import { Toggle } from './components/common/Toggle.js';
import { Tabs } from './components/common/Tabs.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { fileToBase64, getImageMediaType, extractMessageText } from './utils/formatters.js';
import { TOOL_MODES } from './config/toolConfig.js';
import {
  MessageResponseView,
  BatchResponseView,
  ModelsResponseView,
  UsageResponseView,
  CostResponseView,
  SkillsResponseView,
  EmptyResponseState,
  ActualCostCard
} from './components/responses/index.js';

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

function BetaHeadersSection() {
  const { betaHeaders, setBetaHeaders } = useApp();

  const BETA_HEADER_OPTIONS = [
    { id: 'skills-2025-10-02', label: 'Skills' },
    { id: 'code-execution-2025-08-25', label: 'Code Exec' },
    { id: 'files-api-2025-04-14', label: 'Files API' },
    { id: 'computer-use-2025-11-24', label: 'Computer Use (4.5+)' },
    { id: 'computer-use-2025-01-24', label: 'Computer Use (Legacy)' },
    { id: 'compact-2026-01-12', label: 'Compaction' },
    { id: 'context-1m-2025-08-07', label: '1M Context' },
    { id: 'context-management-2025-06-27', label: 'Context Mgmt' },
    { id: 'interleaved-thinking-2025-05-14', label: 'Interleaved Think' },
  ];

  const toggleBetaHeader = (headerId) => {
    setBetaHeaders(prev =>
      prev.includes(headerId)
        ? prev.filter(h => h !== headerId)
        : [...prev, headerId]
    );
  };

  return html`
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium text-slate-300 font-mono">Beta Headers</label>
        <span class="text-xs text-slate-500 font-mono">anthropic-beta</span>
      </div>
      <div class="flex flex-wrap gap-2">
        ${BETA_HEADER_OPTIONS.map(header => html`
          <button
            key=${header.id}
            onClick=${() => toggleBetaHeader(header.id)}
            class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors
                   ${betaHeaders.includes(header.id)
                     ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                     : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                   }"
          >
            ${header.label}
          </button>
        `)}
      </div>
      ${betaHeaders.length > 0 && html`
        <p class="text-xs text-slate-500 font-mono break-all">
          → ${betaHeaders.join(',')}
        </p>
      `}
    </div>
  `;
}

function ModelSelector() {
  const { model, setModel, models: staticModels, modelsList, modelsLoading, maxTokens, setMaxTokens, temperature, setTemperature, topP, setTopP, topK, setTopK } = useApp();

  // Get maxOutput from static model config for dynamic max tokens validation
  const getMaxOutput = (modelId) => {
    const staticMatch = staticModels.find(s => s.id === modelId);
    return staticMatch?.maxOutput || 8192;
  };

  // Use API models if available, merge with static config for pricing/description
  // Always use model ID as name to distinguish between variants (e.g., multiple "Claude Haiku 4.5")
  const availableModels = React.useMemo(() => {
    return modelsList?.data
      ? modelsList.data.map(apiModel => {
          const staticMatch = staticModels.find(s => s.id === apiModel.id);
          return {
            id: apiModel.id,
            name: apiModel.id,
            description: staticMatch?.description || apiModel.display_name || '',
            pricing: staticMatch?.pricing
          };
        })
      : staticModels;
  }, [modelsList, staticModels]);

  // Ensure selected model exists in available models - sync state if not
  React.useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find(m => m.id === model)) {
      setModel(availableModels[0].id);
    }
  }, [availableModels, model, setModel]);

  const selectedModel = availableModels.find((m) => m.id === model);

  return html`
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">
          Model ${modelsLoading ? html`<span class="text-amber-400 text-xs">(loading...)</span>` : modelsList?.data ? html`<span class="text-mint-400 text-xs">(${availableModels.length} available)</span>` : ''}
        </label>
        <select
          value=${model}
          onChange=${(e) => setModel(e.target.value)}
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
        >
          ${availableModels.map((m) => html`
            <option key=${m.id} value=${m.id}>${m.name}</option>
          `)}
        </select>
        <p class="text-xs text-slate-500 mt-2 font-mono">
          ${selectedModel?.description || ''}
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
            max=${getMaxOutput(model)}
            class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors"
          />
          <span class="text-xs text-slate-500 font-mono mt-1">Max: ${getMaxOutput(model).toLocaleString()}</span>
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
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm resize-none text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors font-mono"
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
                class="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-sm resize-none text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors font-mono"
              ></textarea>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

function AdvancedOptions() {
  const { tools, setTools, images, setImages, skillsJson, setSkillsJson, toolMode, setToolMode } = useApp();
  const [activeTab, setActiveTab] = useState('vision');
  const [toolJson, setToolJson] = useState('');

  // Add a pre-built skill
  const addSkill = (skillId) => {
    try {
      const current = skillsJson.trim() ? JSON.parse(skillsJson) : [];
      if (!current.find(s => s.skill_id === skillId)) {
        current.push({ type: 'anthropic', skill_id: skillId, version: 'latest' });
        setSkillsJson(JSON.stringify(current, null, 2));
      }
    } catch (e) {
      setSkillsJson(JSON.stringify([{ type: 'anthropic', skill_id: skillId, version: 'latest' }], null, 2));
    }
  };

  const tabs = [
    { id: 'vision', label: 'Vision' },
    { id: 'tools', label: 'Tools' },
    { id: 'skills', label: 'Skills' },
    { id: 'output', label: 'Output' },
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
        description: 'Search for instant answers - definitions, facts, Wikipedia summaries (DuckDuckGo)',
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
      json_validator: {
        name: 'json_validator',
        description: 'Validate and format JSON strings. Returns formatted JSON or validation errors.',
        input_schema: {
          type: 'object',
          properties: {
            json_string: {
              type: 'string',
              description: 'The JSON string to validate'
            }
          },
          required: ['json_string']
        }
      },
      code_formatter: {
        name: 'code_formatter',
        description: 'Format code in various languages (JavaScript, Python, JSON).',
        input_schema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to format'
            },
            language: {
              type: 'string',
              enum: ['javascript', 'python', 'json'],
              description: 'Programming language'
            }
          },
          required: ['code', 'language']
        }
      },
      token_counter: {
        name: 'token_counter',
        description: 'Estimate the number of Claude tokens in text.',
        input_schema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to count tokens for'
            }
          },
          required: ['text']
        }
      },
      regex_tester: {
        name: 'regex_tester',
        description: 'Test a regular expression against text and return matches.',
        input_schema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'The regex pattern'
            },
            text: {
              type: 'string',
              description: 'The text to test against'
            },
            flags: {
              type: 'string',
              description: 'Regex flags (g, i, m, etc.)'
            }
          },
          required: ['pattern', 'text']
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
                  <div key=${index} class="flex items-center gap-3 p-2 bg-slate-800/50 border border-slate-700 rounded-lg">
                    ${img.source.type === 'base64' && html`
                      <img
                        src="data:${img.source.media_type};base64,${img.source.data}"
                        class="w-16 h-16 object-cover rounded border border-slate-700 flex-shrink-0"
                      />
                    `}
                    ${img.source.type === 'url' && html`
                      <img
                        src=${img.source.url}
                        class="w-16 h-16 object-cover rounded border border-slate-700 flex-shrink-0"
                      />
                    `}
                    <span class="text-sm text-slate-300 truncate font-mono flex-1">
                      Image ${index + 1} (${img.source.type})
                    </span>
                    <button
                      onClick=${() => removeImage(index)}
                      class="text-red-400 hover:text-red-300 text-sm font-mono transition-colors flex-shrink-0"
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
            <p class="text-sm text-slate-400 font-mono">Configure tools for Claude to use.</p>

            <!-- Tool Mode Toggle -->
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-300 font-mono">Tool Execution Mode</label>
                <div class="flex gap-2">
                  <button
                    onClick=${() => setToolMode(TOOL_MODES.DEMO)}
                    class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                      toolMode === TOOL_MODES.DEMO
                        ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }"
                  >
                    🎭 Demo Mode
                  </button>
                  <button
                    onClick=${() => setToolMode(TOOL_MODES.REAL)}
                    class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                      toolMode === TOOL_MODES.REAL
                        ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }"
                  >
                    🚀 Real Mode
                  </button>
                </div>
              </div>
              <p class="text-xs text-slate-500 font-mono">
                ${toolMode === TOOL_MODES.DEMO
                  ? '→ Tools return mock data for testing'
                  : '→ Tools use free APIs (no signup required - Open-Meteo, DuckDuckGo)'}
              </p>
            </div>

            <!-- Server-Side Tools (Anthropic) -->
            <div class="space-y-3">
              <p class="text-sm font-medium text-slate-300 font-mono">Server-Side Tools (Anthropic)</p>
              <p class="text-xs text-slate-500 font-mono">Managed by Anthropic — executed server-side, no client setup needed.</p>
              <div class="grid grid-cols-2 gap-2">
                ${[
                  { type: 'web_search_20250305', name: 'web_search', label: 'Web Search', desc: '$10/1K searches' },
                  { type: 'web_fetch_20250305', name: 'web_fetch', label: 'Web Fetch', desc: 'Token cost only' },
                  { type: 'code_execution_20250825', name: 'code_execution', label: 'Code Exec', desc: 'Sandboxed bash' },
                  { type: 'computer_20250124', name: 'computer', label: 'Computer Use', desc: 'Screen interaction' },
                  { type: 'text_editor_20250429', name: 'text_editor', label: 'Text Editor', desc: 'File editing' },
                ].map(st => {
                  const isEnabled = tools.some(t => t.type === st.type);
                  return html`
                    <button
                      key=${st.type}
                      onClick=${() => {
                        if (isEnabled) {
                          setTools(prev => prev.filter(t => t.type !== st.type));
                        } else {
                          setTools(prev => [...prev, { type: st.type, name: st.name }]);
                        }
                      }}
                      class="px-3 py-2 text-xs font-mono rounded-lg transition-colors text-left ${
                        isEnabled
                          ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                      }"
                    >
                      <div class="font-medium">${st.label}</div>
                      <div class="text-xs ${isEnabled ? 'text-slate-700' : 'text-slate-500'}">${st.desc}</div>
                    </button>
                  `;
                })}
              </div>
            </div>

            <div class="border-t border-slate-700 pt-3"></div>

            <div class="space-y-3">
              <p class="text-sm font-medium text-slate-300 font-mono">Client-Side Tools</p>

              <div class="space-y-2">
                <div class="text-xs font-medium text-slate-500 uppercase font-mono">Data & Information</div>
                <div class="grid grid-cols-2 gap-2">
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('get_weather')}>
                    🌤️ Weather
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
                </div>
              </div>

              <div class="space-y-2">
                <div class="text-xs font-medium text-slate-500 uppercase font-mono">Developer</div>
                <div class="grid grid-cols-2 gap-2">
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('json_validator')}>
                    ✅ JSON Validator
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('code_formatter')}>
                    📝 Code Formatter
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('token_counter')}>
                    🔢 Token Counter
                  </${Button}>
                  <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('regex_tester')}>
                    🔍 Regex Tester
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

        ${activeTab === 'skills' && html`
          <div class="space-y-3">
            <p class="text-sm text-slate-400 font-mono">Configure skills for document processing. Requires beta headers: Skills, Code Exec, and Files API.</p>

            <div class="space-y-2">
              <p class="text-xs text-slate-400 font-mono">Pre-built Anthropic Skills:</p>
              <div class="flex flex-wrap gap-2">
                ${['xlsx', 'pdf', 'docx', 'pptx'].map(skill => html`
                  <${Button} key=${skill} size="sm" variant="ghost" onClick=${() => addSkill(skill)}>
                    ${skill.toUpperCase()}
                  </${Button}>
                `)}
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-300 font-mono">Skills JSON</p>
              <textarea
                value=${skillsJson}
                onInput=${(e) => setSkillsJson(e.target.value)}
                placeholder='[{"type":"anthropic","skill_id":"xlsx","version":"latest"}]'
                rows="4"
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors resize-y"
              ></textarea>
            </div>

            ${skillsJson.trim() && html`
              <div class="flex items-center justify-between pt-2">
                <p class="text-xs text-slate-500 font-mono">Skills will be added to container.skills</p>
                <${Button} size="sm" variant="danger" onClick=${() => setSkillsJson('')}>
                  Clear Skills
                </${Button}>
              </div>
            `}
          </div>
        `}

        ${activeTab === 'output' && html`
          <div class="space-y-3">
            <p class="text-sm text-slate-400 font-mono">Configure output format constraints.</p>
            <${StructuredOutputSection} />
          </div>
        `}
      </div>
    </div>
  `;
}

function ConversationModeToggle() {
  const {
    conversationMode,
    setConversationMode,
    conversationHistory,
    setConversationHistory,
    setMessages,
    messages,
    response
  } = useApp();

  // Only show toggle after first successful response
  if (!response && !conversationMode) {
    return null;
  }

  const handleToggle = (enabled) => {
    setConversationMode(enabled);
    if (enabled) {
      // Switching to conversation mode: build conversation history from existing exchange
      const history = [];

      // Add existing messages to history
      messages.forEach(msg => {
        if (msg.content && (typeof msg.content === 'string' ? msg.content.trim() : true)) {
          history.push({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : msg.content,
            timestamp: Date.now(),
            id: `msg-${Date.now()}-${Math.random()}`
          });
        }
      });

      // Add the response to history (only if it has content)
      if (response?.content) {
        const textContent = extractMessageText(response.content);
        if (textContent && textContent.trim()) {
          history.push({
            role: 'assistant',
            content: response.content,
            timestamp: Date.now(),
            id: `msg-${Date.now()}-resp`
          });

          // Also add response to messages array for next API call
          setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
        }
      }

      setConversationHistory(history);
    } else {
      // Switching back to single-turn: clear conversation history
      setConversationHistory([]);
      setMessages([{ role: 'user', content: '' }]);
    }
  };

  return html`
    <div class="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-300 font-mono">Conversation Mode</span>
        ${conversationMode && conversationHistory.length > 0 && html`
          <span class="text-xs text-mint-400 font-mono">(${conversationHistory.length} messages)</span>
        `}
      </div>
      <${Toggle}
        checked=${conversationMode}
        onChange=${handleToggle}
      />
    </div>
  `;
}

function ChatInterface() {
  const {
    conversationHistory,
    setConversationHistory,
    messages,
    setMessages,
    handleSendRequest,
    loading
  } = useApp();
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim() || loading) return;

    // Build updated conversation history synchronously
    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
      id: `msg-${Date.now()}`
    };
    const updatedHistory = [...conversationHistory, userMessage];

    // Update state (for UI display)
    setConversationHistory(updatedHistory);

    // Update messages for API call (not used in conversation mode, but keep for consistency)
    setMessages(prev => {
      const withoutEmpty = prev.filter(m => {
        if (typeof m.content === 'string') {
          return m.content.trim() !== '';
        } else if (Array.isArray(m.content)) {
          return m.content.length > 0;
        }
        return true;
      });
      return [...withoutEmpty, { role: 'user', content: inputValue }];
    });

    setInputValue('');

    // Pass updated history directly to avoid state timing issues
    handleSendRequest(updatedHistory);
  };

  return html`
    <div class="space-y-4">
      <!-- Chat Thread -->
      ${conversationHistory.length > 0 && html`
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${conversationHistory
            .filter(msg => {
              // Filter out tool_result messages (they're API plumbing, not user-visible)
              if (msg.role === 'user' && Array.isArray(msg.content) && msg.content.length > 0 && msg.content[0].type === 'tool_result') {
                return false;
              }
              return true;
            })
            .map((msg) => html`
            <div key=${msg.id} class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
              <div class="${msg.role === 'user'
                ? 'bg-amber-500/20 border-amber-500/50'
                : 'bg-slate-800/50 border-slate-700'
              } border rounded-lg p-3 max-w-[85%]">
                <div class="text-xs text-slate-400 font-mono mb-1">
                  ${msg.role === 'user' ? 'You' : 'Claude'}
                </div>
                <div class="text-sm text-slate-100 whitespace-pre-wrap font-mono">
                  ${typeof msg.content === 'string' ? msg.content : extractMessageText(msg.content)}
                </div>
              </div>
            </div>
          `)}
        </div>
      `}

      <!-- Input Area -->
      <div class="flex gap-2">
        <textarea
          value=${inputValue}
          onInput=${(e) => setInputValue(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          rows="3"
          disabled=${loading}
          class="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors resize-none font-mono ${loading ? 'opacity-50 cursor-not-allowed' : ''}"
        ></textarea>
        <${Button}
          onClick=${handleSend}
          disabled=${loading || !inputValue.trim()}
          variant="primary"
          loading=${loading}
        >
          Send
        </${Button}>
      </div>

      <!-- Clear Conversation -->
      ${conversationHistory.length > 0 && html`
        <div class="flex justify-end">
          <${Button}
            variant="ghost"
            size="sm"
            onClick=${() => {
              setConversationHistory([]);
              setMessages([{ role: 'user', content: '' }]);
            }}
          >
            Clear Conversation
          </${Button}>
        </div>
      `}
    </div>
  `;
}

function ThinkingSection() {
  const { thinkingEnabled, setThinkingEnabled, thinkingType, setThinkingType, budgetTokens, setBudgetTokens, effortLevel, setEffortLevel, model } = useApp();

  const isOpus46 = model === 'claude-opus-4-6';

  return html`
    <div class="space-y-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-300 font-mono">Extended Thinking</span>
        <${Toggle}
          checked=${thinkingEnabled}
          onChange=${setThinkingEnabled}
        />
      </div>

      ${thinkingEnabled && html`
        <div class="space-y-3 animate-slide-up">
          <div class="flex gap-2">
            <button
              onClick=${() => setThinkingType('adaptive')}
              class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                thinkingType === 'adaptive'
                  ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
              }"
            >
              Adaptive (auto)
            </button>
            <button
              onClick=${() => setThinkingType('enabled')}
              class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                thinkingType === 'enabled'
                  ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
              }"
            >
              Manual budget
            </button>
          </div>

          ${thinkingType === 'adaptive' && html`
            <div class="space-y-2">
              <label class="text-xs text-slate-400 font-mono">Effort Level</label>
              <div class="flex gap-2">
                ${['low', 'medium', 'high', 'max'].map(level => html`
                  <button
                    key=${level}
                    onClick=${() => setEffortLevel(level)}
                    class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                      effortLevel === level
                        ? 'bg-purple-500 text-white hover:bg-purple-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }"
                  >
                    ${level}
                  </button>
                `)}
              </div>
              ${!isOpus46 && html`
                <p class="text-xs text-amber-400 font-mono">Adaptive thinking requires Opus 4.6</p>
              `}
              ${!isOpus46 && effortLevel === 'max' && html`
                <p class="text-xs text-red-400 font-mono">effort: "max" only available on Opus 4.6</p>
              `}
            </div>
          `}

          ${thinkingType === 'enabled' && html`
            <div class="space-y-2">
              ${isOpus46 && html`
                <p class="text-xs text-amber-400 font-mono">type: "enabled" is deprecated on Opus 4.6 — use Adaptive instead</p>
              `}
              <label class="text-xs text-slate-400 font-mono">Budget Tokens: ${budgetTokens.toLocaleString()}</label>
              <input
                type="range"
                min="1024"
                max="128000"
                step="1024"
                value=${budgetTokens}
                onInput=${(e) => setBudgetTokens(Math.max(1024, parseInt(e.target.value, 10)))}
                class="w-full accent-purple-500"
              />
              <div class="flex justify-between text-xs text-slate-500 font-mono">
                <span>1,024</span>
                <span>128K</span>
              </div>
            </div>
          `}

          <p class="text-xs text-slate-500 font-mono">Temperature will be set to 1 (required for thinking)</p>
        </div>
      `}
    </div>
  `;
}

function StructuredOutputSection() {
  const { structuredOutput, setStructuredOutput, outputSchema, setOutputSchema } = useApp();

  return html`
    <div class="space-y-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-300 font-mono">Structured Output</span>
        <${Toggle}
          checked=${structuredOutput}
          onChange=${setStructuredOutput}
        />
      </div>

      ${structuredOutput && html`
        <div class="space-y-2 animate-slide-up">
          <label class="text-xs text-slate-400 font-mono">JSON Schema</label>
          <textarea
            value=${outputSchema}
            onInput=${(e) => setOutputSchema(e.target.value)}
            placeholder='{"name": "response", "schema": {"type": "object", "properties": {...}}}'
            rows="4"
            class="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors resize-y"
          ></textarea>
        </div>
      `}
    </div>
  `;
}

function MessagesPanel() {
  const { conversationMode } = useApp();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return html`
    <div class="space-y-6">
      <${ModelSelector} />

      <${ThinkingSection} />

      <div class="border-t border-slate-800 pt-4">
        ${conversationMode
          ? html`<${ChatInterface} />`
          : html`<${MessageBuilder} />`
        }
      </div>

      ${!conversationMode && html`
        <div class="border-t border-slate-800 pt-4">
          <button
            onClick=${() => setShowAdvanced(!showAdvanced)}
            class="w-full flex items-center justify-between text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors"
          >
            <span class="font-mono">Advanced Options (Vision, Tools, Skills & Output)</span>
            <span class="text-amber-400">${showAdvanced ? '▼' : '▶'}</span>
          </button>

          ${showAdvanced && html`
            <div class="mt-4 animate-slide-up">
              <${AdvancedOptions} />
            </div>
          `}
        </div>
      `}
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
        model: 'claude-sonnet-4-5-20250929',
        messages: [{ role: 'user', content: '' }],
        max_tokens: 4096
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
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-slate-100 font-mono">Batch Status</div>
              <button
                onClick=${() => handleGetBatchStatus(batchStatus.id)}
                class="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-mono transition-colors"
              >
                Refresh
              </button>
            </div>
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

function SkillsPanel() {
  const {
    skillsLoading,
    skillsSourceFilter,
    setSkillsSourceFilter,
    handleListSkills,
    handleCreateSkill,
    handleGetSkill,
    handleDeleteSkill,
    skillDetail,
    skillVersions,
    setSkillVersions,
    handleListVersions,
    handleDeleteVersion
  } = useApp();

  const [activeTab, setActiveTab] = useState('list');
  const [skillId, setSkillId] = useState('');
  const [deleteSkillId, setDeleteSkillId] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = [
    { id: 'list', label: 'List' },
    { id: 'create', label: 'Create' },
    { id: 'get', label: 'Get' },
    { id: 'delete', label: 'Delete' },
  ];

  // Extract skill name from file paths (first folder in webkitRelativePath)
  const getSkillNameFromFiles = (files) => {
    for (const file of files) {
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          return parts[0]; // Return the folder name
        }
      }
    }
    return null;
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Handle dropped items (files or folders)
    const items = e.dataTransfer.items;
    if (items) {
      const filePromises = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
          if (entry) {
            filePromises.push(readEntry(entry, ''));
          }
        }
      }
      Promise.all(filePromises).then(results => {
        const allFiles = results.flat();
        setUploadFiles(prev => [...prev, ...allFiles]);
      });
    }
  };

  // Recursively read directory entries (skip hidden files)
  const readEntry = (entry, path) => {
    return new Promise((resolve) => {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        resolve([]);
        return;
      }

      if (entry.isFile) {
        entry.file(file => {
          // Create a new file object with the relative path
          const relativePath = path ? `${path}/${file.name}` : file.name;
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relativePath,
            writable: false
          });
          resolve([file]);
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const newPath = path ? `${path}/${entry.name}` : entry.name;
        dirReader.readEntries(entries => {
          Promise.all(entries.map(e => readEntry(e, newPath))).then(results => {
            resolve(results.flat());
          });
        });
      } else {
        resolve([]);
      }
    });
  };

  const handleFileSelect = (e) => {
    // Filter out hidden files
    const files = Array.from(e.target.files).filter(f => !f.name.startsWith('.'));
    setUploadFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const inferredSkillName = getSkillNameFromFiles(uploadFiles);
  const hasSkillMd = uploadFiles.some(f => f.name === 'SKILL.md');
  const hasValidSkillName = !!inferredSkillName;

  const handleCreate = () => {
    handleCreateSkill(uploadFiles, inferredSkillName, displayTitle);
    setUploadFiles([]);
    setDisplayTitle('');
  };

  return html`
    <div class="space-y-4">
      <div class="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3 backdrop-blur-sm">
        <p class="text-xs text-purple-400 font-medium mb-1 font-mono">Skills API (Beta)</p>
        <p class="text-xs text-purple-300/80 font-mono">
          Create and manage custom skills for document processing. Beta header auto-included.
        </p>
      </div>

      <${Tabs} tabs=${tabs} activeTab=${activeTab} onChange=${setActiveTab} />

      <div class="pt-2">
        ${activeTab === 'list' && html`
          <div class="space-y-3">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-300 font-mono">Source Filter</label>
              <div class="flex gap-2">
                ${['custom', 'anthropic'].map(source => html`
                  <button
                    key=${source}
                    onClick=${() => setSkillsSourceFilter(source)}
                    class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors
                           ${skillsSourceFilter === source
                             ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                             : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                           }"
                  >
                    ${source === 'custom' ? 'Custom Skills' : 'Anthropic Skills'}
                  </button>
                `)}
              </div>
            </div>

            <${Button}
              onClick=${() => handleListSkills({ source: skillsSourceFilter })}
              disabled=${skillsLoading}
              loading=${skillsLoading}
              fullWidth=${true}
            >
              List Skills
            </${Button}>
          </div>
        `}

        ${activeTab === 'create' && html`
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Display Title (Optional)</label>
              <input
                type="text"
                value=${displayTitle}
                onInput=${(e) => setDisplayTitle(e.target.value)}
                placeholder="My Custom Skill"
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Skill Folder</label>
              <div
                onDragOver=${handleDragOver}
                onDragLeave=${handleDragLeave}
                onDrop=${handleDrop}
                class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                       ${isDragging
                         ? 'border-amber-500 bg-amber-500/10'
                         : 'border-slate-700 hover:border-slate-600'
                       }"
              >
                <input
                  type="file"
                  webkitdirectory=""
                  onChange=${handleFileSelect}
                  class="hidden"
                  id="skill-file-input"
                />
                <label for="skill-file-input" class="cursor-pointer">
                  <div class="text-slate-400 font-mono text-sm mb-1">
                    Drop a skill folder here or click to select
                  </div>
                  <div class="text-slate-500 font-mono text-xs">
                    Folder must contain SKILL.md
                  </div>
                </label>
              </div>
            </div>

            ${uploadFiles.length > 0 && html`
              <div class="space-y-2">
                ${inferredSkillName && html`
                  <div class="flex items-center gap-2 text-sm font-mono">
                    <span class="text-slate-400">Skill name:</span>
                    <span class="text-amber-400 font-semibold">${inferredSkillName}</span>
                  </div>
                `}
                <p class="text-sm font-medium text-slate-300 font-mono">Files to upload (${uploadFiles.length})</p>
                ${uploadFiles.map((file, index) => html`
                  <div key=${index} class="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg font-mono text-sm">
                    <span class="text-slate-100 flex items-center gap-2">
                      ${file.name === 'SKILL.md' && html`<span class="text-mint-400">✓</span>`}
                      ${file.webkitRelativePath || file.name}
                      <span class="text-slate-500 text-xs">(${(file.size / 1024).toFixed(1)} KB)</span>
                    </span>
                    <button
                      onClick=${() => removeFile(index)}
                      class="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                `)}
              </div>
            `}

            ${!hasValidSkillName && uploadFiles.length > 0 && html`
              <div class="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 backdrop-blur-sm">
                <p class="text-xs text-amber-300 font-mono">
                  ⚠ Could not detect skill folder. Please select a folder containing your skill files.
                </p>
              </div>
            `}

            ${!hasSkillMd && uploadFiles.length > 0 && hasValidSkillName && html`
              <div class="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 backdrop-blur-sm">
                <p class="text-xs text-amber-300 font-mono">
                  ⚠ SKILL.md file is required
                </p>
              </div>
            `}

            <${Button}
              onClick=${handleCreate}
              disabled=${skillsLoading || !hasSkillMd || !hasValidSkillName}
              loading=${skillsLoading}
              fullWidth=${true}
            >
              Create Skill
            </${Button}>
          </div>
        `}

        ${activeTab === 'get' && html`
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Skill ID</label>
              <input
                type="text"
                value=${skillId}
                onInput=${(e) => setSkillId(e.target.value)}
                placeholder="skill_..."
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              />
            </div>

            <${Button}
              onClick=${() => handleGetSkill(skillId)}
              disabled=${skillsLoading || !skillId}
              loading=${skillsLoading}
              fullWidth=${true}
            >
              Retrieve Skill
            </${Button}>

            ${skillDetail && skillDetail.type !== 'skill_deleted' && html`
              <div class="border-t border-slate-800 pt-4">
                <div class="p-4 bg-slate-800/50 rounded-lg border border-slate-700 backdrop-blur-sm">
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-mono">ID:</span>
                      <span class="text-amber-400 font-mono truncate ml-2">${skillDetail.id}</span>
                    </div>
                    ${skillDetail.display_title && html`
                      <div class="flex justify-between">
                        <span class="text-slate-400 font-mono">Title:</span>
                        <span class="text-slate-100 font-mono">${skillDetail.display_title}</span>
                      </div>
                    `}
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-mono">Source:</span>
                      <span class="text-mint-400 font-mono">${skillDetail.source || 'custom'}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-mono">Created:</span>
                      <span class="text-slate-300 font-mono">${new Date(skillDetail.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            `}

            ${skillDetail && skillDetail.type === 'skill_deleted' && html`
              <div class="border-t border-slate-800 pt-4">
                <div class="p-4 bg-mint-900/20 rounded-lg border border-mint-700/50 backdrop-blur-sm">
                  <p class="text-sm text-mint-300 font-mono">Skill deleted successfully</p>
                </div>
              </div>
            `}
          </div>
        `}

        ${activeTab === 'delete' && html`
          <div class="space-y-3">
            <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-3 backdrop-blur-sm">
              <p class="text-xs text-red-300 font-mono">
                ⚠ Delete all versions before deleting the skill.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">Skill ID</label>
              <input
                type="text"
                value=${deleteSkillId}
                onInput=${(e) => { setDeleteSkillId(e.target.value); setSkillVersions(null); }}
                placeholder="skill_..."
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              />
            </div>

            <${Button}
              onClick=${() => handleListVersions(deleteSkillId)}
              disabled=${skillsLoading || !deleteSkillId}
              loading=${skillsLoading}
              fullWidth=${true}
              variant="secondary"
            >
              List Versions
            </${Button}>

            ${skillVersions && skillVersions.data && html`
              <div class="space-y-2">
                <p class="text-sm font-medium text-slate-300 font-mono">
                  Versions (${skillVersions.data.length})
                </p>
                ${skillVersions.data.length === 0 && html`
                  <div class="p-3 bg-mint-900/20 rounded-lg border border-mint-700/50">
                    <p class="text-sm text-mint-300 font-mono">No versions found. You can now delete the skill.</p>
                  </div>
                `}
                ${skillVersions.data.map(version => html`
                  <div key=${version.id} class="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-mono text-amber-400 truncate block">${version.id}</span>
                      <span class="text-xs font-mono text-slate-500">
                        ${version.created_at ? new Date(version.created_at).toLocaleString() : 'Unknown date'}
                      </span>
                    </div>
                    <button
                      onClick=${() => handleDeleteVersion(deleteSkillId, version.id)}
                      disabled=${skillsLoading}
                      class="ml-2 px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                    >
                      ${skillsLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                `)}
                <p class="text-xs text-slate-500 font-mono">
                  Note: Version deletion may not be supported yet in the Skills API beta.
                </p>
              </div>
            `}

            <div class="border-t border-slate-800 pt-3">
              <${Button}
                onClick=${() => { handleDeleteSkill(deleteSkillId); setDeleteSkillId(''); setSkillVersions(null); }}
                disabled=${skillsLoading || !deleteSkillId || (skillVersions && skillVersions.data && skillVersions.data.length > 0)}
                loading=${skillsLoading}
                fullWidth=${true}
                variant="danger"
              >
                Delete Skill
              </${Button}>
              ${skillVersions && skillVersions.data && skillVersions.data.length > 0 && html`
                <p class="text-xs text-slate-500 font-mono mt-2 text-center">
                  Delete all versions first
                </p>
              `}
            </div>

            ${skillDetail && skillDetail.type === 'skill_deleted' && html`
              <div class="p-4 bg-mint-900/20 rounded-lg border border-mint-700/50 backdrop-blur-sm">
                <p class="text-sm text-mint-300 font-mono">Skill deleted successfully</p>
              </div>
            `}
          </div>
        `}
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
            Prices as of Feb 2026
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

function ConfigPanel() {
  const {
    selectedEndpoint, handleSendRequest, handleCreateBatch, loading, apiKey,
    history, loadFromHistory, clearHistory, exportHistory, clearConfiguration,
    handleCountTokens, tokenCount, tokenCountLoading, tokenCountStale, setTokenCount,
    model, maxTokens, models, continueConversation, deleteHistoryItem,
    streaming, setStreaming, streamingText,
    messages, system, temperature, topP, topK, tools, betaHeaders,
    thinkingEnabled, thinkingType, budgetTokens, effortLevel
  } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const copyAsCurl = () => {
    const body = { model, messages, max_tokens: maxTokens };
    if (system) body.system = system;
    if (temperature !== 1.0) body.temperature = temperature;
    if (topP !== 0.99) body.top_p = topP;
    if (topK !== 0) body.top_k = topK;
    if (tools.length > 0) body.tools = tools;
    if (thinkingEnabled) {
      if (thinkingType === 'adaptive') {
        body.thinking = { type: 'adaptive' };
        body.output_config = { effort: effortLevel };
      } else {
        body.thinking = { type: 'enabled', budget_tokens: budgetTokens };
      }
      body.temperature = 1;
    }
    if (streaming) body.stream = true;

    const headers = [
      `-H "content-type: application/json"`,
      `-H "x-api-key: $ANTHROPIC_API_KEY"`,
      `-H "anthropic-version: 2023-06-01"`,
    ];
    if (betaHeaders.length > 0) {
      headers.push(`-H "anthropic-beta: ${betaHeaders.join(',')}"`);
    }

    const curl = `curl https://api.anthropic.com/v1/messages \\\n  ${headers.join(' \\\n  ')} \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    navigator.clipboard.writeText(curl);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

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
        <${BetaHeadersSection} />

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
          ${selectedEndpoint === 'skills' && html`<${SkillsPanel} />`}
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
                        class="p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all hover-lift"
                      >
                        <div class="flex items-start justify-between mb-1">
                          <span class="text-xs font-medium text-amber-400 font-mono">${item.model}</span>
                          <div class="flex items-center gap-2">
                            ${item.isConversation && html`
                              <span class="text-xs text-mint-400 font-mono">Chat</span>
                            `}
                            <span class="text-xs text-slate-500 font-mono">
                              ${new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p class="text-xs text-slate-300 truncate font-mono">${item.prompt}</p>
                        ${item.tokenUsage && html`
                          <p class="text-xs text-slate-500 mt-1 font-mono">
                            <span class="text-mint-400">${item.tokenUsage.input_tokens}</span> in /
                            <span class="text-mint-400">${item.tokenUsage.output_tokens}</span> out
                          </p>
                        `}

                        <!-- Action buttons -->
                        <div class="flex gap-2 mt-2">
                          <${Button}
                            variant="ghost"
                            size="sm"
                            onClick=${() => loadFromHistory(item)}
                          >
                            Load
                          </${Button}>
                          ${item.isConversation && html`
                            <${Button}
                              variant="secondary"
                              size="sm"
                              onClick=${() => continueConversation(item)}
                            >
                              Continue
                            </${Button}>
                          `}
                          <${Button}
                            variant="danger"
                            size="sm"
                            onClick=${() => deleteHistoryItem(item.id)}
                          >
                            Delete
                          </${Button}>
                        </div>
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
            <${ConversationModeToggle} />

            <div class="flex items-center justify-between p-2 bg-slate-800/30 border border-slate-700 rounded-lg mb-2">
              <span class="text-sm font-medium text-slate-300 font-mono">Stream Response</span>
              <${Toggle}
                checked=${streaming}
                onChange=${setStreaming}
              />
            </div>

            <div class="flex gap-2">
              <${Button}
                onClick=${handleSendRequest}
                disabled=${loading || !apiKey}
                fullWidth=${true}
                size="lg"
              >
                ${loading ? (streaming ? 'Streaming...' : 'Processing...') : (streaming ? 'Send (Stream)' : 'Send Request')}
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

            <${Button}
              variant="ghost"
              size="sm"
              onClick=${copyAsCurl}
              fullWidth=${true}
            >
              ${copyStatus || 'Copy as cURL'}
            </${Button}>
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
  const {
    response, loading, error, selectedEndpoint, modelsList, batchStatus,
    usageReport, costReport, skillsList, skillDetail, handleGetSkill,
    toolExecutionStatus, toolExecutionDetails, models, maxTokens, tokenCount,
    model, batchResultsData, batchResultsLoading, batchResultsError,
    handleFetchBatchResults, handleGetBatchStatus, streamingText
  } = useApp();
  const [viewMode, setViewMode] = useState('formatted');

  // Determine if we should show view mode toggle
  const showViewModeToggle = response || modelsList || batchStatus || usageReport || costReport || skillsList || skillDetail;

  // Determine the response type
  const getResponseType = () => {
    if (selectedEndpoint === 'models' && modelsList) return 'models';
    if (selectedEndpoint === 'batches' && (batchStatus || response?.id)) return 'batch';
    if (selectedEndpoint === 'messages' && response?.content) return 'message';
    if (selectedEndpoint === 'skills' && (skillsList || skillDetail)) return 'skills';
    if (selectedEndpoint === 'usage' && (usageReport || response?.data)) return 'usage';
    if (selectedEndpoint === 'cost' && (costReport || response?.data)) return 'cost';
    return 'generic';
  };

  const responseType = getResponseType();
  const hasNoData = !response && !modelsList && !batchStatus && !usageReport && !costReport && !skillsList && !skillDetail;

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

        ${loading && streamingText && html`
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm animate-fade-in">
            <div class="text-base leading-relaxed text-slate-100 whitespace-pre-wrap font-mono">
              ${streamingText}<span class="inline-block w-2 h-5 bg-amber-400 ml-0.5 animate-pulse"></span>
            </div>
          </div>
        `}

        ${!loading && !error && viewMode === 'json' && showViewModeToggle && html`
          <pre class="bg-slate-950 text-mint-300 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed border border-slate-800 shadow-xl terminal-glow animate-fade-in whitespace-pre-wrap break-words">
            ${JSON.stringify(response || modelsList || batchStatus || usageReport || costReport || skillsList || skillDetail, null, 2)}
          </pre>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'message' && response && html`
          <${MessageResponseView}
            response=${response}
            toolExecutionDetails=${toolExecutionDetails}
            models=${models}
            maxTokens=${maxTokens}
            tokenCount=${tokenCount}
            model=${model}
          />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'batch' && (response || batchStatus) && html`
          <${BatchResponseView}
            response=${response}
            batchStatus=${batchStatus}
            batchResultsData=${batchResultsData}
            batchResultsLoading=${batchResultsLoading}
            batchResultsError=${batchResultsError}
            handleFetchBatchResults=${handleFetchBatchResults}
            handleGetBatchStatus=${handleGetBatchStatus}
          />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'models' && modelsList && html`
          <${ModelsResponseView} modelsList=${modelsList} />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'usage' && (usageReport || response) && html`
          <${UsageResponseView} usageReport=${usageReport} response=${response} />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'cost' && (costReport || response) && html`
          <${CostResponseView} costReport=${costReport} response=${response} />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'skills' && (skillsList || skillDetail) && html`
          <${SkillsResponseView}
            skillsList=${skillsList}
            skillDetail=${skillDetail}
            handleGetSkill=${handleGetSkill}
          />
        `}

        ${!loading && !error && hasNoData && html`
          <${EmptyResponseState} />
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
    { id: 'skills', label: 'Skills', description: endpoints.skills.description },
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
                <span class="text-amber-400">v3.2</span> • Developer Command Center
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
          <${ErrorBoundary}>
            <${ConfigPanel} />
          </${ErrorBoundary}>
        </div>

        <div class="flex-1 min-w-0 overflow-hidden">
          <${ErrorBoundary}>
            <${ResponsePanel} />
          </${ErrorBoundary}>
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
