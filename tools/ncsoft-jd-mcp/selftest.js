import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(5000);

const port = process.env.PORT || 3000;
const endpoint = new URL(`http://127.0.0.1:${port}/mcp`);
const targetUrl = 'https://careers.ncsoft.com/apply/view/101294?companyId=NCH';

const client = new Client({ name: 'ncsoft-jd-mcp-selftest', version: '1.0.0' });

try {
  const transport = new StreamableHTTPClientTransport(endpoint);
  await client.connect(transport);

  const tools = await client.listTools();
  console.log('MCP_SELFTEST_TOOLS', JSON.stringify(tools.tools.map(t => t.name)));

  const result = await client.callTool({
    name: 'fetch_ncsoft_jd',
    arguments: { url: targetUrl }
  });

  console.log('MCP_SELFTEST_RESULT', JSON.stringify(result.structuredContent ?? result.content));
  const verified = result?.structuredContent?.verified === true;
  console.log('MCP_SELFTEST_VERIFIED', verified);

  await client.close();
} catch (error) {
  console.error('MCP_SELFTEST_ERROR', error?.stack || error?.message || String(error));
  try { await client.close(); } catch {}
}
