import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const weatherServer = new StdioClientTransport({
  command: "uv",
  args:[
    "--directory",
    "/Users/douglasqian/weather",
    "run",
    "weather.py"
]
});

const client = new Client(
  {
    name: "cad-agent-mcp-client",
    version: "1.0.0"
  }
);

await client.connect(weatherServer);

