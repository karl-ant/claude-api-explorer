/**
 * Weather API Tool
 *
 * Get real weather data from Open-Meteo API (free, no API key required).
 * https://open-meteo.com/
 */

/**
 * WMO Weather Code to condition mapping
 * https://open-meteo.com/en/docs
 */
const WMO_CODES = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Light Snow Showers',
  86: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Thunderstorm with Hail'
};

/**
 * Execute weather API tool
 *
 * @param {object} input - Tool input with location and unit
 * @returns {string} - JSON string with weather data
 */
export async function executeWeather(input) {
  try {
    const { location, unit = 'fahrenheit' } = input;

    if (!location || typeof location !== 'string') {
      return JSON.stringify({
        success: false,
        error: 'location is required and must be a string'
      });
    }

    // Step 1: Geocode location to get coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error(`Geocoding failed with status ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return JSON.stringify({
        success: false,
        error: `Location "${location}" not found. Please try a different location name.`,
        mode: 'real'
      });
    }

    const { latitude, longitude, name, country, admin1 } = geoData.results[0];

    // Step 2: Get weather data for coordinates
    const tempUnit = unit.toLowerCase() === 'celsius' ? 'celsius' : 'fahrenheit';
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&temperature_unit=${tempUnit}&wind_speed_unit=mph&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed with status ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    // Map WMO code to condition
    const condition = WMO_CODES[current.weather_code] || 'Unknown';

    // Format response to match expected structure
    const result = {
      success: true,
      location: name,
      country: country,
      region: admin1,
      latitude: latitude,
      longitude: longitude,
      temperature: Math.round(current.temperature_2m),
      feels_like: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      conditions: condition,
      weather_code: current.weather_code,
      wind_speed: Math.round(current.wind_speed_10m),
      wind_direction: current.wind_direction_10m,
      clouds: current.cloud_cover,
      unit: unit,
      timestamp: current.time,
      mode: 'real',
      source: 'Open-Meteo'
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
