import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { storage } from '../utils/localStorage.js';
import modelsConfig from '../config/models.js';

const html = htm.bind(React.createElement);
const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  // API Key state
  const [apiKey, setApiKey] = useState(storage.getApiKey() || '');
  const [persistKey, setPersistKey] = useState(storage.shouldPersistKey());

  // Request configuration
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [messages, setMessages] = useState([{ role: 'user', content: '' }]);
  const [system, setSystem] = useState('');
  const [maxTokens, setMaxTokens] = useState(1024);
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(1.0);
  const [topK, setTopK] = useState(0);
  const [stream, setStream] = useState(false);

  // Advanced features
  const [tools, setTools] = useState([]);
  const [images, setImages] = useState([]);

  // Response state
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  // History
  const [history, setHistory] = useState(storage.getHistory());

  // Update API key in storage when it changes
  useEffect(() => {
    if (apiKey) {
      storage.saveApiKey(apiKey, persistKey);
    }
  }, [apiKey, persistKey]);

  // Load last configuration on mount
  useEffect(() => {
    const lastConfig = storage.getLastConfig();
    if (lastConfig) {
      if (lastConfig.model) setModel(lastConfig.model);
      if (lastConfig.maxTokens) setMaxTokens(lastConfig.maxTokens);
      if (lastConfig.temperature !== undefined) setTemperature(lastConfig.temperature);
      if (lastConfig.topP !== undefined) setTopP(lastConfig.topP);
      if (lastConfig.topK !== undefined) setTopK(lastConfig.topK);
      if (lastConfig.stream !== undefined) setStream(lastConfig.stream);
      if (lastConfig.system) setSystem(lastConfig.system);
      if (lastConfig.tools) setTools(lastConfig.tools);
    }
  }, []);

  // Save configuration when it changes
  useEffect(() => {
    storage.saveLastConfig({
      model,
      maxTokens,
      temperature,
      topP,
      topK,
      stream,
      system,
      tools
    });
  }, [model, maxTokens, temperature, topP, topK, stream, system, tools]);

  const handleSendRequest = async () => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    // Validate messages
    const hasValidContent = messages.some(msg => {
      if (typeof msg.content === 'string') return msg.content.trim().length > 0;
      if (Array.isArray(msg.content)) return msg.content.length > 0;
      return false;
    });

    if (!messages.length || !hasValidContent) {
      setError('Please provide at least one message with content');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setStreamingText('');

    // Integrate images into the first user message if images exist
    const messagesWithImages = images.length > 0 ? messages.map((msg, idx) => {
      if (idx === 0 && msg.role === 'user') {
        const textContent = typeof msg.content === 'string' ? msg.content : '';
        return {
          ...msg,
          content: [
            { type: 'text', text: textContent },
            ...images
          ]
        };
      }
      return msg;
    }) : messages;

    const requestBody = {
      model,
      messages: messagesWithImages,
      max_tokens: maxTokens,
    };

    if (system) requestBody.system = system;
    if (temperature !== 1.0) requestBody.temperature = temperature;
    if (topP !== 1.0) requestBody.top_p = topP;
    if (topK !== 0) requestBody.top_k = topK;
    if (tools.length > 0) requestBody.tools = tools;
    if (stream) requestBody.stream = stream;

    try {
      const res = await fetch('http://localhost:3001/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);

      // Save to history
      storage.saveToHistory(requestBody, data);
      setHistory(storage.getHistory());
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  const clearApiKey = () => {
    storage.clearApiKey();
    setApiKey('');
  };

  const loadFromHistory = (historyItem) => {
    const { request } = historyItem;
    if (request.model) setModel(request.model);
    if (request.messages) setMessages(request.messages);
    if (request.system) setSystem(request.system);
    if (request.max_tokens) setMaxTokens(request.max_tokens);
    if (request.temperature !== undefined) setTemperature(request.temperature);
    if (request.top_p !== undefined) setTopP(request.top_p);
    if (request.top_k !== undefined) setTopK(request.top_k);
    if (request.tools) setTools(request.tools);
  };

  const clearHistory = () => {
    storage.clearHistory();
    setHistory([]);
  };

  const deleteHistoryItem = (id) => {
    storage.deleteHistoryItem(id);
    setHistory(storage.getHistory());
  };

  const exportHistory = () => {
    storage.exportHistory();
  };

  const value = useMemo(() => ({
    // API Key
    apiKey,
    setApiKey,
    persistKey,
    setPersistKey,
    clearApiKey,

    // Configuration
    model,
    setModel,
    models: modelsConfig.models,
    messages,
    setMessages,
    system,
    setSystem,
    maxTokens,
    setMaxTokens,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    stream,
    setStream,

    // Advanced features
    tools,
    setTools,
    images,
    setImages,

    // Response
    response,
    loading,
    error,
    streamingText,
    handleSendRequest,

    // History
    history,
    loadFromHistory,
    clearHistory,
    deleteHistoryItem,
    exportHistory,
  }), [
    apiKey, persistKey, clearApiKey,
    model, messages, system, maxTokens, temperature, topP, topK, stream,
    tools, images,
    response, loading, error, streamingText, handleSendRequest,
    history, loadFromHistory, clearHistory, deleteHistoryItem, exportHistory
  ]);

  return html`<${AppContext.Provider} value=${value}>${children}</${AppContext.Provider}>`;
}
