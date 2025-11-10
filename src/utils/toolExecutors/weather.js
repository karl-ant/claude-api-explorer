/**
 * Weather API Tool
 *
 * Get real weather data from OpenWeatherMap API.
 * Requires API key from https://openweathermap.org/api
 */

/**
 * Execute weather API tool
 *
 * @param {object} input - Tool input with location and unit
 * @param {string} apiKey - OpenWeatherMap API key
 * @returns {string} - JSON string with weather data
 */
export async function executeWeather(input, apiKey) {
  try {
    const { location, unit = 'fahrenheit' } = input;

    if (!location || typeof location !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'location is required and must be a string'
      });
    }

    if (!apiKey) {
      return JSON.stringify({
        success: false,
        error: 'OpenWeatherMap API key is required. Get one at https://openweathermap.org/api',
        mode: 'error'
      });
    }

    // Determine unit parameter for API
    const units = unit.toLowerCase() === 'celsius' ? 'metric' : 'imperial';

    // Make request through proxy
    const response = await fetch(`http://localhost:3001/api/weather?location=${encodeURIComponent(location)}&units=${units}&apiKey=${encodeURIComponent(apiKey)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Format response
    const result = {
      success: true,
      location: data.name || location,
      country: data.sys?.country,
      temperature: Math.round(data.main?.temp),
      feels_like: Math.round(data.main?.feels_like),
      temp_min: Math.round(data.main?.temp_min),
      temp_max: Math.round(data.main?.temp_max),
      humidity: data.main?.humidity,
      pressure: data.main?.pressure,
      conditions: data.weather?.[0]?.main,
      description: data.weather?.[0]?.description,
      wind_speed: data.wind?.speed,
      wind_direction: data.wind?.deg,
      clouds: data.clouds?.all,
      visibility: data.visibility,
      unit: unit,
      timestamp: new Date(data.dt * 1000).toISOString(),
      timezone_offset: data.timezone,
      mode: 'real'
    };

    return JSON.stringify(result);

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Weather API request failed',
      location: input.location,
      mode: 'real'
    });
  }
}

export default {
  executeWeather
};
