import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

interface OBJLoaderProps {
  fileData: {
    data: string;  // base64 encoded file data
    contentType: string;
    filename: string;
  };
  onLoad?: (object: THREE.Group) => void;
  onError?: (error: Error) => void;
}

export function OBJLoaderComponent({ fileData, onLoad, onError }: OBJLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    console.log('OBJLoaderComponent mounted with fileData:', fileData); // Debug log
    if (!containerRef.current) {
      console.error('Container ref is not available'); // Debug log
      return;
    }

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    console.log('File data changed:', fileData); // Debug log
    if (!fileData) {
      console.error('No file data provided'); // Debug log
      return;
    }
    if (!sceneRef.current) {
      console.error('Scene is not initialized'); // Debug log
      return;
    }

    try {
      // Decode base64 data
      console.log('Decoding base64 data...'); // Debug log
      const binaryString = atob(fileData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: fileData.contentType });
      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url); // Debug log

      // Load OBJ file
      const loader = new OBJLoader();
      console.log('Loading OBJ file...'); // Debug log
      loader.load(
        url,
        (object: THREE.Group) => {
          console.log('OBJ file loaded successfully'); // Debug log
          // Center the object
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          object.position.sub(center);

          // Scale the object to fit the view
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          object.scale.multiplyScalar(scale);

          // Add to scene
          if (sceneRef.current) {
            // Remove existing objects
            while (sceneRef.current.children.length > 0) {
              const child = sceneRef.current.children[0];
              if (child instanceof THREE.Light) {
                sceneRef.current.children.push(child);
              }
              sceneRef.current.remove(child);
            }
            sceneRef.current.add(object);
            console.log('Object added to scene'); // Debug log
          }

          // Call onLoad callback
          onLoad?.(object);

          // Cleanup
          URL.revokeObjectURL(url);
        },
        (xhr) => {
          console.log('Loading progress:', (xhr.loaded / xhr.total * 100) + '%'); // Debug log
        },
        (error: unknown) => {
          console.error('Error loading OBJ file:', error);
          onError?.(error instanceof Error ? error : new Error('Failed to load OBJ file'));
          URL.revokeObjectURL(url);
        }
      );
    } catch (error) {
      console.error('Error processing file data:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to process file data'));
    }
  }, [fileData, onLoad, onError]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        backgroundColor: '#f0f0f0' // Add background color to make container visible
      }}
    />
  );
} 