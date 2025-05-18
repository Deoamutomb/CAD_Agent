import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
export class ObjProcessor {
    models = new Map();
    loader;
    basePath;
    s3Client;
    bucketName;
    constructor(options) {
        this.basePath = options.basePath;
        this.loader = new OBJLoader();
        // Parse S3 URL
        const s3Url = new URL(options.basePath);
        if (s3Url.protocol !== 's3:') {
            throw new Error('basePath must be an S3 URL (s3://bucket-name)');
        }
        this.bucketName = s3Url.hostname;
        // Initialize S3 client
        this.s3Client = new S3Client({
            region: 'us-east-2',
        });
        // console.log('S3 client initialized');
        // List and print all files in the bucket on startup
        this.printBucketContents().catch(error => {
            //   console.error('Error listing bucket contents:', error);
        });
    }
    async printBucketContents() {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: ''
            });
            const response = await this.s3Client.send(command);
            const files = response.Contents || [];
            //   console.log('\nFiles in S3 bucket:', this.bucketName);
            //   console.log('----------------------------------------');
            if (files.length === 0) {
                // console.log('No files found in bucket');
            }
            else {
                files.forEach(file => {
                    //   console.log(`- ${file.Key} (${file.Size} bytes, last modified: ${file.LastModified})`);
                });
            }
            //   console.log('----------------------------------------\n');
        }
        catch (error) {
            console.error('Failed to list bucket contents:', error);
        }
    }
    async getS3Object(key) {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });
        const response = await this.s3Client.send(command);
        if (!response.Body) {
            throw new Error(`Failed to get object ${key} from S3`);
        }
        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async getMetadataKey(fileKey) {
        return `${fileKey}.metadata.json`;
    }
    async getFileMetadata(fileKey) {
        try {
            const metadataKey = await this.getMetadataKey(fileKey);
            const metadataBuffer = await this.getS3Object(metadataKey);
            return JSON.parse(metadataBuffer.toString());
        }
        catch (error) {
            if (error.name === 'NoSuchKey') {
                return null;
            }
            throw error;
        }
    }
    async setFileMetadata(fileKey, metadata) {
        const metadataKey = await this.getMetadataKey(fileKey);
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: metadataKey,
            Body: JSON.stringify(metadata, null, 2),
            ContentType: 'application/json'
        });
        await this.s3Client.send(command);
    }
    async loadModel(id, filePath) {
        // Get the file from S3
        const s3Key = filePath.replace(this.basePath, '').replace(/^\//, '');
        const fileBuffer = await this.getS3Object(s3Key);
        // Load the OBJ file using the buffer
        const object = await this.loader.parse(fileBuffer.toString());
        // Get the first mesh from the object
        const mesh = object.children[0];
        const geometry = mesh.geometry;
        const model = {
            id,
            name: filePath.split('/').pop() || id,
            created: new Date(),
            modified: new Date(),
            triangleCount: geometry.index ? geometry.index.count / 3 : 0,
            vertices: geometry.attributes.position.array,
            normals: geometry.attributes.normal.array,
            uvs: geometry.attributes.uv?.array || new Float32Array(),
            boundingBox: {
                min: [geometry.boundingBox?.min.x || 0, geometry.boundingBox?.min.y || 0, geometry.boundingBox?.min.z || 0],
                max: [geometry.boundingBox?.max.x || 0, geometry.boundingBox?.max.y || 0, geometry.boundingBox?.max.z || 0]
            }
        };
        this.models.set(id, model);
        return model;
    }
    async analyzeModel(id) {
        let model = this.models.get(id);
        if (!model) {
            // Model not found in memory, try to load it
            try {
                model = await this.loadModel(id, `${id}.obj`);
            }
            catch (error) {
                throw new Error(`Model ${id} not found or could not be loaded: ${error.message}`);
            }
        }
        // Calculate volume using the shoelace formula
        let volume = 0;
        for (let i = 0; i < model.vertices.length; i += 9) {
            const v1 = new THREE.Vector3(model.vertices[i], model.vertices[i + 1], model.vertices[i + 2]);
            const v2 = new THREE.Vector3(model.vertices[i + 3], model.vertices[i + 4], model.vertices[i + 5]);
            const v3 = new THREE.Vector3(model.vertices[i + 6], model.vertices[i + 7], model.vertices[i + 8]);
            volume += v1.dot(v2.cross(v3)) / 6;
        }
        // Calculate surface area
        let surfaceArea = 0;
        for (let i = 0; i < model.vertices.length; i += 9) {
            const v1 = new THREE.Vector3(model.vertices[i], model.vertices[i + 1], model.vertices[i + 2]);
            const v2 = new THREE.Vector3(model.vertices[i + 3], model.vertices[i + 4], model.vertices[i + 5]);
            const v3 = new THREE.Vector3(model.vertices[i + 6], model.vertices[i + 7], model.vertices[i + 8]);
            const area = v2.sub(v1).cross(v3.sub(v1)).length() / 2;
            surfaceArea += area;
        }
        return {
            triangleCount: model.triangleCount,
            vertexCount: model.vertices.length / 3,
            boundingBox: model.boundingBox,
            volume: Math.abs(volume),
            surfaceArea,
            manifold: true, // TODO: Implement manifold check
            waterTight: true // TODO: Implement watertight check
        };
    }
    async listModels() {
        const command = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: ''
        });
        const response = await this.s3Client.send(command);
        const models = response.Contents?.map(object => ({
            id: object.Key?.replace('.obj', '') || '',
            name: object.Key?.split('/').pop()?.replace('.obj', '') || '',
            created: object.LastModified || new Date(),
            modified: object.LastModified || new Date()
        })) || [];
        return models;
    }
    async modifyModel(id, options) {
        const model = this.models.get(id);
        if (!model) {
            throw new Error(`Model ${id} not found`);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(model.normals, 3));
        if (model.uvs.length > 0) {
            geometry.setAttribute('uv', new THREE.BufferAttribute(model.uvs, 2));
        }
        if (options.scale) {
            geometry.scale(options.scale[0], options.scale[1], options.scale[2]);
        }
        if (options.rotate) {
            geometry.rotateX(options.rotate[0]);
            geometry.rotateY(options.rotate[1]);
            geometry.rotateZ(options.rotate[2]);
        }
        if (options.translate) {
            geometry.translate(options.translate[0], options.translate[1], options.translate[2]);
        }
        const modifiedModel = {
            ...model,
            modified: new Date(),
            vertices: geometry.attributes.position.array,
            normals: geometry.attributes.normal.array,
            uvs: geometry.attributes.uv?.array || model.uvs,
            boundingBox: {
                min: [geometry.boundingBox?.min.x || 0, geometry.boundingBox?.min.y || 0, geometry.boundingBox?.min.z || 0],
                max: [geometry.boundingBox?.max.x || 0, geometry.boundingBox?.max.y || 0, geometry.boundingBox?.max.z || 0]
            }
        };
        this.models.set(id, modifiedModel);
        return modifiedModel;
    }
}
