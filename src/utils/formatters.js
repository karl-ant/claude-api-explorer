export function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function formatTokenCount(count) {
  if (!count) return '0';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function extractMessageText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (block.type === 'text') {
          return block.text;
        } else if (block.type === 'tool_use') {
          return `[Tool Use: ${block.name}]\nInput: ${JSON.stringify(block.input, null, 2)}`;
        }
        return '';
      })
      .filter(text => text.length > 0)
      .join('\n\n');
  }
  return '';
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export function getImageMediaType(file) {
  const mimeType = file.type;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/gif') return 'image/gif';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg'; // default
}

/**
 * Simulates tool execution by returning mock results
 * In a real application, this would call actual APIs
 */
export function executeTool(toolName, toolInput) {
  const mockResults = {
    get_weather: (input) => {
      const location = input.location || 'Unknown';
      return JSON.stringify({
        location: location,
        temperature: 72,
        conditions: 'Sunny',
        humidity: 45,
        wind_speed: 8,
        forecast: 'Clear skies expected throughout the day'
      });
    },

    calculator: (input) => {
      try {
        // Support both old format (operation, num1, num2) and new format (expression)
        if (input.expression) {
          // New format - evaluate with Math functions available
          try {
            const expr = String(input.expression).trim();

            // Validate expression contains only allowed characters
            const allowedChars = /^[0-9+\-*/().,\s\w]+$/;
            if (!allowedChars.test(expr)) {
              return JSON.stringify({
                success: false,
                error: 'Expression contains invalid characters',
                expression: input.expression,
                mode: 'demo'
              });
            }

            // Check for dangerous patterns (same as real calculator)
            const dangerousPatterns = [
              /require/i,
              /import/i,
              /export/i,
              /function/i,
              /eval/i,
              /constructor/i,
              /prototype/i,
              /__proto__/i,
              /\[.*\]/,  // Array access
              /window/i,
              /document/i,
              /global/i,
              /process/i
            ];

            for (const pattern of dangerousPatterns) {
              if (pattern.test(expr)) {
                return JSON.stringify({
                  success: false,
                  error: 'Expression contains forbidden keywords',
                  expression: input.expression,
                  mode: 'demo'
                });
              }
            }

            const mathContext = {
              pi: Math.PI, e: Math.E,
              sin: Math.sin, cos: Math.cos, tan: Math.tan,
              asin: Math.asin, acos: Math.acos, atan: Math.atan,
              exp: Math.exp, log: Math.log, log10: Math.log10,
              sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow,
              abs: Math.abs, ceil: Math.ceil, floor: Math.floor,
              round: Math.round, min: Math.min, max: Math.max
            };

            const func = new Function(...Object.keys(mathContext), `return (${expr})`);
            const result = func(...Object.values(mathContext));

            return JSON.stringify({
              success: true,
              result,
              expression: input.expression,
              mode: 'demo'
            });
          } catch (e) {
            return JSON.stringify({
              success: false,
              error: 'Invalid expression: ' + e.message,
              expression: input.expression
            });
          }
        }

        // Old format
        const { operation, num1, num2 } = input;
        let result;
        switch (operation) {
          case 'add': result = num1 + num2; break;
          case 'subtract': result = num1 - num2; break;
          case 'multiply': result = num1 * num2; break;
          case 'divide': result = num2 !== 0 ? num1 / num2 : 'Error: Division by zero'; break;
          default: result = 'Error: Unknown operation';
        }
        return JSON.stringify({ result });
      } catch (err) {
        return JSON.stringify({ error: err.message });
      }
    },

    get_stock_price: (input) => {
      const symbol = input.symbol || 'UNKNOWN';
      return JSON.stringify({
        symbol: symbol,
        price: 150.25 + Math.random() * 10,
        change: (Math.random() - 0.5) * 5,
        change_percent: ((Math.random() - 0.5) * 3).toFixed(2),
        volume: Math.floor(Math.random() * 10000000),
        market_cap: '2.5T'
      });
    },

    get_current_time: (input) => {
      const timezone = input.timezone || 'UTC';
      return JSON.stringify({
        timezone: timezone,
        current_time: new Date().toISOString(),
        unix_timestamp: Date.now(),
        formatted: new Date().toLocaleString()
      });
    },

    web_search: (input) => {
      const query = input.query || '';
      return JSON.stringify({
        query: query,
        results: [
          { title: `Result 1 for "${query}"`, url: 'https://example.com/1', snippet: 'This is a mock search result...' },
          { title: `Result 2 for "${query}"`, url: 'https://example.com/2', snippet: 'Another mock result...' },
          { title: `Result 3 for "${query}"`, url: 'https://example.com/3', snippet: 'Third mock result...' }
        ],
        result_count: 3
      });
    },

    send_email: (input) => {
      return JSON.stringify({
        status: 'sent',
        to: input.to || 'unknown@example.com',
        subject: input.subject || 'No subject',
        message_id: 'mock-' + Date.now(),
        timestamp: new Date().toISOString()
      });
    },

    file_search: (input) => {
      const query = input.query || input.filename || '';
      return JSON.stringify({
        query: query,
        results: [
          { path: '/documents/file1.txt', size: '1.2 KB', modified: '2025-11-05' },
          { path: '/downloads/file2.pdf', size: '245 KB', modified: '2025-11-04' }
        ],
        count: 2
      });
    },

    database_query: (input) => {
      const query = input.query || '';
      return JSON.stringify({
        query: query,
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        row_count: 2,
        execution_time_ms: 45
      });
    }
  };

  // Execute the mock tool
  if (mockResults[toolName]) {
    try {
      return mockResults[toolName](toolInput);
    } catch (err) {
      return JSON.stringify({ error: `Tool execution failed: ${err.message}` });
    }
  }

  // Default response for unknown tools
  return JSON.stringify({
    error: `Unknown tool: ${toolName}`,
    message: 'This is a mock tool execution. No actual API was called.'
  });
}
