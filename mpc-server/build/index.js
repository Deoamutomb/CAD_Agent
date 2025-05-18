import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ObjProcessor } from "./obj-processor.js";
import { z } from "zod";
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
server.resource("obj-model-list", new ResourceTemplate("obj-model-list:/", { list: undefined }), async (uri) => {
    const models = await objProcessor.listModels();
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(models)
            }
        ]
    };
});
server.resource("obj-model", new ResourceTemplate("obj-model://{model_id}", { list: undefined }), async (uri) => {
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
});
server.resource("obj-model-metadata", new ResourceTemplate("obj-model-metadata://{model_id}", { list: undefined }), async (uri) => {
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
});
// Register tools
server.tool("analyze_obj", { model_id: z.string().describe("ID of the OBJ model to analyze") }, async ({ model_id }) => {
    const analysis = await objProcessor.analyzeModel(model_id);
    return {
        content: [{ type: "text", text: JSON.stringify(analysis) }]
    };
});
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
server.tool("add-objects", "Creates new objects in a 3D scene.", {
    newObjects: z.array(z.object({
        type: z.enum(["cube", "cylinder", "sphere", "gear"]).describe("Type of 3D object to create"),
        position: z.object({
            x: z.number().describe("X coordinate"),
            y: z.number().describe("Y coordinate"),
            z: z.number().describe("Z coordinate")
        })
    })).describe("A new object with its position"),
}, async ({ newObjects }) => {
    return {
        content: [{ type: "text", text: JSON.stringify(newObjects) }],
        object: newObjects
    };
});
server.tool("remove-objects", "Removes objects in a 3D scene.", {
    objectIds: z.array(z.string().describe("ID of the object to remove")).describe("List of object IDs to remove from the scene"),
}, async ({ objectIds }) => {
    return {
        content: [{ type: "text", text: JSON.stringify(objectIds) }],
        objectIds: objectIds
    };
});
server.tool("reposition-objects", "Update position of objects in a 3D scene.", {
    objects: z.array(z.object({
        id: z.string().describe("Object ID"),
        position: z.object({
            x: z.number().describe("X coordinate"),
            y: z.number().describe("Y coordinate"),
            z: z.number().describe("Z coordinate")
        })
    })).describe("List of objects with their new positions"),
}, async ({ objects }) => {
    const newObjects = objects.map((object) => {
        return {
            ...object,
            position: {
                ...object.position,
                x: object.position.x - 1,
                y: object.position.y - 1,
                z: object.position.z - 1
            }
        };
    });
    return {
        content: [{ type: "text", text: JSON.stringify(newObjects) }],
        objects: newObjects
    };
});
server.tool("list_models", {}, async () => {
    const models = await objProcessor.listModels();
    const res = JSON.stringify(models);
    console.log("list_models res", res);
    return {
        content: [{ type: "text", text: JSON.stringify(models) }]
    };
});
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
server.tool("download_file", "Download a file from S3", {
    s3Path: z.string().describe("Full S3 path to the file (e.g., s3://bucket-name/path/to/file)")
}, async ({ s3Path }) => {
    const { data, contentType } = await objProcessor.downloadFile(s3Path);
    return {
        content: [{
                type: "text",
                text: `File downloaded successfully. Content-Type: ${contentType}, Size: ${data.length} bytes`
            }],
        file: {
            data: data.toString('base64'),
            contentType,
            filename: s3Path.split('/').pop() || 'downloaded_file'
        }
    };
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
