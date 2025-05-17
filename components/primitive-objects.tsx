"use client"

import { useRef, MouseEvent as ReactMouseEvent } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"

// Define common prop types
interface PrimitiveBaseProps {
  position?: [number, number, number];
  color?: string;
  selected?: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (event: ReactMouseEvent, id: string) => void;
  id: string;
}

interface CubeProps extends PrimitiveBaseProps {
  size?: [number, number, number];
}

export function Cube({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: CubeProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size as [number, number, number]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, (size ? size[1] : 1) / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cube</div>
        </Html>
      )}
    </mesh>
  )
}

interface SphereProps extends PrimitiveBaseProps {
  radius?: number;
}

export function Sphere({
  position = [0, 0, 0],
  radius = 0.5,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: SphereProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, radius + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Sphere</div>
        </Html>
      )}
    </mesh>
  )
}

interface CylinderProps extends PrimitiveBaseProps {
  args?: [number, number, number, number]; // [radiusTop, radiusBottom, height, radialSegments]
}

export function Cylinder({
  position = [0, 0, 0],
  args = [0.5, 0.5, 1, 32],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: CylinderProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={args as [number, number, number, number]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, (args ? args[2] : 1) / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cylinder</div>
        </Html>
      )}
    </mesh>
  )
}

interface ConeProps extends PrimitiveBaseProps {
  args?: [number, number, number]; // [radius, height, radialSegments]
}

export function Cone({
  position = [0, 0, 0],
  args = [0.5, 1, 32],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: ConeProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      castShadow
      receiveShadow
    >
      <coneGeometry args={args as [number, number, number]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, (args ? args[1] : 1) / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cone</div>
        </Html>
      )}
    </mesh>
  )
}

interface PlaneProps extends PrimitiveBaseProps {
  size?: [number, number];
}

export function Plane({
  position = [0, 0, 0],
  size = [1, 1],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: PlaneProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      receiveShadow
    >
      <planeGeometry args={[...(size || [1, 1]), 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
        side={THREE.DoubleSide}
      />
      {selected && (
        <Html position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Plane</div>
        </Html>
      )}
    </mesh>
  )
}

// Mechanical primitives
interface GearProps extends PrimitiveBaseProps {
  radius?: number;
  teeth?: number;
}

export function Gear({
  position = [0, 0, 0],
  radius = 0.5,
  teeth = 10,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: GearProps) {
  const group = useRef<THREE.Group>(null!)

  return (
    <group
      ref={group}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
    >
      {/* Base cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.2, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.1 : 0}
        />
      </mesh>

      {/* Teeth */}
      {Array.from({ length: teeth }).map((_, i) => {
        const angle = (i / teeth) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <mesh key={i} position={[x * 1.1, 0, z * 1.1]} rotation={[0, -angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <meshStandardMaterial
              color={color}
              emissive={selected ? "#ffffff" : "#000000"}
              emissiveIntensity={selected ? 0.1 : 0}
            />
          </mesh>
        )
      })}

      {/* Center hole */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 0.2, radius * 0.2, 0.3, 16]} />
        <meshStandardMaterial
          color="#333333"
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.05 : 0}
        />
      </mesh>

      {selected && (
        <Html position={[0, 0.5, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Gear</div>
        </Html>
      )}
    </group>
  )
}

interface HexProps extends PrimitiveBaseProps {
  radius?: number;
  height?: number;
}

export function Hex({
  position = [0, 0, 0],
  radius = 0.5,
  height = 0.2,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}: HexProps) {
  const mesh = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onContextMenu(e as unknown as ReactMouseEvent, id);
      }}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, height, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, height / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Hex</div>
        </Html>
      )}
    </mesh>
  )
}
