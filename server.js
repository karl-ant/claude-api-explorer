import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
// FormData import removed - using native boundary-based multipart

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

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

// Ensure a required beta flag is present in the anthropic-beta header value
function withBetaFlag(existing, flag) {
  const parts = (existing || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.includes(flag)) parts.push(flag);
  return parts.join(',');
}

// Proxy to Anthropic, guaranteeing a beta header flag is present
async function proxyToAnthropicWithBeta(req, res, method, apiPath, betaFlag) {
  req.headers['anthropic-beta'] = withBetaFlag(req.headers['anthropic-beta'], betaFlag);
  await proxyToAnthropic(req, res, method, apiPath);
}

const FILES_BETA = 'files-api-2025-04-14';

// Messages API - Create message
app.post('/v1/messages', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/messages');
});

// Messages API - Streaming proxy
app.post('/v1/messages/stream', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';
  const anthropicBeta = req.headers['anthropic-beta'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': anthropicVersion,
  };

  if (anthropicBeta) {
    headers['anthropic-beta'] = anthropicBeta;
  }

  try {
    const body = { ...req.body, stream: true };
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errorData = await upstream.text();
      let parsed;
      try { parsed = JSON.parse(errorData); } catch { parsed = { error: errorData }; }
      return res.status(upstream.status).json(parsed);
    }

    // Set SSE headers and pipe the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        const ok = res.write(Buffer.from(value));
        if (!ok) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
    };

    // Abort upstream if client disconnects
    req.on('close', () => {
      reader.cancel().catch(() => {});
    });

    await pump();
  } catch (error) {
    console.error('Streaming proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming proxy error: ' + error.message });
    } else {
      res.end();
    }
  }
});

// Token Counting API - Count tokens
app.post('/v1/messages/count_tokens', async (req, res) => {
  await proxyToAnthropic(req, res, 'POST', '/v1/messages/count_tokens');
});

// Models API - List models (powers the live model dropdown in the Messages tab)
app.get('/v1/models', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const path = `/v1/models${queryParams ? '?' + queryParams : ''}`;
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

// Files API - List files
app.get('/v1/files', async (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const apiPath = `/v1/files${queryParams ? '?' + queryParams : ''}`;
  await proxyToAnthropicWithBeta(req, res, 'GET', apiPath, FILES_BETA);
});

// Files API - Download file content (must be before /v1/files/:id)
app.get('/v1/files/:id/content', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
      'anthropic-beta': withBetaFlag(req.headers['anthropic-beta'], FILES_BETA),
    };

    const upstream = await fetch(
      `https://api.anthropic.com/v1/files/${encodeURIComponent(req.params.id)}/content`,
      { method: 'GET', headers }
    );

    if (!upstream.ok) {
      const errorText = await upstream.text();
      let parsed;
      try { parsed = JSON.parse(errorText); } catch { parsed = { error: errorText }; }
      return res.status(upstream.status).json(parsed);
    }

    // This endpoint serves bytes on the same origin as the app, so never let the
    // upstream pick a renderable content type / inline disposition — force a download.
    const upstreamType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const SAFE_MIME_TYPES = new Set([
      'application/octet-stream', 'application/pdf', 'application/json', 'application/zip',
      'text/plain', 'text/csv', 'text/markdown',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    ]);
    const upstreamDisposition = upstream.headers.get('content-disposition');
    res.setHeader('Content-Type', SAFE_MIME_TYPES.has(upstreamType) ? upstreamType : 'application/octet-stream');
    res.setHeader('Content-Disposition',
      upstreamDisposition && /^attachment/i.test(upstreamDisposition.trim())
        ? upstreamDisposition
        : 'attachment; filename="download"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (error) {
    console.error('Files download proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Files download proxy error: ' + error.message });
    } else {
      res.end();
    }
  }
});

// Files API - Get file metadata
app.get('/v1/files/:id', async (req, res) => {
  await proxyToAnthropicWithBeta(req, res, 'GET', `/v1/files/${encodeURIComponent(req.params.id)}`, FILES_BETA);
});

// Files API - Delete file
app.delete('/v1/files/:id', async (req, res) => {
  await proxyToAnthropicWithBeta(req, res, 'DELETE', `/v1/files/${encodeURIComponent(req.params.id)}`, FILES_BETA);
});

// Files API - Upload file (multipart/form-data, single "file" field)
app.post('/v1/files', upload.single('file'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const anthropicVersion = req.headers['anthropic-version'] || '2023-06-01';

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A file is required (multipart field "file")' });
  }

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' }),
      req.file.originalname
    );

    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
      'anthropic-beta': withBetaFlag(req.headers['anthropic-beta'], FILES_BETA),
    };
    // Let fetch set the multipart Content-Type with boundary.

    const response = await fetch('https://api.anthropic.com/v1/files', {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : { success: true }; } catch { data = { success: true, raw: text }; }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (error) {
    console.error('Files upload proxy error:', error);
    res.status(500).json({ error: 'Files upload proxy error: ' + error.message });
  }
});

// Note: Weather and Search tools now use free APIs directly (Open-Meteo, DuckDuckGo)
// No proxy routes needed for these tools

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`   Forwarding requests to https://api.anthropic.com`);
  console.log(`\n✅ Your app is ready at http://localhost:${PORT}\n`);
});
