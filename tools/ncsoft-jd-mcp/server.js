import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;
const FETCHER_BASE_URL = process.env.FETCHER_BASE_URL || 'https://ncsoft-jd-fetcher.onrender.com';

function createMcpServer() {
  const server = new McpServer({
    name: 'ncsoft-jd-fetcher',
    version: '1.0.0'
  });

  server.registerTool(
    'fetch_ncsoft_jd',
    {
      title: 'Fetch NCSOFT Job Description',
      description: 'Fetch and verify the exact NCSOFT Careers job posting for a careers.ncsoft.com or m-careers.ncsoft.com URL. Returns structured JD fields and preserves postingId/companyId identity.',
      inputSchema: {
        url: z.string().url().describe('Exact NCSOFT Careers job posting URL')
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ url }) => {
      let response;
      let data;
      try {
        response = await fetch(`${FETCHER_BASE_URL}/fetch`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { verified: false, error: 'Fetcher returned non-JSON response', raw_response: text.slice(0, 4000) };
        }
      } catch (error) {
        data = { verified: false, error: error?.message || String(error) };
        response = { ok: false, status: 502 };
      }

      const isError = !response.ok || data?.verified !== true;
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
        isError
      };
    }
  );

  return server;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ncsoft-jd-mcp', fetcher: FETCHER_BASE_URL });
});

app.all('/mcp', async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP_REQUEST_ERROR', error?.stack || error?.message || String(error));
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal MCP server error' }, id: null });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ncsoft-jd-mcp listening on ${PORT}`);
  console.log(`MCP endpoint: http://127.0.0.1:${PORT}/mcp`);
});
