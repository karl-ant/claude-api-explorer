const STORAGE_KEYS = {
  API_KEY: 'claude_api_explorer_api_key',
  PERSIST_KEY: 'claude_api_explorer_persist_key',
  HISTORY: 'claude_api_explorer_history',
  LAST_CONFIG: 'claude_api_explorer_last_config'
};

const MAX_HISTORY_ITEMS = 50;

export const storage = {
  // API Key management
  saveApiKey(apiKey, persist = false) {
    if (persist) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      localStorage.setItem(STORAGE_KEYS.PERSIST_KEY, 'true');
    } else {
      sessionStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      localStorage.setItem(STORAGE_KEYS.PERSIST_KEY, 'false');
    }
  },

  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || sessionStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  shouldPersistKey() {
    return localStorage.getItem(STORAGE_KEYS.PERSIST_KEY) === 'true';
  },

  clearApiKey() {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    sessionStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.PERSIST_KEY);
  },

  // Request history
  saveToHistory(request, response) {
    try {
      const history = this.getHistory();

      // Extract prompt preview - handle both string and array content
      let promptPreview = 'Empty prompt';
      if (request.messages && request.messages[0]) {
        const content = request.messages[0].content;
        if (typeof content === 'string') {
          promptPreview = content.substring(0, 50);
        } else if (Array.isArray(content)) {
          const textBlock = content.find(block => block.type === 'text');
          promptPreview = textBlock ? textBlock.text.substring(0, 50) : 'Multi-modal message';
        }
      }

      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        request,
        response,
        model: request.model,
        prompt: promptPreview,
        tokenUsage: response?.usage || null
      };

      history.unshift(entry);

      // Keep only last MAX_HISTORY_ITEMS
      if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(MAX_HISTORY_ITEMS);
      }

      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Clearing old entries...');
          // Try to clear some space by keeping only half the entries
          history.splice(Math.floor(MAX_HISTORY_ITEMS / 2));
          try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
          } catch (retryError) {
            console.error('Failed to save history even after cleanup:', retryError);
            return null;
          }
        } else {
          throw storageError;
        }
      }

      return entry;
    } catch (error) {
      console.error('Failed to save history:', error);
      return null;
    }
  },

  getHistory() {
    try {
      const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  deleteHistoryItem(id) {
    try {
      const history = this.getHistory();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete history item:', error);
      return false;
    }
  },

  exportHistory() {
    const history = this.getHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `claude-api-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importHistory(jsonString) {
    try {
      const importedHistory = JSON.parse(jsonString);
      if (!Array.isArray(importedHistory)) {
        throw new Error('Invalid history format');
      }
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(importedHistory));
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          throw new Error('Imported history is too large for localStorage');
        }
        throw storageError;
      }
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  },

  // Last configuration
  saveLastConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  },

  getLastConfig() {
    try {
      const config = localStorage.getItem(STORAGE_KEYS.LAST_CONFIG);
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }
};
