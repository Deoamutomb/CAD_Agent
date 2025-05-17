import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { z } from 'zod';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface StlModel {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  triangleCount: number;
  vertices: Float32Array;
  normals: Float32Array;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface StlAnalysis {
  triangleCount: number;
  vertexCount: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  volume: number;
  surfaceArea: number;
  manifold: boolean;
  waterTight: boolean;
}

export class StlProcessor {
  private models: Map<string, StlModel> = new Map();
  private loader: STLLoader;
  private basePath: string;
  private s3Client: S3Client;
  private bucketName: string;

  constructor(options: { basePath: string }) {
    this.basePath = options.basePath;
    this.loader = new STLLoader();
    
    // Parse S3 URL
    const s3Url = new URL(options.basePath);
    if (s3Url.protocol !== 's3:') {
      throw new Error('basePath must be an S3 URL (s3://bucket-name)');
    }
    this.bucketName = s3Url.hostname;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: 'us-east-2',
      credentials: undefined
    });
  }

  private async getS3Object(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Failed to get object ${key} from S3`);
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async loadModel(id: string, filePath: string): Promise<StlModel> {
    // Get the file from S3
    const s3Key = filePath.replace(this.basePath, '').replace(/^\//, '');
    const fileBuffer = await this.getS3Object(s3Key);
    
    // Load the STL file using the buffer
    const geometry = await this.loader.parse(fileBuffer);
    
    const model: StlModel = {
      id,
      name: filePath.split('/').pop() || id,
      created: new Date(),
      modified: new Date(),
      triangleCount: geometry.index ? geometry.index.count / 3 : 0,
      vertices: geometry.attributes.position.array as Float32Array,
      normals: geometry.attributes.normal.array as Float32Array,
      boundingBox: {
        min: [geometry.boundingBox?.min.x || 0, geometry.boundingBox?.min.y || 0, geometry.boundingBox?.min.z || 0],
        max: [geometry.boundingBox?.max.x || 0, geometry.boundingBox?.max.y || 0, geometry.boundingBox?.max.z || 0]
      }
    };
    this.models.set(id, model);
    return model;
  }

  async analyzeModel(id: string): Promise<StlAnalysis> {
    const model = this.models.get(id);
    if (!model) {
      throw new Error(`Model ${id} not found`);
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

  async listModels(): Promise<Array<{ id: string; name: string; created: Date; modified: Date }>> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: ''
    });

    const response = await this.s3Client.send(command);
    const models = response.Contents?.map(object => ({
      id: object.Key?.replace('.stl', '') || '',
      name: object.Key?.split('/').pop()?.replace('.stl', '') || '',
      created: object.LastModified || new Date(),
      modified: object.LastModified || new Date()
    })) || [];

    return models;
  }

  async modifyModel(id: string, options: {
    scale?: [number, number, number];
    rotate?: [number, number, number];
    translate?: [number, number, number];
  }): Promise<StlModel> {
    const model = this.models.get(id);
    if (!model) {
      throw new Error(`Model ${id} not found`);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(model.normals, 3));

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

    const modifiedModel: StlModel = {
      ...model,
      modified: new Date(),
      vertices: geometry.attributes.position.array as Float32Array,
      normals: geometry.attributes.normal.array as Float32Array,
      boundingBox: {
        min: [geometry.boundingBox?.min.x || 0, geometry.boundingBox?.min.y || 0, geometry.boundingBox?.min.z || 0],
        max: [geometry.boundingBox?.max.x || 0, geometry.boundingBox?.max.y || 0, geometry.boundingBox?.max.z || 0]
      }
    };

    this.models.set(id, modifiedModel);
    return modifiedModel;
  }
} 