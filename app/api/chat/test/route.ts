import { NextRequest } from 'next/server';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function GET() {
  try {
    const weatherServer = new StdioClientTransport({
      command: "uv",
      args: [
        "--directory",
        "/Users/douglasqian/weather",
        "run",
        "weather.py"
      ]
    });

    const mcpClient = new Client({
      name: "cad-agent-mcp-client",
      version: "1.0.0"
    });

    await mcpClient.connect(weatherServer);
    const tools = await mcpClient.listTools();

    return new Response(JSON.stringify({
      tools,
      raw: tools,
      isArray: Array.isArray(tools),
      type: typeof tools
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 