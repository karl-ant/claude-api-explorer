/**
 * Web Search API Tool
 *
 * Get instant answers from DuckDuckGo API (free, no API key required).
 * Returns Wikipedia summaries, calculations, definitions, and instant answers.
 *
 * Note: This is NOT full web search - it returns instant answers only.
 * https://duckduckgo.com/api
 */

/**
 * Execute web search API tool
 *
 * @param {object} input - Tool input with query and num_results
 * @returns {string} - JSON string with search results
 */
export async function executeWebSearch(input) {
  try {
    const { query, num_results = 5 } = input;

    if (!query || typeof query !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'query is required and must be a string'
      });
    }

    const limit = Math.min(Math.max(1, num_results), 20); // Clamp between 1-20

    // DuckDuckGo Instant Answer API
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Extract results from various fields
    const results = [];

    // Main abstract (usually Wikipedia)
    if (data.Abstract && data.Abstract.length > 0) {
      results.push({
        rank: results.length + 1,
        title: data.Heading || 'Instant Answer',
        snippet: data.Abstract,
        url: data.AbstractURL || '',
        source: data.AbstractSource || 'DuckDuckGo',
        type: 'abstract'
      });
    }

    // Answer box (calculations, conversions, etc.)
    if (data.Answer && data.Answer.length > 0) {
      results.push({
        rank: results.length + 1,
        title: 'Answer',
        snippet: data.Answer,
        url: '',
        source: data.AnswerType || 'DuckDuckGo',
        type: 'answer'
      });
    }

    // Related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= limit) break;

        // Skip if it's a topic group
        if (topic.Topics) {
          // Flatten nested topics
          for (const subTopic of topic.Topics) {
            if (results.length >= limit) break;
            if (subTopic.Text && subTopic.FirstURL) {
              results.push({
                rank: results.length + 1,
                title: subTopic.Text.split(' - ')[0] || subTopic.Text.substring(0, 80),
                snippet: subTopic.Text,
                url: subTopic.FirstURL,
                source: 'Related Topic',
                type: 'related'
              });
            }
          }
        } else if (topic.Text && topic.FirstURL) {
          results.push({
            rank: results.length + 1,
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 80),
            snippet: topic.Text,
            url: topic.FirstURL,
            source: 'Related Topic',
            type: 'related'
          });
        }
      }
    }

    // Definition
    if (data.Definition && data.Definition.length > 0) {
      results.push({
        rank: results.length + 1,
        title: data.Heading || 'Definition',
        snippet: data.Definition,
        url: data.DefinitionURL || '',
        source: data.DefinitionSource || 'DuckDuckGo',
        type: 'definition'
      });
    }

    // If no results found, provide helpful message
    if (results.length === 0) {
      return JSON.stringify({
        success: true,
        query: query,
        total_results: 0,
        returned_results: 0,
        results: [],
        message: 'No instant answers found. Try a factual query like "who is...", "what is...", or "capital of..."',
        search_engine: 'DuckDuckGo Instant Answers',
        mode: 'real'
      });
    }

    const result = {
      success: true,
      query: query,
      total_results: results.length,
      returned_results: Math.min(results.length, limit),
      results: results.slice(0, limit),
      search_engine: 'DuckDuckGo Instant Answers',
      mode: 'real',
      note: 'Returns instant answers (Wikipedia, definitions, calculations) - not full web search results'
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
