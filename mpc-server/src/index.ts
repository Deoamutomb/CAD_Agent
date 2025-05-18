import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ObjProcessor } from "./obj-processor.js";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

// Create an MCP server
const server = new McpServer({
  name: "obj-processor-server",
  version: "1.0.0",
  description: "MCP server for processing OBJ files in industrial design"
});

// Initialize OBJ processor
const objProcessor = new ObjProcessor({
  basePath: "s3://alyshahudson-obj-files",

});

// Register resources
server.resource(
  "obj-model-list",
  new ResourceTemplate("obj-model-list:/", { list: undefined }),
  async (uri) => {
    const models = await objProcessor.listModels();
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(models)
        }
      ]
    };
  }
);

server.resource(
  "obj-model",
  new ResourceTemplate("obj-model://{model_id}", { list: undefined }),
  async (uri) => {
    const modelId = uri.pathname.split('/').pop() || '';
    const model = await objProcessor.loadModel(modelId, `${modelId}.obj`);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(model)
        }
      ]
    };
  }
);

server.resource(
  "obj-model-metadata",
  new ResourceTemplate("obj-model-metadata://{model_id}", { list: undefined }),
  async (uri) => {
    const modelId = uri.pathname.split('/').pop() || '';
    const analysis = await objProcessor.analyzeModel(modelId);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(analysis)
        }
      ]
    };
  }
);


// Register tools
server.tool(
  "analyze_obj",
  { model_id: z.string().describe("ID of the OBJ model to analyze") },
  async ({ model_id }) => {
    const analysis = await objProcessor.analyzeModel(model_id);
    return {
      content: [{ type: "text", text: JSON.stringify(analysis) }]
    };
  }
);


// server.tool(
//   "modify_obj",
//   {
//     model_id: z.string().describe("ID of the OBJ model to modify"),
//     scale: z.tuple([z.number(), z.number(), z.number()]).optional().describe("Scale factors [x, y, z]"),
//     rotate: z.tuple([z.number(), z.number(), z.number()]).optional().describe("Rotation angles in radians [x, y, z]"),
//     translate: z.tuple([z.number(), z.number(), z.number()]).optional().describe("Translation vector [x, y, z]")
//   },
//   async ({ model_id, scale, rotate, translate }) => {
//     const modifiedModel = await objProcessor.modifyModel(model_id, { scale, rotate, translate });
//     return {
//       content: [{ type: "text", text: JSON.stringify(modifiedModel) }]
//     };
//   }
// );

server.tool(
  "add-objects",
  "Creates new objects in a 3D scene.",
  {
    newObjects: z.array(
      z.object({
        type: z.enum(["cube", "cylinder", "sphere", "gear"]).describe("Type of 3D object to create"),
        position: z.object({
          x: z.number().describe("X coordinate"),
          y: z.number().describe("Y coordinate"),
          z: z.number().describe("Z coordinate")
        })
      })
    ).describe("A new object with its position"),
  },
  async ({ newObjects }) => {


    return {
      content: [{ type: "text", text: JSON.stringify(newObjects) }],
      object: newObjects
    };
  }
);

server.tool(
  "remove-objects",
  "Removes objects in a 3D scene.",
  {
    objectIds: z.array(
      z.string().describe("ID of the object to remove")
    ).describe("List of object IDs to remove from the scene"),
  },
  async ({ objectIds }) => {

    return {
      content: [{ type: "text", text: JSON.stringify(objectIds) }],
      objectIds: objectIds
    };
  }
);


server.tool(
  "reposition-objects",
  "Update position of objects in a 3D scene.",
  {
    objects: z.array(
      z.object({
        id: z.string().describe("Object ID"),
        position: z.object({
          x: z.number().describe("X coordinate"),
          y: z.number().describe("Y coordinate"),
          z: z.number().describe("Z coordinate")
        })
      })
    ).describe("List of objects with their new positions"),
  },
  async ({ objects }) => {

    const newObjects = objects.map((object) => {
      return {
        ...object,
        position: {
          ...object.position,
          x: object.position.x - 1,
          y: object.position.y - 1,
          z: object.position.z - 1
        }
      }
    });

    return {
      content: [{ type: "text", text: JSON.stringify(newObjects) }],
      objects: newObjects
    };
  }
);

server.tool(
  "list_models",
  {},
  async () => {
    const models = await objProcessor.listModels();
    return {
      content: [{ type: "text", text: JSON.stringify(models) }]
    };
  }
);

server.tool("set_file_metadata", {
  file_key: z.string().describe("The key of the file in S3"),
  metadata: z.record(z.any()).describe("The metadata to store as a JSON object")
}, async ({ file_key, metadata }) => {
  await objProcessor.setFileMetadata(file_key, metadata);
  return {
    content: [{ type: "text", text: "Metadata updated successfully" }]
  };
});

server.tool("get_file_metadata", {
  file_key: z.string().describe("The key of the file in S3")
}, async ({ file_key }) => {
  const metadata = await objProcessor.getFileMetadata(file_key);
  return {
    content: [{ type: "text", text: JSON.stringify(metadata) }]
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);



// This is just an example file showing how to create a weather service using the MCP SDK
// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import { z } from "zod";

// const NWS_API_BASE = "https://api.weather.gov";
// const USER_AGENT = "weather-app/1.0";

// // Helper function for making NWS API requests
// async function makeNWSRequest<T>(url: string): Promise<T | null> {
//   const headers = {
//     "User-Agent": USER_AGENT,
//     Accept: "application/geo+json",
//   };

//   try {
//     const response = await fetch(url, { headers });
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     return (await response.json()) as T;
//   } catch (error) {
//     console.error("Error making NWS request:", error);
//     return null;
//   }
// }

// interface AlertFeature {
//   properties: {
//     event?: string;
//     areaDesc?: string;
//     severity?: string;
//     status?: string;
//     headline?: string;
//   };
// }

// // Format alert data
// function formatAlert(feature: AlertFeature): string {
//   const props = feature.properties;
//   return [
//     `Event: ${props.event || "Unknown"}`,
//     `Area: ${props.areaDesc || "Unknown"}`,
//     `Severity: ${props.severity || "Unknown"}`,
//     `Status: ${props.status || "Unknown"}`,
//     `Headline: ${props.headline || "No headline"}`,
//     "---",
//   ].join("\n");
// }

// interface ForecastPeriod {
//   name?: string;
//   temperature?: number;
//   temperatureUnit?: string;
//   windSpeed?: string;
//   windDirection?: string;
//   shortForecast?: string;
// }

// interface AlertsResponse {
//   features: AlertFeature[];
// }

// interface PointsResponse {
//   properties: {
//     forecast?: string;
//   };
// }

// interface ForecastResponse {
//   properties: {
//     periods: ForecastPeriod[];
//   };
// }

// // Create server instance
// const server = new McpServer({
//   name: "weather",
//   version: "1.0.0",
// });

// // Register weather tools
// server.tool(
//   "get-alerts",
//   "Get weather alerts for a state",
//   {
//     state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
//   },
//   async ({ state }) => {
//     const stateCode = state.toUpperCase();
//     const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
//     const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

//     if (!alertsData) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: "Failed to retrieve alerts data",
//           },
//         ],
//       };
//     }

//     const features = alertsData.features || [];
//     if (features.length === 0) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: `No active alerts for ${stateCode}`,
//           },
//         ],
//       };
//     }

//     const formattedAlerts = features.map(formatAlert);
//     const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

//     return {
//       content: [
//         {
//           type: "text",
//           text: alertsText,
//         },
//       ],
//     };
//   },
// );

// server.tool(
//   "get-forecast",
//   "Get weather forecast for a location",
//   {
//     latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
//     longitude: z
//       .number()
//       .min(-180)
//       .max(180)
//       .describe("Longitude of the location"),
//   },
//   async ({ latitude, longitude }) => {
//     // Get grid point data
//     const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
//     const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

//     if (!pointsData) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
//           },
//         ],
//       };
//     }

//     const forecastUrl = pointsData.properties?.forecast;
//     if (!forecastUrl) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: "Failed to get forecast URL from grid point data",
//           },
//         ],
//       };
//     }

//     // Get forecast data
//     const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
//     if (!forecastData) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: "Failed to retrieve forecast data",
//           },
//         ],
//       };
//     }

//     const periods = forecastData.properties?.periods || [];
//     if (periods.length === 0) {
//       return {
//         content: [
//           {
//             type: "text",
//             text: "No forecast periods available",
//           },
//         ],
//       };
//     }

//     // Format forecast periods
//     const formattedForecast = periods.map((period: ForecastPeriod) =>
//       [
//         `${period.name || "Unknown"}:`,
//         `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
//         `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
//         `${period.shortForecast || "No forecast available"}`,
//         "---",
//       ].join("\n"),
//     );

//     const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

//     return {
//       content: [
//         {
//           type: "text",
//           text: forecastText,
//         },
//       ],
//     };
//   },
// );

