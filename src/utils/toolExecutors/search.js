/**
 * Web Search API Tool
 *
 * Get real search results from Brave Search API.
 * Requires API key from https://brave.com/search/api/
 */

/**
 * Execute web search API tool
 *
 * @param {object} input - Tool input with query and num_results
 * @param {string} apiKey - Brave Search API key
 * @returns {string} - JSON string with search results
 */
export async function executeWebSearch(input, apiKey) {
  try {
    const { query, num_results = 5 } = input;

    if (!query || typeof query !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'query is required and must be a string'
      });
    }

    if (!apiKey) {
      return JSON.stringify({
        success: false,
        error: 'Brave Search API key is required. Get one at https://brave.com/search/api/',
        mode: 'error'
      });
    }

    const limit = Math.min(Math.max(1, num_results), 20); // Clamp between 1-20

    // Make request through proxy
    const response = await fetch(`http://localhost:3001/api/search?query=${encodeURIComponent(query)}&count=${limit}&apiKey=${encodeURIComponent(apiKey)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract web results
    const webResults = data.web?.results || [];

    // Format results
    const formattedResults = webResults.slice(0, limit).map((result, index) => ({
      rank: index + 1,
      title: result.title,
      url: result.url,
      description: result.description,
      age: result.age,
      language: result.language
    }));

    const result = {
      success: true,
      query: query,
      total_results: webResults.length,
      returned_results: formattedResults.length,
      results: formattedResults,
      search_engine: 'Brave Search',
      mode: 'real'
    };

    return JSON.stringify(result);

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Web search API request failed',
      query: input.query,
      mode: 'real'
    });
  }
}

export default {
  executeWebSearch
};
