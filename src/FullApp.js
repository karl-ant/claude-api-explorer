import React, { useState } from 'react';
import htm from 'htm';
import { AppProvider, useApp } from './context/AppContext.js';
import { Button } from './components/common/Button.js';
import { Toggle } from './components/common/Toggle.js';
import { Tabs } from './components/common/Tabs.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { fileToBase64, getImageMediaType, extractMessageText } from './utils/formatters.js';
import {
  supportsAdaptiveThinking,
  manualThinkingBlocked,
  thinkingAlwaysOn,
  supportsXhigh,
  supportsFastMode,
  fastModeNote,
  modelNamesSupporting
} from './config/models.js';
import {
  MessageResponseView,
  SkillsResponseView,
  FilesResponseView,
  EmptyResponseState,
  RequestInspector
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
    { id: 'files-api-2025-04-14', label: 'Files API' },
    { id: 'computer-use-2025-11-24', label: 'Computer Use (4.5+)' },
    { id: 'computer-use-2025-01-24', label: 'Computer Use (Legacy)' },
    { id: 'compact-2026-01-12', label: 'Compaction' },
    { id: 'context-1m-2025-08-07', label: '1M Context (legacy models — 4.6+ native)' },
    { id: 'context-management-2025-06-27', label: 'Context Mgmt' },
    { id: 'interleaved-thinking-2025-05-14', label: 'Interleaved Think' },
    { id: 'advisor-tool-2026-03-01', label: 'Advisor Tool' },
    { id: 'cache-diagnosis-2026-04-07', label: 'Cache Diagnostics' },
    { id: 'task-budgets-2026-03-13', label: 'Task Budgets (4.7+)' },
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
  const {
    model, setModel, models: staticModels, modelsList, modelsLoading,
    maxTokens, setMaxTokens, temperature, setTemperature, topP, setTopP, topK, setTopK,
    internalMode, customModelId, setCustomModelId
  } = useApp();

  // Prefer live API metadata, fall back to static config
  const getMaxOutput = (modelId) => {
    const apiModel = modelsList?.data?.find(m => m.id === modelId);
    if (apiModel?.max_tokens) return apiModel.max_tokens;
    const staticMatch = staticModels.find(s => s.id === modelId);
    return staticMatch?.maxOutput || 8192;
  };

  // Merge live API data with static config (pricing, descriptions)
  const availableModels = React.useMemo(() => {
    return modelsList?.data
      ? modelsList.data.map(apiModel => {
          const staticMatch = staticModels.find(s => s.id === apiModel.id);
          return {
            id: apiModel.id,
            name: apiModel.id,
            maxOutput: apiModel.max_tokens ?? staticMatch?.maxOutput,
            maxInput: apiModel.max_input_tokens,
            capabilities: apiModel.capabilities,
            description: staticMatch?.description || apiModel.display_name || '',
            pricing: staticMatch?.pricing,
            deprecated: staticMatch?.deprecated,
            deprecationNote: staticMatch?.deprecationNote,
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
          Model
          ${modelsLoading ? html`<span class="text-amber-400 text-xs"> (loading...)</span>` : modelsList?.data ? html`<span class="text-mint-400 text-xs"> (${availableModels.length} available)</span>` : ''}
          ${internalMode && html`<span class="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-mono">[internal]</span>`}
        </label>
        <select
          value=${model}
          onChange=${(e) => setModel(e.target.value)}
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 hover:border-slate-600 transition-colors cursor-pointer"
        >
          ${availableModels.map((m) => html`
            <option key=${m.id} value=${m.id}>${m.name}${m.deprecated ? ' ⚠' : ''}</option>
          `)}
        </select>
        <p class="text-xs text-slate-500 mt-2 font-mono">
          ${selectedModel?.description || ''}
          ${selectedModel?.maxInput && html` · ${(selectedModel.maxInput / 1000).toFixed(0)}K input`}
        </p>
        ${selectedModel?.deprecated && html`
          <p class="text-xs text-amber-400 font-mono mt-1">
            ⚠ Deprecated — ${selectedModel.deprecationNote || 'will be removed soon'}
          </p>
        `}
        ${internalMode && html`
          <div class="mt-3 p-3 bg-slate-800/50 border border-amber-500/30 rounded-lg animate-slide-up">
            <label class="block text-xs text-amber-400 font-mono mb-2">
              Custom model ID <span class="text-slate-500">(session-only, not persisted)</span>
            </label>
            <input
              type="text"
              value=${customModelId}
              onInput=${(e) => setCustomModelId(e.target.value)}
              placeholder="type any model id..."
              class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
            />
            ${customModelId.trim() && html`
              <p class="text-xs text-slate-500 font-mono mt-2">→ will use: ${customModelId.trim()}</p>
            `}
          </div>
        `}
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
  const { tools, setTools, images, setImages, skillsJson, setSkillsJson } = useApp();
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

            <!-- Server-Side Tools (Anthropic) -->
            <div class="space-y-3">
              <p class="text-sm font-medium text-slate-300 font-mono">Server-Side Tools (Anthropic)</p>
              <p class="text-xs text-slate-500 font-mono">Managed by Anthropic — executed server-side, no client setup needed.</p>
              <div class="grid grid-cols-2 gap-2">
                ${[
                  { type: 'web_search_20260318', name: 'web_search', label: 'Web Search', desc: '$10/1K searches' },
                  { type: 'web_fetch_20260318', name: 'web_fetch', label: 'Web Fetch', desc: 'Token cost only' },
                  { type: 'code_execution_20260521', name: 'code_execution', label: 'Code Exec', desc: 'Sandboxed bash' },
                  { type: 'computer_20251124', name: 'computer', label: 'Computer Use', desc: 'Screen interaction (4.5+)' },
                  { type: 'text_editor_20250728', name: 'text_editor', label: 'Text Editor', desc: 'File editing' },
                  { type: 'memory_20250818', name: 'memory', label: 'Memory', desc: 'Persistent memory' },
                  { type: 'tool_search_tool_bm25_20251119', name: 'tool_search', label: 'Tool Search', desc: 'BM25 keyword search' },
                  { type: 'advisor_20260301', name: 'advisor', label: 'Advisor', desc: 'Advisor model mid-generation (Beta)' },
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

            <div class="space-y-2">
              <p class="text-sm font-medium text-slate-300 font-mono">Custom Tool (JSON)</p>
              <p class="text-xs text-slate-500 font-mono">Define a client tool schema for Claude to call. Tool use ends the turn — the tool_use block is displayed, not executed.</p>
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
            <p class="text-sm text-slate-400 font-mono">Configure skills for document processing. Requires the Skills and Files API beta headers; the code_execution tool is auto-added (GA, no beta header).</p>

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
            <${CacheDiagnosticsSection} />
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
  const { thinkingEnabled, setThinkingEnabled, thinkingType, setThinkingType, budgetTokens, setBudgetTokens, effortLevel, setEffortLevel, thinkingDisplay, setThinkingDisplay, model } = useApp();

  // Capability flags come from the matrix in config/models.js (unknown IDs → permissive)
  const supportsAdaptive = supportsAdaptiveThinking(model);
  const manualBlocked = manualThinkingBlocked(model);
  const alwaysOn = thinkingAlwaysOn(model);
  const xhighOk = supportsXhigh(model);

  return html`
    <div class="space-y-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-300 font-mono">Extended Thinking</span>
        <${Toggle}
          checked=${thinkingEnabled}
          onChange=${setThinkingEnabled}
        />
      </div>

      ${alwaysOn && html`
        <p class="text-xs text-slate-500 font-mono">Adaptive thinking is always on for this model and cannot be disabled. The toggle only controls whether thinking/effort options are sent explicitly.</p>
      `}

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
              onClick=${() => !manualBlocked && setThinkingType('enabled')}
              disabled=${manualBlocked}
              class="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                manualBlocked
                  ? 'bg-slate-800 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : thinkingType === 'enabled'
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
                ${['low', 'medium', 'high', 'xhigh', 'max'].map(level => html`
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
              ${!supportsAdaptive && html`
                <p class="text-xs text-amber-400 font-mono">Adaptive thinking requires: ${modelNamesSupporting('adaptiveThinking')}</p>
              `}
              ${effortLevel === 'xhigh' && !xhighOk && html`
                <p class="text-xs text-red-400 font-mono">effort: "xhigh" is only available on: ${modelNamesSupporting('xhighEffort')}</p>
              `}
            </div>
          `}

          ${thinkingType === 'enabled' && html`
            <div class="space-y-2">
              ${manualBlocked && html`
                <p class="text-xs text-red-400 font-mono">This model supports adaptive thinking only — a manual budget will be rejected (400)</p>
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

          <div class="flex items-center justify-between pt-2 border-t border-slate-700">
            <div>
              <span class="text-xs text-slate-400 font-mono">Display mode</span>
              <p class="text-xs text-slate-500 font-mono">summarized = show summary · omitted = keep signature, hide content</p>
              <p class="text-xs text-slate-600 font-mono">API default is "omitted" on Fable 5 / Opus 4.8 / 4.7, "summarized" on older adaptive models</p>
            </div>
            <div class="flex gap-1">
              ${['summarized', 'omitted'].map(mode => html`
                <button
                  key=${mode}
                  onClick=${() => setThinkingDisplay(mode)}
                  class="px-2 py-1 text-xs font-mono rounded transition-colors ${
                    thinkingDisplay === mode
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                  }"
                >
                  ${mode}
                </button>
              `)}
            </div>
          </div>

          <p class="text-xs text-slate-500 font-mono">${manualBlocked
            ? 'Sampling params are not sent alongside thinking on this model'
            : 'Temperature will be set to 1 (required for thinking)'}</p>
        </div>
      `}
    </div>
  `;
}

function SpeedCacheSection() {
  const { speedMode, setSpeedMode, cacheControl, setCacheControl, model } = useApp();
  const fastModeOk = supportsFastMode(model);
  const fastNote = fastModeNote(model);

  return html`
    <div class="space-y-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-sm font-medium text-slate-300 font-mono">Prompt Caching</span>
          <p class="text-xs text-slate-500 font-mono">top-level cache_control: ephemeral</p>
        </div>
        <${Toggle}
          checked=${cacheControl}
          onChange=${setCacheControl}
        />
      </div>

      ${(fastModeOk || speedMode) && html`
        <div class="flex items-center justify-between pt-3 border-t border-slate-700">
          <div>
            <span class="text-sm font-medium text-slate-300 font-mono">Fast Mode</span>
            <p class="text-xs text-slate-500 font-mono">speed: fast · adds anthropic-beta: fast-mode-2026-02-01</p>
            ${fastModeOk && fastNote && html`
              <p class="text-xs text-amber-400 font-mono">${fastNote}</p>
            `}
            ${!fastModeOk && html`
              <p class="text-xs text-red-400 font-mono">Not supported on this model (${modelNamesSupporting('fastMode')} only) — turn it off or switch models</p>
            `}
          </div>
          <${Toggle}
            checked=${speedMode}
            onChange=${setSpeedMode}
          />
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

function CacheDiagnosticsSection() {
  const { betaHeaders, previousMessageId, setPreviousMessageId, response } = useApp();
  const enabled = betaHeaders.includes('cache-diagnosis-2026-04-07');

  if (!enabled) return null;

  return html`
    <div class="space-y-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg animate-slide-up">
      <div>
        <span class="text-sm font-medium text-slate-300 font-mono">Cache Diagnostics</span>
        <p class="text-xs text-slate-500 font-mono">Sends diagnostics.previous_message_id (null on the first turn) — the response reports cache_miss_reason explaining where the prompt cache prefix diverged. Auto-filled from the last response.</p>
      </div>
      <div class="flex gap-2">
        <input
          type="text"
          value=${previousMessageId}
          onInput=${(e) => setPreviousMessageId(e.target.value)}
          placeholder="msg_..."
          class="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
        />
        <${Button}
          variant="secondary"
          size="sm"
          disabled=${!response?.id}
          onClick=${() => response?.id && setPreviousMessageId(response.id)}
        >
          Use last response
        </${Button}>
      </div>
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

      <${SpeedCacheSection} />

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

function FilesPanel() {
  const {
    filesLoading,
    handleListFiles,
    handleUploadFile,
    handleGetFile,
    handleDeleteFile,
  } = useApp();

  const [activeTab, setActiveTab] = useState('list');
  const [fileId, setFileId] = useState('');
  const [deleteFileId, setDeleteFileId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = [
    { id: 'list', label: 'List' },
    { id: 'upload', label: 'Upload' },
    { id: 'get', label: 'Get' },
    { id: 'delete', label: 'Delete' },
  ];

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) setUploadFile(file);
  };

  const handleUpload = () => {
    if (!uploadFile) return;
    handleUploadFile(uploadFile);
    setUploadFile(null);
  };

  return html`
    <div class="space-y-4">
      <div class="bg-mint-900/20 border border-mint-700/50 rounded-lg p-3 backdrop-blur-sm">
        <p class="text-xs text-mint-400 font-medium mb-1 font-mono">Files API (Beta)</p>
        <p class="text-xs text-mint-300/80 font-mono">
          Upload files to reference by file_id in Messages requests. Beta header auto-included. File operations are free.
        </p>
      </div>

      <${Tabs} tabs=${tabs} activeTab=${activeTab} onChange=${setActiveTab} />

      <div class="pt-2">
        ${activeTab === 'list' && html`
          <div class="space-y-3">
            <${Button}
              onClick=${() => handleListFiles()}
              disabled=${filesLoading}
              loading=${filesLoading}
              fullWidth=${true}
            >
              List Files
            </${Button}>
          </div>
        `}

        ${activeTab === 'upload' && html`
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">File</label>
              <div
                onDragOver=${handleDragOver}
                onDragLeave=${handleDragLeave}
                onDrop=${handleDrop}
                class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                       ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600'}"
              >
                <input type="file" onChange=${handleFileSelect} class="hidden" id="file-upload-input" />
                <label for="file-upload-input" class="cursor-pointer">
                  <div class="text-slate-400 font-mono text-sm mb-1">Drop a file here or click to select</div>
                  <div class="text-slate-500 font-mono text-xs">Max 500 MB per file</div>
                </label>
              </div>
            </div>

            ${uploadFile && html`
              <div class="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg font-mono text-sm">
                <span class="text-slate-100 truncate">
                  ${uploadFile.name}
                  <span class="text-slate-500 text-xs ml-2">(${(uploadFile.size / 1024).toFixed(1)} KB)</span>
                </span>
                <button onClick=${() => setUploadFile(null)} class="text-red-400 hover:text-red-300 transition-colors ml-2">Remove</button>
              </div>
            `}

            <${Button}
              onClick=${handleUpload}
              disabled=${filesLoading || !uploadFile}
              loading=${filesLoading}
              fullWidth=${true}
            >
              Upload File
            </${Button}>
          </div>
        `}

        ${activeTab === 'get' && html`
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">File ID</label>
              <input
                type="text"
                value=${fileId}
                onInput=${(e) => setFileId(e.target.value)}
                placeholder="file_..."
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              />
            </div>
            <${Button}
              onClick=${() => handleGetFile(fileId)}
              disabled=${filesLoading || !fileId}
              loading=${filesLoading}
              fullWidth=${true}
            >
              Retrieve File Metadata
            </${Button}>
          </div>
        `}

        ${activeTab === 'delete' && html`
          <div class="space-y-3">
            <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-3 backdrop-blur-sm">
              <p class="text-xs text-red-300 font-mono">⚠ Deleting a file is irreversible.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2 font-mono">File ID</label>
              <input
                type="text"
                value=${deleteFileId}
                onInput=${(e) => setDeleteFileId(e.target.value)}
                placeholder="file_..."
                class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none text-sm font-mono text-slate-100 placeholder-slate-600 hover:border-slate-600 transition-colors"
              />
            </div>
            <${Button}
              onClick=${() => { handleDeleteFile(deleteFileId); setDeleteFileId(''); }}
              disabled=${filesLoading || !deleteFileId}
              loading=${filesLoading}
              fullWidth=${true}
              variant="danger"
            >
              Delete File
            </${Button}>
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
            Prices as of May 2026
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
    selectedEndpoint, handleSendRequest, buildMessagesRequest, loading, apiKey,
    history, loadFromHistory, clearHistory, exportHistory, clearConfiguration,
    handleCountTokens, tokenCount, tokenCountLoading, tokenCountStale, setTokenCount,
    model, maxTokens, models, continueConversation, deleteHistoryItem,
    streaming, setStreaming, streamingText
  } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const copyAsCurl = () => {
    // Same builder the Send button uses, so the copied curl can never drift
    // from the request the app actually sends.
    const { requestBody, betaHeaders: betaHeadersForCurl } = buildMessagesRequest();
    const body = { ...requestBody };
    if (streaming) body.stream = true;

    const headers = [
      `-H "content-type: application/json"`,
      `-H "x-api-key: $ANTHROPIC_API_KEY"`,
      `-H "anthropic-version: 2023-06-01"`,
    ];
    if (betaHeadersForCurl.length > 0) {
      headers.push(`-H "anthropic-beta: ${betaHeadersForCurl.join(',')}"`);
    }

    // Escape single quotes in JSON body for safe shell embedding
    const bodyJson = JSON.stringify(body, null, 2).replace(/'/g, "'\\''");
    const curl = `curl https://api.anthropic.com/v1/messages \\\n  ${headers.join(' \\\n  ')} \\\n  -d '${bodyJson}'`;
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

  // The Send/Count/cURL footer only applies to the Messages tab
  const showActionFooter = selectedEndpoint === 'messages';

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
          ${selectedEndpoint === 'skills' && html`<${SkillsPanel} />`}
          ${selectedEndpoint === 'files' && html`<${FilesPanel} />`}
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

      ${showActionFooter && html`
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
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
        </div>
      `}
    </div>
  `;
}

function ResponsePanel() {
  const {
    response, loading, error, selectedEndpoint, skillsList, skillDetail, handleGetSkill,
    filesList, fileDetail, handleGetFile, handleDeleteFile, handleDownloadFile,
    models, maxTokens, tokenCount,
    model, streamingText, lastRequest
  } = useApp();
  const [viewMode, setViewMode] = useState('formatted');

  // Determine if we should show view mode toggle
  const showViewModeToggle = response || skillsList || skillDetail || filesList || fileDetail;

  // Determine the response type
  const getResponseType = () => {
    if (selectedEndpoint === 'messages' && response?.content) return 'message';
    if (selectedEndpoint === 'skills' && (skillsList || skillDetail)) return 'skills';
    if (selectedEndpoint === 'files' && (filesList || fileDetail)) return 'files';
    return 'generic';
  };

  const responseType = getResponseType();
  const hasNoData = !response && !skillsList && !skillDetail && !filesList && !fileDetail;

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
              Processing request...
            </span>
          </div>
        `}
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        ${selectedEndpoint === 'messages' && html`
          <${RequestInspector} request=${lastRequest} />
        `}

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
            ${JSON.stringify(response || skillsList || skillDetail || filesList || fileDetail, null, 2)}
          </pre>
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'message' && response && html`
          <${MessageResponseView}
            response=${response}
            models=${models}
            maxTokens=${maxTokens}
            tokenCount=${tokenCount}
            model=${model}
          />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'skills' && (skillsList || skillDetail) && html`
          <${SkillsResponseView}
            skillsList=${skillsList}
            skillDetail=${skillDetail}
            handleGetSkill=${handleGetSkill}
          />
        `}

        ${!loading && !error && viewMode === 'formatted' && responseType === 'files' && (filesList || fileDetail) && html`
          <${FilesResponseView}
            filesList=${filesList}
            fileDetail=${fileDetail}
            handleGetFile=${handleGetFile}
            handleDeleteFile=${handleDeleteFile}
            handleDownloadFile=${handleDownloadFile}
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
  const { selectedEndpoint, setSelectedEndpoint, endpoints, setInternalMode } = useApp();

  // Keyboard shortcut: Ctrl+Shift+I toggles internal mode
  React.useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        setInternalMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setInternalMode]);

  const endpointTabs = [
    { id: 'messages', label: 'Messages', description: endpoints.messages.description },
    { id: 'skills', label: 'Skills', description: endpoints.skills.description },
    { id: 'files', label: 'Files', description: endpoints.files.description },
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
                <span class="text-amber-400">v4.0</span> • Developer Command Center
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
