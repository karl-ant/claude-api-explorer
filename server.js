import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

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

    const data = await response.json();

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

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`   Forwarding requests to https://api.anthropic.com`);
  console.log(`\n✅ Your app is ready at http://localhost:8000\n`);
});
