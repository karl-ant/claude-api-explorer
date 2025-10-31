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
        description: 'Perform mathematical calculations',
        input_schema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The mathematical expression to evaluate'
            }
          },
          required: ['expression']
        }
      },
    };
    setTools(prev => [...prev, predefined[toolType]]);
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
            <p class="text-sm text-gray-600">Configure tools for Claude to use</p>

            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700">Predefined Tools</p>
              <div class="flex gap-2">
                <${Button} variant="secondary" size="sm" onClick=${() => addPredefinedTool('calculator')}>
                  + Calculator
                </${Button}>
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
              <div class="space-y-2">
                <p class="text-sm font-medium text-gray-700">${tools.length} tool(s) configured</p>
                ${tools.map((tool, index) => html`
                  <div key=${index} class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600 font-medium">${tool.name}</span>
                    <button
                      onClick=${() => removeTool(index)}
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
      </div>
    </div>
  `;
}

function ConfigPanel() {
  const { handleSendRequest, loading, apiKey, history, loadFromHistory, clearHistory, exportHistory } = useApp();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return html`
    <div class="h-full flex flex-col bg-white border-r border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Configuration</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <${ApiKeySection} />

        <div class="border-t pt-4">
          <${ModelSelector} />
        </div>

        <div class="border-t pt-4">
          <${MessageBuilder} />
        </div>

        <div class="border-t pt-4">
          <button
            onClick=${() => setShowAdvanced(!showAdvanced)}
            class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Advanced Options</span>
            <span>${showAdvanced ? '▼' : '▶'}</span>
          </button>

          ${showAdvanced && html`
            <div class="mt-4">
              <${AdvancedOptions} />
            </div>
          `}
        </div>

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
      </div>

      <div class="p-4 border-t border-gray-200 bg-gray-50">
        <${Button}
          onClick=${handleSendRequest}
          disabled=${loading || !apiKey}
          fullWidth=${true}
          size="lg"
        >
          ${loading ? 'Sending...' : 'Send Request'}
        </${Button}>
      </div>
    </div>
  `;
}

function ResponsePanel() {
  const { response, loading, error, streamingText } = useApp();
  const [viewMode, setViewMode] = useState('message');

  return html`
    <div class="h-full flex flex-col bg-white">
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">Response</h2>

          ${response && html`
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">View:</span>
              <button
                onClick=${() => setViewMode('message')}
                class="px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'message' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }"
              >
                Message
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
            <span class="text-sm font-medium">Generating response...</span>
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

        ${!loading && !error && response && viewMode === 'json' && html`
          <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            ${JSON.stringify(response, null, 2)}
          </pre>
        `}

        ${!loading && !error && response && viewMode === 'message' && html`
          <div class="space-y-4">
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="prose prose-sm max-w-none">
                <pre class="whitespace-pre-wrap font-sans text-gray-800">
                  ${extractMessageText(response.content)}
                </pre>
              </div>
            </div>

            ${response.usage && html`
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Model:</span>
                  <span class="font-medium text-gray-900">${response.model}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Input Tokens:</span>
                  <span class="font-medium text-gray-900">${response.usage.input_tokens}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Output Tokens:</span>
                  <span class="font-medium text-gray-900">${response.usage.output_tokens}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Total Tokens:</span>
                  <span class="font-medium text-gray-900">
                    ${response.usage.input_tokens + response.usage.output_tokens}
                  </span>
                </div>
                ${response.stop_reason && html`
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">Stop Reason:</span>
                    <span class="font-medium text-gray-900">${response.stop_reason}</span>
                  </div>
                `}
              </div>
            `}
          </div>
        `}

        ${!loading && !error && !response && html`
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
              <p class="text-xs mt-1">Configure your request and click Send</p>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function AppContent() {
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

      <div class="flex-1 flex overflow-hidden">
        <div class="w-1/2 min-w-[400px]">
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
