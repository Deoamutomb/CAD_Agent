import { Anthropic } from '@anthropic-ai/sdk';
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages';
import { NextRequest } from 'next/server';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Tool = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

type AnthropicTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize MCP client
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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Connect to MCP server and get tools
    await mcpClient.connect(weatherServer);
    const toolsResponse = await mcpClient.listTools();
    console.log('MCP Tools Response:', JSON.stringify(toolsResponse, null, 2));
    
    const tools = toolsResponse?.tools || [];
    console.log('Processed Tools:', JSON.stringify(tools, null, 2));

    // Create a streaming response with tools
    const stream = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 1000,
      messages: messages,
      stream: true,
      tools: tools.map((tool) => ({
        type: 'custom',
        name: tool.name,
        description: tool.description || '',
        input_schema: tool.inputSchema
      })) as any[]
    });

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 