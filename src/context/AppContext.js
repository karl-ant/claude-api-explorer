import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { storage } from '../utils/localStorage.js';
import { executeTool } from '../utils/formatters.js';
import modelsConfig from '../config/models.js';
import endpoints from '../config/endpoints.js';

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

  // Endpoint selection
  const [selectedEndpoint, setSelectedEndpoint] = useState('messages');

  // Request configuration (Messages API)
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

  // Endpoint-specific state
  // Batches API
  const [batchRequests, setBatchRequests] = useState([{ custom_id: '', params: { model: 'claude-sonnet-4-20250514', messages: [{ role: 'user', content: '' }], max_tokens: 1024 } }]);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchResults, setBatchResults] = useState(null);

  // Models API
  const [modelsList, setModelsList] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Usage API
  const [usageReport, setUsageReport] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Cost API
  const [costReport, setCostReport] = useState(null);
  const [costLoading, setCostLoading] = useState(false);

  // Response state
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [toolExecutionStatus, setToolExecutionStatus] = useState(null);
  const [toolExecutionDetails, setToolExecutionDetails] = useState(null);

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
    setToolExecutionStatus(null);
    setToolExecutionDetails(null);

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
      // Make initial request
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

      // Check if Claude wants to use tools
      if (data.stop_reason === 'tool_use' && tools.length > 0) {
        setToolExecutionStatus('Executing tools...');

        // Extract tool use blocks
        const toolUseBlocks = data.content.filter(block => block.type === 'tool_use');

        // Execute each tool and create tool_result blocks
        const executionDetails = [];
        const toolResults = toolUseBlocks.map(toolUse => {
          const result = executeTool(toolUse.name, toolUse.input);

          // Store execution details for display
          executionDetails.push({
            tool_name: toolUse.name,
            tool_input: toolUse.input,
            tool_result: result
          });

          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          };
        });

        // Store tool execution details
        setToolExecutionDetails(executionDetails);

        // Prepare the follow-up request with tool results
        const followUpMessages = [
          ...messagesWithImages,
          {
            role: 'assistant',
            content: data.content
          },
          {
            role: 'user',
            content: toolResults
          }
        ];

        const followUpBody = {
          model,
          messages: followUpMessages,
          max_tokens: maxTokens,
        };

        if (system) followUpBody.system = system;
        if (temperature !== 1.0) followUpBody.temperature = temperature;
        if (topP !== 1.0) followUpBody.top_p = topP;
        if (topK !== 0) followUpBody.top_k = topK;
        if (tools.length > 0) followUpBody.tools = tools;

        setToolExecutionStatus('Getting final response...');

        // Make follow-up request
        const followUpRes = await fetch('http://localhost:3001/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(followUpBody),
        });

        if (!followUpRes.ok) {
          const errorData = await followUpRes.json();
          throw new Error(errorData.error?.message || `Follow-up request failed with status ${followUpRes.status}`);
        }

        const finalData = await followUpRes.json();
        setResponse(finalData);
        setToolExecutionStatus(null);

        // Save the final response to history
        storage.saveToHistory(requestBody, finalData);
        setHistory(storage.getHistory());
      } else {
        // No tool use, just set the response
        setResponse(data);

        // Save to history
        storage.saveToHistory(requestBody, data);
        setHistory(storage.getHistory());
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while processing your request');
      setToolExecutionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Models API handler
  const handleListModels = async (queryParams = {}) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    setModelsLoading(true);
    setError(null);

    // Build query string
    const params = new URLSearchParams();
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.before_id) params.append('before_id', queryParams.before_id);
    if (queryParams.after_id) params.append('after_id', queryParams.after_id);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`http://localhost:3001/v1/models${queryString}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setModelsList(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching models');
    } finally {
      setModelsLoading(false);
    }
  };

  // Usage API handler
  const handleGetUsageReport = async (queryParams = {}) => {
    if (!apiKey) {
      setError('Please provide an Admin API key');
      return;
    }

    if (!queryParams.starting_at || !queryParams.ending_at || !queryParams.bucket_width) {
      setError('starting_at, ending_at, and bucket_width are required parameters');
      return;
    }

    setUsageLoading(true);
    setError(null);

    // Build query string
    const params = new URLSearchParams();
    params.append('starting_at', queryParams.starting_at);
    params.append('ending_at', queryParams.ending_at);
    params.append('bucket_width', queryParams.bucket_width);

    // Optional array parameters
    if (queryParams.models && queryParams.models.length > 0) {
      queryParams.models.forEach(m => params.append('models[]', m));
    }
    if (queryParams.service_tiers && queryParams.service_tiers.length > 0) {
      queryParams.service_tiers.forEach(st => params.append('service_tiers[]', st));
    }
    if (queryParams.workspace_ids && queryParams.workspace_ids.length > 0) {
      queryParams.workspace_ids.forEach(w => params.append('workspace_ids[]', w));
    }
    if (queryParams.group_by && queryParams.group_by.length > 0) {
      queryParams.group_by.forEach(g => params.append('group_by[]', g));
    }

    // Optional scalar parameters
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.page) params.append('page', queryParams.page);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`http://localhost:3001/v1/organizations/usage_report/messages${queryString}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setUsageReport(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching usage report');
    } finally {
      setUsageLoading(false);
    }
  };

  // Cost API handler
  const handleGetCostReport = async (queryParams = {}) => {
    if (!apiKey) {
      setError('Please provide an Admin API key');
      return;
    }

    if (!queryParams.starting_at || !queryParams.ending_at) {
      setError('starting_at and ending_at are required parameters');
      return;
    }

    setCostLoading(true);
    setError(null);

    // Build query string
    const params = new URLSearchParams();
    params.append('starting_at', queryParams.starting_at);
    params.append('ending_at', queryParams.ending_at);

    // Optional array parameters
    if (queryParams.group_by && queryParams.group_by.length > 0) {
      queryParams.group_by.forEach(g => params.append('group_by[]', g));
    }

    // Optional scalar parameters
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.page) params.append('page', queryParams.page);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`http://localhost:3001/v1/organizations/cost_report${queryString}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setCostReport(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching cost report');
    } finally {
      setCostLoading(false);
    }
  };

  // Batches API handlers
  const handleCreateBatch = async () => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    // Validate batch requests
    const hasValidRequests = batchRequests.some(req =>
      req.custom_id &&
      req.params.messages &&
      req.params.messages.some(msg => msg.content.trim().length > 0)
    );

    if (!batchRequests.length || !hasValidRequests) {
      setError('Please provide at least one valid batch request');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setBatchStatus(null);

    const requestBody = {
      requests: batchRequests.filter(req =>
        req.custom_id &&
        req.params.messages &&
        req.params.messages.some(msg => msg.content.trim().length > 0)
      )
    };

    try {
      const res = await fetch('http://localhost:3001/v1/messages/batches', {
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
      setBatchStatus(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while creating the batch');
    } finally {
      setLoading(false);
    }
  };

  const handleGetBatchStatus = async (batchId) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!batchId) {
      setError('Please provide a batch ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:3001/v1/messages/batches/${batchId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setBatchStatus(data);

      // If batch is complete and has results_url, fetch the results
      if (data.processing_status === 'ended' && data.results_url) {
        // Note: results_url is a signed URL that returns .jsonl format
        // We'll let the user download it or fetch it separately
        setBatchResults(data);
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching batch status');
    } finally {
      setLoading(false);
    }
  };

  const clearApiKey = () => {
    storage.clearApiKey();
    setApiKey('');
  };

  const clearConfiguration = () => {
    // Reset to default values
    setMessages([{ role: 'user', content: '' }]);
    setSystem('');
    setTools([]);
    setImages([]);
    setResponse(null);
    setError(null);
    setToolExecutionDetails(null);
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
    clearConfiguration,

    // Endpoint selection
    selectedEndpoint,
    setSelectedEndpoint,
    endpoints,

    // Configuration (Messages API)
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

    // Batches API
    batchRequests,
    setBatchRequests,
    batchStatus,
    setBatchStatus,
    batchResults,
    setBatchResults,
    handleCreateBatch,
    handleGetBatchStatus,

    // Models API
    modelsList,
    setModelsList,
    modelsLoading,
    handleListModels,

    // Usage API
    usageReport,
    setUsageReport,
    usageLoading,
    handleGetUsageReport,

    // Cost API
    costReport,
    setCostReport,
    costLoading,
    handleGetCostReport,

    // Response
    response,
    loading,
    error,
    streamingText,
    toolExecutionStatus,
    toolExecutionDetails,
    handleSendRequest,

    // History
    history,
    loadFromHistory,
    clearHistory,
    deleteHistoryItem,
    exportHistory,
  }), [
    apiKey, persistKey,
    selectedEndpoint,
    model, messages, system, maxTokens, temperature, topP, topK, stream,
    tools, images,
    batchRequests, batchStatus, batchResults,
    modelsList, modelsLoading,
    usageReport, usageLoading,
    costReport, costLoading,
    response, loading, error, streamingText, toolExecutionStatus, toolExecutionDetails,
    history
  ]);

  return html`<${AppContext.Provider} value=${value}>${children}</${AppContext.Provider}>`;
}
