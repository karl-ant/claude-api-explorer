import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads (Skills API)
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from the project root
app.use(express.static(__dirname));

// Helper function to proxy requests to Anthropic API
async function proxyToAnthropic(req, res, method, path) {
  const apiKey = req.headers['x-api-key'];
  const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';
  const anthropicBeta = req.headers['anthropic-beta'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
    };

    if (anthropicBeta) {
      headers['anthropic-beta'] = anthropicBeta;
    }

    const fetchOptions = {
      method: method,
      headers: headers,
    };

    if (method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(`https://api.anthropic.com${path}`, fetchOptions);

    // Handle empty or non-JSON responses (common for DELETE)
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : { success: true };
    } catch (e) {
      data = { success: true, raw: text };
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}

// Messages API - Create message
app.post('/v1/messages', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/messages');
});

// Token Counting API - Count tokens
app.post('/v1/messages/count_tokens', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/messages/count_tokens');
});

// Message Batches API - Create batch
app.post('/v1/messages/batches', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/messages/batches');
});

// Message Batches API - Get batch status
app.get('/v1/messages/batches/:id', async (req, res) => {
  const batchId = req.params.id;
  await proxyToAnthropic(req, res, 'GET', `/v1/messages/batches/${batchId}`);
});

// Message Batches API - List batches
app.get('/v1/messages/batches', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/messages/batches${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropic(req, res, 'GET', path);
});

// Message Batches API - Cancel batch
app.post('/v1/messages/batches/:id/cancel', async (req, res) => {
  const batchId = req.params.id;
  await proxyToAnthropic(req, res, 'POST', `/v1/messages/batches/${batchId}/cancel`);
});

// Models API - List models
app.get('/v1/models', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/models${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropic(req, res, 'GET', path);
});

// Usage API - Get usage report
app.get('/v1/organizations/usage_report/messages', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/organizations/usage_report/messages${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropic(req, res, 'GET', path);
});

// Cost API - Get cost report
app.get('/v1/organizations/cost_report', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/organizations/cost_report${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropic(req, res, 'GET', path);
});

// Skills API - List skills
app.get('/v1/skills', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/skills${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropic(req, res, 'GET', path);
});

// Skills API - Get skill by ID
app.get('/v1/skills/:id', async (req, res) => {
  const skillId = req.params.id;
  await proxyToAnthropic(req, res, 'GET', `/v1/skills/${encodeURIComponent(skillId)}`);
});

// Skills API - Delete skill
app.delete('/v1/skills/:id', async (req, res) => {
  const skillId = req.params.id;
  await proxyToAnthropic(req, res, 'DELETE', `/v1/skills/${encodeURIComponent(skillId)}`);
});

// Skills API - List skill versions
app.get('/v1/skills/:id/versions', async (req, res) => {
  const skillId = req.params.id;
  await proxyToAnthropic(req, res, 'GET', `/v1/skills/${encodeURIComponent(skillId)}/versions?beta=true`);
});

// Skills API - Delete skill version
app.delete('/v1/skills/:id/versions/:versionId', async (req, res) => {
  const skillId = req.params.id;
  const versionId = req.params.versionId;
  await proxyToAnthropic(req, res, 'DELETE', `/v1/skills/${encodeURIComponent(skillId)}/versions/${encodeURIComponent(versionId)}?beta=true`);
});

// Skills API - Create skill (multipart/form-data)
app.post('/v1/skills', upload.array('files[]'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';
  const anthropicBeta = req.headers['anthropic-beta'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  // Parse file paths from request body (contains relative paths like "my-skill/SKILL.md")
  let filePaths = [];
  try {
    filePaths = req.body && req.body.file_paths ? JSON.parse(req.body.file_paths) : [];
  } catch (e) {
    return res.status(400).json({ error: 'Invalid file_paths format' });
  }

  try {
    // Create FormData for upstream request
    const formData = new FormData();

    // Add display_title if provided
    if (req.body && req.body.display_title) {
      formData.append('display_title', req.body.display_title);
    }

    // Helper to get proper MIME type for common skill files
    const getMimeType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'md': 'text/markdown',
        'txt': 'text/plain',
        'py': 'text/x-python',
        'js': 'text/javascript',
        'json': 'application/json',
        'yaml': 'text/yaml',
        'yml': 'text/yaml',
      };
      return mimeTypes[ext] || 'application/octet-stream';
    };

    // Build multipart body manually to preserve folder paths in filenames
    // The form-data library strips directory components from filenames
    const boundary = '----SkillUploadBoundary' + Date.now();
    const parts = [];

    // Add display_title if provided
    if (req.body && req.body.display_title) {
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="display_title"\r\n\r\n` +
        `${req.body.display_title}\r\n`
      );
    }

    // Sort files to ensure SKILL.md comes first
    if (req.files && req.files.length > 0) {
      const filesWithPaths = req.files.map((file, i) => ({
        file,
        relativePath: filePaths[i] || file.originalname
      }));

      filesWithPaths.sort((a, b) => {
        const aIsSkillMd = a.relativePath.endsWith('/SKILL.md');
        const bIsSkillMd = b.relativePath.endsWith('/SKILL.md');
        if (aIsSkillMd && !bIsSkillMd) return -1;
        if (!aIsSkillMd && bIsSkillMd) return 1;
        return 0;
      });

      for (const { file, relativePath } of filesWithPaths) {
        const contentType = getMimeType(relativePath);

        // Build the part header with full path in filename
        const partHeader =
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="files[]"; filename="${relativePath}"\r\n` +
          `Content-Type: ${contentType}\r\n\r\n`;

        parts.push(Buffer.from(partHeader));
        parts.push(file.buffer);
        parts.push(Buffer.from('\r\n'));
      }
    }

    // Add closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    // Combine all parts into a single buffer
    const formBuffer = Buffer.concat(parts.map(p => typeof p === 'string' ? Buffer.from(p) : p));

    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
      'content-type': `multipart/form-data; boundary=${boundary}`,
    };

    if (anthropicBeta) {
      headers['anthropic-beta'] = anthropicBeta;
    }

    const response = await fetch('https://api.anthropic.com/v1/skills', {
      method: 'POST',
      headers: headers,
      body: formBuffer,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Skills API error:', error);
    res.status(500).json({ error: 'Skills API proxy error: ' + error.message });
  }
});

// Tool API Proxies
// OpenWeatherMap API - Get weather
app.get('/api/weather', async (req, res) => {
  const { location, units, apiKey } = req.query;

  if (!apiKey) {
    return res.status(401).json({ error: 'OpenWeatherMap API key is required' });
  }

  if (!location) {
    return res.status(400).json({ error: 'location parameter is required' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units || 'imperial'}&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.message || 'OpenWeatherMap API request failed'
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Weather API proxy error: ' + error.message });
  }
});

// Brave Search API - Web search
app.get('/api/search', async (req, res) => {
  const { query, count, apiKey } = req.query;

  if (!apiKey) {
    return res.status(401).json({ error: 'Brave Search API key is required' });
  }

  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count || 5}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.message || 'Brave Search API request failed'
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Search API proxy error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`   Forwarding requests to https://api.anthropic.com`);
  console.log(`\n✅ Your app is ready at http://localhost:${PORT}\n`);
});
