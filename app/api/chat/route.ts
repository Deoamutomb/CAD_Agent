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

// Singleton for MCP client and tools
let mcpClientInstance: Client | null = null;
let toolsCache: any[] = [];  // Initialize as empty array instead of null

async function getMCPClient() {
  if (!mcpClientInstance) {
    const mcpServer = new StdioClientTransport({
      command: "node",
      args: [
        "/Users/douglasqian/Downloads/CAD_Agent/mpc-server/build/index.js"
      ]
    });

    mcpClientInstance = new Client({
      name: "cad-agent-mcp-client",
      version: "1.0.0"
    });

    try {
      await mcpClientInstance.connect(mcpServer);
      const toolsResponse = await mcpClientInstance.listTools();
      toolsCache = toolsResponse?.tools || [];
      console.log('MCP Tools initialized:', JSON.stringify(toolsCache, null, 2));
    } catch (error) {
      console.error('Error initializing MCP client:', error);
      toolsCache = [];
    }
  }
  return { client: mcpClientInstance, tools: toolsCache };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, state } = await req.json();

    // Get MCP client and tools from singleton
    const { client: mcpClient, tools } = await getMCPClient();
    console.log('Using cached tools:', JSON.stringify(tools, null, 2));

    // Add system message with state context
    const messagesWithContext = [
      {
        role: 'user',
        content: `You are an AI assistant for a CAD application. Here is the current state of the application:
${JSON.stringify(state, null, 2)}

Use this context to provide more relevant and contextual responses.`
      },
      ...messages
    ];

    // Create a streaming response with tools
    const stream = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 10000,
      messages: messagesWithContext,
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
          let currentToolCall: {
            id: string;
            name: string;
            parameters: Record<string, unknown>;
          } | null = null;
          let currentJsonInput = '';

          for await (const chunk of stream) {
            console.log('Chunk:', JSON.stringify(chunk, null, 2));
            console.log("\n\n");

            if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(text));
            } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
              // Start of a tool call
              currentToolCall = {
                id: chunk.content_block.id,
                name: chunk.content_block.name,
                parameters: {}
              };
            } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
              // Accumulate JSON input
              currentJsonInput += chunk.delta.partial_json;
            } else if (chunk.type === 'content_block_stop' && currentToolCall) {
              // End of tool call, parse the complete JSON and execute the tool
              try {
                console.log('Current JSON input:', currentJsonInput);
                
                let result;
                if (currentJsonInput.trim() === '') {
                  // If JSON input is empty, call tool with no arguments
                  console.log('Tool call with no arguments:', currentToolCall.name);
                  result = await mcpClient.callTool({
                    name: currentToolCall.name,
                    arguments: {},
                  });
                } else {
                  // Parse parameters and include them in the tool call
                  const parameters = JSON.parse(currentJsonInput);
                  console.log('Tool call:', JSON.stringify({ ...currentToolCall, parameters }, null, 2));
                  result = await mcpClient.callTool({
                    name: currentToolCall.name,
                    arguments: parameters
                  });
                }
                
                console.log('Tool result:', JSON.stringify(result, null, 2));
                
                // Format the tool result into a readable string
                let formattedResult = '';
                let objectsUpdate = null;
                let objectsToAdd = null;
                let objectsToRemove = null;

                if (typeof result === 'object') {
                  if (currentToolCall.name === 'get_alerts') {
                    formattedResult = `Weather alerts for ${parameters.state}:\n${JSON.stringify(result, null, 2)}`;
                  } else if (currentToolCall.name === 'get_forecast') {
                    formattedResult = `Weather forecast for coordinates (${parameters.latitude}, ${parameters.longitude}):\n${JSON.stringify(result, null, 2)}`;
                  } else if (result.objects) {
                    // Handle object position updates
                    formattedResult = `Updated object positions:\n${JSON.stringify(result.objects, null, 2)}`;
                    objectsUpdate = result.objects;
                  } else if (result.object) {
                    // Handle new objects
                    formattedResult = `Added new objects:\n${JSON.stringify(result.object, null, 2)}`;
                    objectsToAdd = result.object;
                  } else if (result.objectIds) {
                    // Handle object removal
                    formattedResult = `Removed objects:\n${JSON.stringify(result.objectIds, null, 2)}`;
                    objectsToRemove = result.objectIds;
                  } else {
                    formattedResult = JSON.stringify(result, null, 2);
                  }
                } else {
                  formattedResult = String(result);
                }

                const finalCompletionInput = {
                  model: 'claude-3-7-sonnet-latest',
                  max_tokens: 10000,
                  messages: [
                    ...messagesWithContext,
                    { 
                      role: 'user', 
                      content: `${formattedResult}`, 
                    }
                  ],
                  stream: true
                }

                console.log('Final completion input:', JSON.stringify(finalCompletionInput, null, 2));

                // Send tool result back to Claude
                const toolResponse = await anthropic.messages.create(finalCompletionInput);

                console.log('Final completion response:', toolResponse);

                // Stream the response from Claude after tool call
                for await (const responseChunk of toolResponse) {
                  if (responseChunk.type === 'content_block_delta' && 'text' in responseChunk.delta) {
                    // If we have updates, send them as special messages
                    if (objectsUpdate) {
                      controller.enqueue(encoder.encode(`<objects_update>${JSON.stringify(objectsUpdate)}</objects_update>`));
                      objectsUpdate = null;
                    }
                    if (objectsToAdd) {
                      controller.enqueue(encoder.encode(`<objects_add>${JSON.stringify(objectsToAdd)}</objects_add>`));
                      objectsToAdd = null;
                    }
                    if (objectsToRemove) {
                      controller.enqueue(encoder.encode(`<objects_remove>${JSON.stringify(objectsToRemove)}</objects_remove>`));
                      objectsToRemove = null;
                    }
                    controller.enqueue(encoder.encode(responseChunk.delta.text));
                  }
                }

                // Reset for next tool call
                currentToolCall = null;
                currentJsonInput = '';
              } catch (error) {
                console.error('Error processing tool call:', error);
                controller.error(error);
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
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