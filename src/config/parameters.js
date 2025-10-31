export default {
  "parameters": [
    {
      "name": "max_tokens",
      "label": "Max Tokens",
      "type": "number",
      "required": true,
      "default": 1024,
      "min": 1,
      "max": 8192,
      "description": "Maximum number of tokens to generate"
    },
    {
      "name": "temperature",
      "label": "Temperature",
      "type": "number",
      "required": false,
      "default": 1.0,
      "min": 0,
      "max": 1,
      "step": 0.1,
      "description": "Controls randomness. Lower is more focused and deterministic"
    },
    {
      "name": "top_p",
      "label": "Top P",
      "type": "number",
      "required": false,
      "default": 1.0,
      "min": 0,
      "max": 1,
      "step": 0.1,
      "description": "Nucleus sampling threshold"
    },
    {
      "name": "top_k",
      "label": "Top K",
      "type": "number",
      "required": false,
      "default": 0,
      "min": 0,
      "max": 500,
      "description": "Only sample from top K options. 0 means disabled"
    },
    {
      "name": "stream",
      "label": "Stream Response",
      "type": "boolean",
      "required": false,
      "default": false,
      "description": "Stream the response as it's generated"
    }
  ]
};
