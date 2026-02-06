import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { storage } from '../utils/localStorage.js';
import { executeTool } from '../utils/toolExecutors/index.js';
import { TOOL_MODES } from '../config/toolConfig.js';
import modelsConfig from '../config/models.js';
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
  const [model, setModel] = useState('claude-sonnet-4-5-20250929');
  const [messages, setMessages] = useState([{ role: 'user', content: '' }]);
  const [system, setSystem] = useState('');
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.99);
  const [topK, setTopK] = useState(0);

  // Advanced features
  const [tools, setTools] = useState([]);
  const [images, setImages] = useState([]);

  // Tool execution mode and API keys
  const [toolMode, setToolMode] = useState(storage.getToolMode() || TOOL_MODES.DEMO);
  const [toolApiKeys, setToolApiKeys] = useState(storage.getToolApiKeys() || {});

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

  // Structured Outputs
  const [structuredOutput, setStructuredOutput] = useState(false);
  const [outputSchema, setOutputSchema] = useState('');

  // Conversation mode
  const [conversationMode, setConversationMode] = useState(storage.getConversationMode());
  const [conversationHistory, setConversationHistory] = useState([]);

  // Endpoint-specific state
  // Batches API
  const [batchRequests, setBatchRequests] = useState([{ custom_id: '', params: { model: 'claude-sonnet-4-5-20250929', messages: [{ role: 'user', content: '' }], max_tokens: 4096 } }]);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchResultsData, setBatchResultsData] = useState(null);
  const [batchResultsLoading, setBatchResultsLoading] = useState(false);
  const [batchResultsError, setBatchResultsError] = useState(null);

  // Models API
  const [modelsList, setModelsList] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Usage API
  const [usageReport, setUsageReport] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // Cost API
  const [costReport, setCostReport] = useState(null);
  const [costLoading, setCostLoading] = useState(false);

  // Skills API
  const [skillsList, setSkillsList] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillDetail, setSkillDetail] = useState(null);
  const [skillsSourceFilter, setSkillsSourceFilter] = useState('custom');
  const [skillVersions, setSkillVersions] = useState(null);

  // Token Count
  const [tokenCount, setTokenCount] = useState(null);
  const [tokenCountLoading, setTokenCountLoading] = useState(false);
  const [tokenCountStale, setTokenCountStale] = useState(false);

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

  // Persist tool mode and API keys
  useEffect(() => {
    storage.saveToolMode(toolMode);
  }, [toolMode]);

  useEffect(() => {
    storage.saveToolApiKeys(toolApiKeys);
  }, [toolApiKeys]);

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
    storage.saveConversationMode(conversationMode);
  }, [conversationMode]);

  // Load last configuration on mount
  useEffect(() => {
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
    setToolExecutionStatus(null);
    setToolExecutionDetails(null);

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

    const requestBody = {
      model,
      messages: messagesWithImages,
      max_tokens: maxTokens,
    };

    // Debug logging for conversation mode
    if (conversationMode) {
    }

    if (system) requestBody.system = system;
    if (temperature !== 1.0) requestBody.temperature = temperature;
    if (topP !== 0.99) requestBody.top_p = topP;
    if (topK !== 0) requestBody.top_k = topK;
    if (tools.length > 0) requestBody.tools = [...tools];

    // Add thinking configuration
    if (thinkingEnabled) {
      if (thinkingType === 'adaptive') {
        requestBody.thinking = { type: 'adaptive' };
        requestBody.output_config = { effort: effortLevel };
      } else {
        requestBody.thinking = { type: 'enabled', budget_tokens: budgetTokens };
      }
      // Extended thinking requires temperature = 1
      requestBody.temperature = 1;
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
            requestBody.tools.push({ type: 'code_execution_20250825', name: 'code_execution' });
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    try {
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      if (betaHeaders.length > 0) {
        headers['anthropic-beta'] = betaHeaders.join(',');
      }

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
        let currentBlockType = null;

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
                  case 'content_block_start':
                    currentBlockType = event.content_block?.type;
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
                  case 'content_block_stop':
                    currentBlockType = null;
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

      // Check if Claude wants to use tools
      // Note: code_execution is a server-side tool that Claude executes automatically
      // We only need to handle client-side tools here
      if (data.stop_reason === 'tool_use' && tools.length > 0) {
        setToolExecutionStatus('Executing tools...');

        // Extract tool use blocks, excluding server-side tools like code_execution
        const serverSideTools = ['code_execution'];
        const toolUseBlocks = data.content.filter(
          block => block.type === 'tool_use' && !serverSideTools.includes(block.name)
        );

        // If no client-side tools to execute, just show the response
        if (toolUseBlocks.length === 0) {
          setResponse(data);
          setToolExecutionStatus(null);
          storage.saveToHistory(requestBody, data);
          setHistory(storage.getHistory());
          setLoading(false);
          return;
        }

        // Execute each tool and create tool_result blocks
        const executionDetails = [];
        const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
          const result = await executeTool(toolUse.name, toolUse.input, toolMode, toolApiKeys);

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
        }));

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
        if (topP !== 0.99) followUpBody.top_p = topP;
        if (topK !== 0) followUpBody.top_k = topK;
        // Use requestBody.tools which may include auto-injected code_execution tool
        if (requestBody.tools && requestBody.tools.length > 0) {
          followUpBody.tools = requestBody.tools;
        }

        // Include thinking config in follow-up if present
        if (requestBody.thinking) {
          followUpBody.thinking = requestBody.thinking;
          followUpBody.temperature = 1;
        }
        if (requestBody.output_config) {
          followUpBody.output_config = requestBody.output_config;
        }

        // Include container.skills in follow-up if present
        if (requestBody.container) {
          followUpBody.container = requestBody.container;
        }

        setToolExecutionStatus('Getting final response...');

        // Build follow-up headers
        const followUpHeaders = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        };
        if (betaHeaders.length > 0) {
          followUpHeaders['anthropic-beta'] = betaHeaders.join(',');
        }

        // Make follow-up request
        const followUpRes = await fetch('http://localhost:3002/v1/messages', {
          method: 'POST',
          headers: followUpHeaders,
          body: JSON.stringify(followUpBody),
        });

        if (!followUpRes.ok) {
          const errorData = await followUpRes.json();
          throw new Error(errorData.error?.message || `Follow-up request failed with status ${followUpRes.status}`);
        }

        const finalData = await followUpRes.json();
        setResponse(finalData);
        setToolExecutionStatus(null);

        // Conversation mode: append all tool-use related messages
        let updatedConversationHistory = historyToUse;
        if (conversationMode) {
          // Add three messages: assistant with tool_use, user with tool_result, final assistant response
          const toolUseMessage = {
            role: 'assistant',
            content: data.content,
            timestamp: Date.now(),
            id: `msg-${Date.now()}-tool-use`
          };

          const toolResultMessage = {
            role: 'user',
            content: toolResults,
            timestamp: Date.now(),
            id: `msg-${Date.now()}-tool-result`
          };

          // Extract text content and check if final response is not empty
          const textContent = extractMessageText(finalData.content);

          if (textContent && textContent.trim()) {
            const finalAssistantMessage = {
              role: 'assistant',
              content: finalData.content,
              timestamp: Date.now(),
              id: `msg-${Date.now()}-final`
            };
            updatedConversationHistory = [...historyToUse, toolUseMessage, toolResultMessage, finalAssistantMessage];
            setConversationHistory(updatedConversationHistory);

            // Update messages array for next API call
            setMessages(prev => [...prev,
              { role: 'assistant', content: data.content },
              { role: 'user', content: toolResults },
              { role: 'assistant', content: finalData.content }
            ]);
          } else {
            // Still add tool_use and tool_result even if final response is empty
            updatedConversationHistory = [...historyToUse, toolUseMessage, toolResultMessage];
            setConversationHistory(updatedConversationHistory);
            setMessages(prev => [...prev,
              { role: 'assistant', content: data.content },
              { role: 'user', content: toolResults }
            ]);
          }
        }

        // Save the final response to history
        storage.saveToHistory(requestBody, finalData, {
          isConversation: conversationMode,
          conversationHistory: updatedConversationHistory
        });
        setHistory(storage.getHistory());
      } else {
        // No tool use, just set the response
        setResponse(data);

        // Conversation mode: append assistant response
        let updatedConversationHistory = historyToUse;
        if (conversationMode) {
          // Extract text content and check if it's not empty
          const textContent = extractMessageText(data.content);

          if (textContent && textContent.trim()) {
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
          } else {
          }
        }

        // Save to history
        storage.saveToHistory(requestBody, data, {
          isConversation: conversationMode,
          conversationHistory: updatedConversationHistory
        });
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
      const res = await fetch(`http://localhost:3002/v1/organizations/usage_report/messages${queryString}`, {
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
      const res = await fetch(`http://localhost:3002/v1/organizations/cost_report${queryString}`, {
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
    setBatchResultsData(null);
    setBatchResultsError(null);

    const requestBody = {
      requests: batchRequests.filter(req =>
        req.custom_id &&
        req.params.messages &&
        req.params.messages.some(msg => msg.content.trim().length > 0)
      )
    };

    try {
      const res = await fetch('http://localhost:3002/v1/messages/batches', {
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
      const res = await fetch(`http://localhost:3002/v1/messages/batches/${batchId}`, {
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

  const handleFetchBatchResults = async (resultsUrl) => {
    if (!resultsUrl) {
      setBatchResultsError('No results URL provided');
      return;
    }

    if (!apiKey) {
      setBatchResultsError('API key is required to fetch batch results');
      return;
    }

    setBatchResultsLoading(true);
    setBatchResultsError(null);
    setBatchResultsData(null);

    try {
      let text;
      // Try direct fetch first with API key, fallback to proxy if CORS blocks
      try {
        const resp = await fetch(resultsUrl, {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        });
        if (resp.ok) {
          text = await resp.text();
        } else {
          const errorData = await resp.json();
          throw new Error(errorData.error?.message || 'Direct fetch failed');
        }
      } catch (directError) {
        // Fallback to proxy if CORS blocks or other error
        const proxyResp = await fetch('http://localhost:3002/proxy-batch-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: resultsUrl, apiKey })
        });
        if (!proxyResp.ok) {
          const errorData = await proxyResp.json();
          throw new Error(errorData.error || 'Proxy fetch failed');
        }
        text = await proxyResp.text();
      }

      // Check if response is HTML (error page) instead of JSONL
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSONL. First 200 chars:', text.substring(0, 200));
        throw new Error('Received HTML response instead of JSONL. The results URL may have expired or be inaccessible. Try fetching the batch status again to get a fresh URL.');
      }

      // Parse JSONL (one JSON object per line)
      const results = text.trim().split('\n')
        .filter(line => line.trim())
        .map((line, i) => {
          try {
            return JSON.parse(line);
          } catch {
            return { custom_id: `error_${i}`, error: `Parse error line ${i + 1}` };
          }
        });

      // Check if we got any valid results
      if (results.length === 0) {
        throw new Error('No valid results found in response');
      }

      setBatchResultsData(results);
    } catch (err) {
      console.error('Fetch batch results error:', err);
      setBatchResultsError(err.message || 'Failed to fetch batch results');
    } finally {
      setBatchResultsLoading(false);
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

    // Tool execution mode and API keys
    toolMode,
    setToolMode,
    toolApiKeys,
    setToolApiKeys,

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

    // Batches API
    batchRequests,
    setBatchRequests,
    batchStatus,
    setBatchStatus,
    batchResults,
    setBatchResults,
    batchResultsData,
    setBatchResultsData,
    batchResultsLoading,
    batchResultsError,
    handleCreateBatch,
    handleGetBatchStatus,
    handleFetchBatchResults,

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
    toolExecutionStatus,
    toolExecutionDetails,
    handleSendRequest,

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
    toolMode, toolApiKeys,
    betaHeaders, skillsJson,
    streaming,
    thinkingEnabled, thinkingType, budgetTokens, effortLevel,
    structuredOutput, outputSchema,
    conversationMode, conversationHistory,
    batchRequests, batchStatus, batchResults, batchResultsData, batchResultsLoading, batchResultsError,
    modelsList, modelsLoading,
    usageReport, usageLoading,
    costReport, costLoading,
    skillsList, skillsLoading, skillDetail, skillsSourceFilter,
    tokenCount, tokenCountLoading, tokenCountStale,
    response, loading, error, streamingText, toolExecutionStatus, toolExecutionDetails,
    history
  ]);

  return html`<${AppContext.Provider} value=${value}>${children}</${AppContext.Provider}>`;
}
