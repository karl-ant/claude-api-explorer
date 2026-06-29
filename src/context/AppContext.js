import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { storage } from '../utils/localStorage.js';
import modelsConfig, {
  supportsAdaptiveThinking,
  manualThinkingBlocked,
  supportsXhigh,
  supportsFastMode,
  modelNamesSupporting
} from '../config/models.js';
import endpoints from '../config/endpoints.js';
import { extractMessageText } from '../utils/formatters.js';

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
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [messages, setMessages] = useState([{ role: 'user', content: '' }]);
  const [system, setSystem] = useState('');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.99);
  const [topK, setTopK] = useState(0);

  // Advanced features
  const [tools, setTools] = useState([]);
  const [images, setImages] = useState([]);

  // Beta headers and Skills
  const [betaHeaders, setBetaHeaders] = useState(storage.getBetaHeaders());
  const [skillsJson, setSkillsJson] = useState(storage.getSkillsJson());

  // Streaming
  const [streaming, setStreaming] = useState(storage.get('streaming') || false);

  // Thinking / Adaptive Thinking
  const [thinkingEnabled, setThinkingEnabled] = useState(storage.get('thinkingEnabled') || false);
  const [thinkingType, setThinkingType] = useState(storage.get('thinkingType') || 'adaptive');
  const [budgetTokens, setBudgetTokens] = useState(storage.get('budgetTokens') || 10000);
  const [effortLevel, setEffortLevel] = useState(storage.get('effortLevel') || 'high');
  // Coerce stale persisted values (older versions allowed 'full') to a valid one
  const [thinkingDisplay, setThinkingDisplay] = useState(() => {
    const stored = storage.get('thinkingDisplay');
    return ['summarized', 'omitted'].includes(stored) ? stored : 'summarized';
  });

  const [speedMode, setSpeedMode] = useState(storage.get('speedMode') || false);
  const [cacheControl, setCacheControl] = useState(storage.get('cacheControl') || false);

  // Cache diagnostics (cache-diagnosis beta) — session-only, not persisted
  const [previousMessageId, setPreviousMessageId] = useState('');

  // Structured Outputs
  const [structuredOutput, setStructuredOutput] = useState(false);
  const [outputSchema, setOutputSchema] = useState('');

  // Conversation mode
  const [conversationMode, setConversationMode] = useState(storage.getConversationMode());
  const [conversationHistory, setConversationHistory] = useState([]);

  // Endpoint-specific state
  // Models API (powers the live model metadata in ModelSelector)
  const [modelsList, setModelsList] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Skills API
  const [skillsList, setSkillsList] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillDetail, setSkillDetail] = useState(null);
  const [skillsSourceFilter, setSkillsSourceFilter] = useState('custom');
  const [skillVersions, setSkillVersions] = useState(null);

  // Files API
  const [filesList, setFilesList] = useState(null);
  const [fileDetail, setFileDetail] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);

  // Token Count
  const [tokenCount, setTokenCount] = useState(null);
  const [tokenCountLoading, setTokenCountLoading] = useState(false);
  const [tokenCountStale, setTokenCountStale] = useState(false);

  // Response state
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  // History
  const [history, setHistory] = useState(storage.getHistory());

  const [lastRequest, setLastRequest] = useState(null);

  // Internal mode (session-only, NOT persisted)
  const [internalMode, setInternalMode] = useState(false);
  const [customModelId, setCustomModelId] = useState('');

  // Update API key in storage when it changes
  useEffect(() => {
    if (apiKey) {
      storage.saveApiKey(apiKey, persistKey);
    }
  }, [apiKey, persistKey]);

  useEffect(() => {
    storage.saveBetaHeaders(betaHeaders);
  }, [betaHeaders]);

  useEffect(() => {
    storage.saveSkillsJson(skillsJson);
  }, [skillsJson]);

  useEffect(() => {
    storage.set('streaming', streaming);
  }, [streaming]);

  useEffect(() => {
    storage.set('thinkingEnabled', thinkingEnabled);
  }, [thinkingEnabled]);

  useEffect(() => {
    storage.set('thinkingType', thinkingType);
  }, [thinkingType]);

  useEffect(() => {
    storage.set('budgetTokens', budgetTokens);
  }, [budgetTokens]);

  useEffect(() => {
    storage.set('effortLevel', effortLevel);
  }, [effortLevel]);

  useEffect(() => {
    storage.set('thinkingDisplay', thinkingDisplay);
  }, [thinkingDisplay]);

  useEffect(() => {
    storage.set('speedMode', speedMode);
  }, [speedMode]);

  useEffect(() => {
    storage.set('cacheControl', cacheControl);
  }, [cacheControl]);

  useEffect(() => {
    storage.saveConversationMode(conversationMode);
  }, [conversationMode]);

  // Load last configuration on mount (and drop keys persisted by removed features)
  useEffect(() => {
    storage.cleanupLegacyKeys();
    const lastConfig = storage.getLastConfig();
    if (lastConfig) {
      if (lastConfig.model) setModel(lastConfig.model);
      if (lastConfig.maxTokens) setMaxTokens(lastConfig.maxTokens);
      if (lastConfig.temperature !== undefined) setTemperature(lastConfig.temperature);
      if (lastConfig.topP !== undefined) setTopP(lastConfig.topP);
      if (lastConfig.topK !== undefined) setTopK(lastConfig.topK);
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
      system,
      tools
    });
  }, [model, maxTokens, temperature, topP, topK, system, tools]);

  // Mark token count as stale when relevant config changes
  useEffect(() => {
    if (tokenCount !== null) {
      setTokenCountStale(true);
    }
  }, [messages, system, tools, images, model]);

  // Auto-fetch models when API key is set
  useEffect(() => {
    if (apiKey && !modelsList && !modelsLoading) {
      handleListModels({ limit: 100 });
    }
    // Effect intentionally only depends on apiKey - we want to fetch models
    // once when API key is provided, not re-run when modelsList/modelsLoading change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Build the exact Messages request (body + beta headers) from the current
  // configuration. Pure — no state updates. handleSendRequest sends it and
  // ConfigPanel's "Copy as cURL" formats it, so the two can never drift.
  const buildMessagesRequest = (overrideConversationHistory = null) => {
    // In conversation mode, build messages from conversationHistory
    let messagesToSend = messages;
    const historyToUse = overrideConversationHistory || conversationHistory;
    if (conversationMode && historyToUse.length > 0) {
      messagesToSend = historyToUse.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // Integrate images into the first user message if images exist
    const messagesWithImages = images.length > 0 ? messagesToSend.map((msg, idx) => {
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
    }) : messagesToSend;

    const effectiveModel = (internalMode && customModelId.trim())
      ? customModelId.trim()
      : model;

    const requestBody = {
      model: effectiveModel,
      messages: messagesWithImages,
      max_tokens: maxTokens,
    };

    if (system) requestBody.system = system;
    if (temperature !== 1.0) requestBody.temperature = temperature;
    if (topP !== 0.99) requestBody.top_p = topP;
    if (topK !== 0) requestBody.top_k = topK;
    if (tools.length > 0) requestBody.tools = [...tools];

    if (speedMode) {
      requestBody.speed = 'fast';
    }

    if (cacheControl) {
      requestBody.cache_control = { type: 'ephemeral' };
    }

    // Add thinking configuration
    if (thinkingEnabled) {
      if (thinkingType === 'adaptive') {
        requestBody.thinking = { type: 'adaptive' };
        requestBody.output_config = { effort: effortLevel };
      } else {
        requestBody.thinking = { type: 'enabled', budget_tokens: budgetTokens };
      }
      if (thinkingDisplay === 'omitted' || thinkingDisplay === 'summarized') {
        requestBody.thinking.display = thinkingDisplay;
      }
      if (manualThinkingBlocked(effectiveModel)) {
        // Adaptive-only models (Fable 5, Opus 4.8/4.7) reject non-default
        // sampling params outright — never send temperature alongside thinking.
        delete requestBody.temperature;
      } else {
        // Extended thinking requires temperature = 1
        requestBody.temperature = 1;
      }
    }

    // Add structured output configuration
    if (structuredOutput && outputSchema.trim()) {
      try {
        const parsedSchema = JSON.parse(outputSchema);
        requestBody.output_config = {
          ...(requestBody.output_config || {}),
          format: { type: 'json_schema', json_schema: parsedSchema }
        };
      } catch (e) {
        // Invalid schema JSON, skip
      }
    }

    // Add container.skills if skillsJson is valid
    if (skillsJson.trim()) {
      try {
        const parsedSkills = JSON.parse(skillsJson);
        if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
          requestBody.container = { skills: parsedSkills };
          // Auto-inject code_execution tool (required for container skills)
          if (!requestBody.tools) {
            requestBody.tools = [];
          }
          const hasCodeExecution = requestBody.tools.some(t => t.type?.startsWith('code_execution'));
          if (!hasCodeExecution) {
            requestBody.tools.push({ type: 'code_execution_20260521', name: 'code_execution' });
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Cache diagnostics: when the beta header is on, always send diagnostics.
    // The first turn opts in with previous_message_id: null; later turns pass
    // the previous response id and the API reports cache_miss_reason.
    if (betaHeaders.includes('cache-diagnosis-2026-04-07')) {
      requestBody.diagnostics = { previous_message_id: previousMessageId.trim() || null };
    }

    // Some features require a beta header in addition to a body field — merge those in
    const betaHeadersForRequest = [...betaHeaders];
    if (speedMode && !betaHeadersForRequest.includes('fast-mode-2026-02-01')) {
      betaHeadersForRequest.push('fast-mode-2026-02-01');
    }
    const hasAdvisorTool = (requestBody.tools || []).some(t => typeof t.type === 'string' && t.type.startsWith('advisor_'));
    if (hasAdvisorTool && !betaHeadersForRequest.includes('advisor-tool-2026-03-01')) {
      betaHeadersForRequest.push('advisor-tool-2026-03-01');
    }

    return { requestBody, betaHeaders: betaHeadersForRequest, effectiveModel };
  };

  const handleSendRequest = async (overrideConversationHistory = null) => {
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

    const historyToUse = overrideConversationHistory || conversationHistory;
    const { requestBody, betaHeaders: betaHeadersForRequest, effectiveModel } =
      buildMessagesRequest(overrideConversationHistory);

    // Model-capability pre-flight guards — these requests 400 at the API otherwise.
    // Driven by the capability matrix in config/models.js. Unknown model IDs
    // (Internal Model Mode, or models newer than the catalog) are never blocked.
    if (thinkingEnabled && thinkingType === 'enabled' && manualThinkingBlocked(effectiveModel)) {
      setError(`${effectiveModel} supports adaptive thinking only — manual thinking budgets return a 400. Switch the thinking type to "Adaptive" or choose a different model.`);
      setLoading(false);
      return;
    }
    if (thinkingEnabled && thinkingType === 'adaptive' && !supportsAdaptiveThinking(effectiveModel)) {
      setError(`Adaptive thinking is not supported on ${effectiveModel}. Switch the thinking type to "Manual budget" or choose an adaptive-thinking model (${modelNamesSupporting('adaptiveThinking')}).`);
      setLoading(false);
      return;
    }
    if (thinkingEnabled && thinkingType === 'adaptive' && effortLevel === 'xhigh' && !supportsXhigh(effectiveModel)) {
      setError(`effort: "xhigh" is only available on ${modelNamesSupporting('xhighEffort')}. Choose a lower effort level or switch models.`);
      setLoading(false);
      return;
    }
    if (speedMode && !supportsFastMode(effectiveModel)) {
      setError(`Fast Mode (speed: "fast") is only supported on ${modelNamesSupporting('fastMode')}. Disable Fast Mode or switch models.`);
      setLoading(false);
      return;
    }

    try {
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      if (betaHeadersForRequest.length > 0) {
        headers['anthropic-beta'] = betaHeadersForRequest.join(',');
      }

      const requestUrl = streaming
        ? 'https://api.anthropic.com/v1/messages (stream)'
        : 'https://api.anthropic.com/v1/messages';
      const requestSnapshot = {
        url: requestUrl,
        method: 'POST',
        headers: { ...headers, 'x-api-key': '***redacted***' },
        body: requestBody,
        timestamp: Date.now(),
        durationMs: null,
      };
      setLastRequest(requestSnapshot);

      // Streaming branch
      if (streaming) {
        const res = await fetch('http://localhost:3002/v1/messages/stream', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || `Streaming request failed with status ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';
        let accumulatedThinking = '';
        let finalMessage = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              // Event type line — handled via data parsing
            } else if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const event = JSON.parse(jsonStr);
                switch (event.type) {
                  case 'message_start':
                    finalMessage = event.message;
                    break;
                  case 'content_block_delta':
                    if (event.delta?.type === 'text_delta') {
                      accumulatedText += event.delta.text;
                      setStreamingText(accumulatedText);
                    } else if (event.delta?.type === 'thinking_delta') {
                      accumulatedThinking += event.delta.thinking;
                    } else if (event.delta?.type === 'input_json_delta') {
                      // Tool input streaming — accumulate for later
                    }
                    break;
                  case 'message_delta':
                    if (finalMessage) {
                      finalMessage.stop_reason = event.delta?.stop_reason;
                      if (event.usage) {
                        finalMessage.usage = { ...finalMessage.usage, ...event.usage };
                      }
                    }
                    break;
                  case 'message_stop':
                    // Stream complete
                    break;
                }
              } catch (e) {
                // Skip unparseable lines
              }
            }
          }
        }

        // Build final response object
        if (finalMessage) {
          // Reconstruct content from accumulated text
          const content = [];
          if (accumulatedThinking) {
            content.push({ type: 'thinking', thinking: accumulatedThinking });
          }
          if (accumulatedText) {
            content.push({ type: 'text', text: accumulatedText });
          }
          finalMessage.content = content.length > 0 ? content : finalMessage.content;
          setResponse(finalMessage);
          // Track the last response id so cache diagnostics can chain turns
          if (finalMessage.id) setPreviousMessageId(finalMessage.id);

          // Handle conversation mode for streamed responses
          let updatedConversationHistory = historyToUse;
          if (conversationMode) {
            const textContent = accumulatedText;
            if (textContent && textContent.trim()) {
              const assistantMessage = {
                role: 'assistant',
                content: finalMessage.content,
                timestamp: Date.now(),
                id: `msg-${Date.now()}`
              };
              updatedConversationHistory = [...historyToUse, assistantMessage];
              setConversationHistory(updatedConversationHistory);
              setMessages(prev => [...prev, { role: 'assistant', content: finalMessage.content }]);
            }
          }

          storage.saveToHistory(requestBody, finalMessage, {
            isConversation: conversationMode,
            conversationHistory: updatedConversationHistory
          });
          setHistory(storage.getHistory());
        }

        setStreamingText('');
        setLoading(false);
        return;
      }

      // Non-streaming request
      const res = await fetch('http://localhost:3002/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      // Track the last response id so cache diagnostics can chain turns
      if (data.id) setPreviousMessageId(data.id);

      // Tools are either server-side (Anthropic executes them) or user-defined
      // definitions for inspection. There is no client-side execution: a
      // stop_reason of "tool_use" simply ends the turn and is displayed as-is.

      // Conversation mode: append assistant response
      let updatedConversationHistory = historyToUse;
      if (conversationMode) {
        // Extract text content and check if it's not empty
        const textContent = extractMessageText(data.content);

        // Skip the append when the turn contains tool_use blocks (whatever the
        // stop_reason — e.g. max_tokens can truncate mid tool call): with no
        // tool_result to pair them with, the next request would fail validation.
        const hasToolUse = Array.isArray(data.content) && data.content.some(b => b.type === 'tool_use');
        if (!hasToolUse && textContent && textContent.trim()) {
          const assistantMessage = {
            role: 'assistant',
            content: data.content,
            timestamp: Date.now(),
            id: `msg-${Date.now()}`
          };
          updatedConversationHistory = [...historyToUse, assistantMessage];
          setConversationHistory(updatedConversationHistory);

          // Update messages array for next API call
          setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        }
      }

      // Save to history
      storage.saveToHistory(requestBody, data, {
        isConversation: conversationMode,
        conversationHistory: updatedConversationHistory
      });
      setHistory(storage.getHistory());
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while processing your request');
    } finally {
      setStreamingText('');
      setLoading(false);
      setLastRequest(prev => prev ? { ...prev, durationMs: Date.now() - prev.timestamp } : prev);
    }
  };

  // Token Count handler
  const handleCountTokens = async () => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    const hasValidContent = messages.some(msg => {
      if (typeof msg.content === 'string') return msg.content.trim().length > 0;
      if (Array.isArray(msg.content)) return msg.content.length > 0;
      return false;
    });

    if (!messages.length || !hasValidContent) {
      setError('Please provide at least one message with content');
      return;
    }

    setTokenCountLoading(true);
    setError(null);

    // Integrate images into first user message (same logic as handleSendRequest)
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

    const requestBody = { model, messages: messagesWithImages };
    if (system) requestBody.system = system;
    if (tools.length > 0) requestBody.tools = tools;
    // Note: Token counting API doesn't support container.skills or beta headers

    try {
      const countHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      if (betaHeaders.length > 0) {
        countHeaders['anthropic-beta'] = betaHeaders.join(',');
      }

      const res = await fetch('http://localhost:3002/v1/messages/count_tokens', {
        method: 'POST',
        headers: countHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `Token count failed`);
      }

      const data = await res.json();
      setTokenCount(data.input_tokens);
      setTokenCountStale(false);
    } catch (err) {
      console.error('Token Count Error:', err);
      setError(err.message || 'Failed to count tokens');
    } finally {
      setTokenCountLoading(false);
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
      const res = await fetch(`http://localhost:3002/v1/models${queryString}`, {
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

  // Skills API handlers
  const SKILLS_BETA_HEADER = 'skills-2025-10-02';

  const handleListSkills = async (queryParams = {}) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    setSkillsLoading(true);
    setError(null);
    setSkillDetail(null);

    // Build query string
    const params = new URLSearchParams();
    if (queryParams.source) params.append('source', queryParams.source);
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.page) params.append('page', queryParams.page);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`http://localhost:3002/v1/skills${queryString}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSkillsList(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching skills');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleCreateSkill = async (files, skillName, displayTitle = '') => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!files || files.length === 0) {
      setError('Please provide at least one file');
      return;
    }

    // Validate SKILL.md is present
    const hasSkillMd = files.some(f => f.name === 'SKILL.md');
    if (!hasSkillMd) {
      setError('A SKILL.md file is required');
      return;
    }

    // Validate we have relative paths (from folder selection)
    const hasRelativePaths = files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
    if (!hasRelativePaths) {
      setError('Please select a skill folder, not individual files');
      return;
    }

    setSkillsLoading(true);
    setError(null);
    setSkillDetail(null);

    try {
      const formData = new FormData();
      if (displayTitle) {
        formData.append('display_title', displayTitle);
      }
      // Send files and their relative paths (e.g., "my-skill/SKILL.md")
      const relativePaths = files.map(file => file.webkitRelativePath || file.name);
      formData.append('file_paths', JSON.stringify(relativePaths));
      files.forEach(file => {
        formData.append('files[]', file);
      });

      const res = await fetch('http://localhost:3002/v1/skills', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSkillDetail(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while creating the skill');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleGetSkill = async (skillId) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!skillId) {
      setError('Please provide a skill ID');
      return;
    }

    setSkillsLoading(true);
    setError(null);
    setSkillsList(null); // Clear list so detail view shows

    try {
      const res = await fetch(`http://localhost:3002/v1/skills/${encodeURIComponent(skillId)}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSkillDetail(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while fetching skill details');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!skillId) {
      setError('Please provide a skill ID');
      return;
    }

    setSkillsLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/skills/${encodeURIComponent(skillId)}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSkillDetail(data);
      setResponse(data);
      // Clear skills list to force refresh
      setSkillsList(null);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while deleting the skill');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleListVersions = async (skillId) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!skillId) {
      setError('Please provide a skill ID');
      return;
    }

    setSkillsLoading(true);
    setError(null);
    setSkillVersions(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/skills/${encodeURIComponent(skillId)}/versions`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSkillVersions(data);
      setResponse(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while listing versions');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleDeleteVersion = async (skillId, versionId) => {
    if (!apiKey) {
      setError('Please provide an API key');
      return;
    }

    if (!skillId || !versionId) {
      setError('Please provide both skill ID and version ID');
      return;
    }

    setSkillsLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/skills/${encodeURIComponent(skillId)}/versions/${encodeURIComponent(versionId)}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': SKILLS_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      // Refresh versions list
      await handleListVersions(skillId);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'An error occurred while deleting the version');
    } finally {
      setSkillsLoading(false);
    }
  };

  // Files API handlers
  const FILES_BETA_HEADER = 'files-api-2025-04-14';

  const handleListFiles = async (queryParams = {}) => {
    if (!apiKey) {
      setFilesError('Please provide an API key');
      return;
    }

    setFilesLoading(true);
    setFilesError(null);
    setFileDetail(null);

    const params = new URLSearchParams();
    if (queryParams.limit) params.append('limit', queryParams.limit);
    if (queryParams.before_id) params.append('before_id', queryParams.before_id);
    if (queryParams.after_id) params.append('after_id', queryParams.after_id);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`http://localhost:3002/v1/files${queryString}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': FILES_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setFilesList(data);
      setResponse(data);
    } catch (err) {
      console.error('Files API Error:', err);
      setFilesError(err.message || 'An error occurred while listing files');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleUploadFile = async (file) => {
    if (!apiKey) {
      setFilesError('Please provide an API key');
      return;
    }
    if (!file) {
      setFilesError('Please choose a file to upload');
      return;
    }

    setFilesLoading(true);
    setFilesError(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const res = await fetch('http://localhost:3002/v1/files', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': FILES_BETA_HEADER,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setFileDetail(data);
      setResponse(data);
      // Refresh the list so the new file shows up
      await handleListFiles();
    } catch (err) {
      console.error('Files API Error:', err);
      setFilesError(err.message || 'An error occurred while uploading the file');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleGetFile = async (fileId) => {
    if (!apiKey) {
      setFilesError('Please provide an API key');
      return;
    }
    if (!fileId) {
      setFilesError('Please provide a file ID');
      return;
    }

    setFilesLoading(true);
    setFilesError(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/files/${encodeURIComponent(fileId)}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': FILES_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setFileDetail(data);
      setFilesList(null);
      setResponse(data);
    } catch (err) {
      console.error('Files API Error:', err);
      setFilesError(err.message || 'An error occurred while fetching file metadata');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!apiKey) {
      setFilesError('Please provide an API key');
      return;
    }
    if (!fileId) {
      setFilesError('Please provide a file ID');
      return;
    }

    setFilesLoading(true);
    setFilesError(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': FILES_BETA_HEADER,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setFileDetail(null);
      // Refresh the list
      await handleListFiles();
    } catch (err) {
      console.error('Files API Error:', err);
      setFilesError(err.message || 'An error occurred while deleting the file');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleDownloadFile = async (fileId, filename = 'download') => {
    if (!apiKey) {
      setFilesError('Please provide an API key');
      return;
    }
    if (!fileId) {
      setFilesError('Please provide a file ID');
      return;
    }

    setFilesError(null);

    try {
      const res = await fetch(`http://localhost:3002/v1/files/${encodeURIComponent(fileId)}/content`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': FILES_BETA_HEADER,
        },
      });

      if (!res.ok) {
        let message = `Download failed with status ${res.status}`;
        try {
          const errorData = await res.json();
          message = errorData.error?.message || errorData.error || message;
        } catch (e) { /* non-JSON error body */ }
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Files API Error:', err);
      setFilesError(err.message || 'An error occurred while downloading the file');
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
    setBetaHeaders([]);
    setSkillsJson('');
    setPreviousMessageId('');
    setResponse(null);
    setError(null);
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
    if (request.tools) setTools(storage.upgradeServerToolTypes(request.tools));
    if (request.container?.skills) {
      setSkillsJson(JSON.stringify(request.container.skills, null, 2));
    }
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

  const continueConversation = (historyItem) => {
    // Load the conversation state
    loadFromHistory(historyItem);

    // Enable conversation mode
    setConversationMode(true);

    // Restore conversation history
    if (historyItem.conversationHistory) {
      setConversationHistory(historyItem.conversationHistory);
    } else {
      // Build from request/response if no conversationHistory saved
      const rebuiltHistory = [];
      historyItem.request.messages?.forEach(msg => {
        rebuiltHistory.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : msg.content,
          timestamp: Date.now(),
          id: `msg-${Date.now()}-${Math.random()}`
        });
      });
      if (historyItem.response?.content) {
        rebuiltHistory.push({
          role: 'assistant',
          content: historyItem.response.content,
          timestamp: Date.now(),
          id: `msg-${Date.now()}-resp`
        });
      }
      setConversationHistory(rebuiltHistory);
    }
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

    // Advanced features
    tools,
    setTools,
    images,
    setImages,

    // Beta headers and Skills
    betaHeaders,
    setBetaHeaders,
    skillsJson,
    setSkillsJson,

    // Streaming
    streaming,
    setStreaming,

    // Thinking
    thinkingEnabled,
    setThinkingEnabled,
    thinkingType,
    setThinkingType,
    budgetTokens,
    setBudgetTokens,
    effortLevel,
    setEffortLevel,
    thinkingDisplay,
    setThinkingDisplay,

    // Speed / Caching
    speedMode,
    setSpeedMode,
    cacheControl,
    setCacheControl,

    // Cache diagnostics
    previousMessageId,
    setPreviousMessageId,

    lastRequest,

    // Internal mode (session-only)
    internalMode,
    setInternalMode,
    customModelId,
    setCustomModelId,

    // Structured Outputs
    structuredOutput,
    setStructuredOutput,
    outputSchema,
    setOutputSchema,

    // Conversation mode
    conversationMode,
    setConversationMode,
    conversationHistory,
    setConversationHistory,

    // Models API (live model metadata for ModelSelector)
    modelsList,
    modelsLoading,

    // Skills API
    skillsList,
    setSkillsList,
    skillsLoading,
    skillDetail,
    setSkillDetail,
    skillsSourceFilter,
    setSkillsSourceFilter,
    handleListSkills,
    handleCreateSkill,
    handleGetSkill,
    handleDeleteSkill,
    skillVersions,
    setSkillVersions,
    handleListVersions,
    handleDeleteVersion,

    // Files API
    filesList,
    setFilesList,
    fileDetail,
    setFileDetail,
    filesLoading,
    filesError,
    handleListFiles,
    handleUploadFile,
    handleGetFile,
    handleDeleteFile,
    handleDownloadFile,

    // Token Count
    tokenCount,
    setTokenCount,
    tokenCountLoading,
    tokenCountStale,
    handleCountTokens,

    // Response
    response,
    loading,
    error,
    streamingText,
    handleSendRequest,
    buildMessagesRequest,

    // History
    history,
    loadFromHistory,
    clearHistory,
    deleteHistoryItem,
    exportHistory,
    continueConversation,
  }), [
    apiKey, persistKey,
    selectedEndpoint,
    model, messages, system, maxTokens, temperature, topP, topK,
    tools, images,
    betaHeaders, skillsJson,
    streaming,
    thinkingEnabled, thinkingType, budgetTokens, effortLevel, thinkingDisplay,
    speedMode, cacheControl, previousMessageId,
    lastRequest,
    internalMode, customModelId,
    structuredOutput, outputSchema,
    conversationMode, conversationHistory,
    modelsList, modelsLoading,
    skillsList, skillsLoading, skillDetail, skillsSourceFilter, skillVersions,
    filesList, fileDetail, filesLoading, filesError,
    tokenCount, tokenCountLoading, tokenCountStale,
    response, loading, error, streamingText,
    history
  ]);

  return html`<${AppContext.Provider} value=${value}>${children}</${AppContext.Provider}>`;
}
