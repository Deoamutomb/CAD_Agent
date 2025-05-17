"use client"

import { useRef } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"

// Basic primitives
export function Cube({
  position = [0, 0, 0],
  size = [1, 1, 1],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, size[1] / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cube</div>
        </Html>
      )}
    </mesh>
  )
}

export function Sphere({
  position = [0, 0, 0],
  radius = 0.5,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
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

export function Cylinder({
  position = [0, 0, 0],
  args = [0.5, 0.5, 1, 32],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, args[2] / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cylinder</div>
        </Html>
      )}
    </mesh>
  )
}

export function Cone({
  position = [0, 0, 0],
  args = [0.5, 1, 32],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
      castShadow
      receiveShadow
    >
      <coneGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? "#ffffff" : "#000000"}
        emissiveIntensity={selected ? 0.1 : 0}
      />
      {selected && (
        <Html position={[0, args[1] / 2 + 0.3, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Cone</div>
        </Html>
      )}
    </mesh>
  )
}

export function Plane({
  position = [0, 0, 0],
  size = [1, 1],
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

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
      onContextMenu={onContextMenu}
      receiveShadow
    >
      <planeGeometry args={[...size, 1, 1]} />
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
export function Gear({
  position = [0, 0, 0],
  radius = 0.5,
  teeth = 10,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <group
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
    >
      {/* Base cylinder */}
      <mesh ref={mesh} castShadow receiveShadow>
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

export function Hex({
  position = [0, 0, 0],
  radius = 0.5,
  height = 0.2,
  color = "#ffffff",
  selected = false,
  onSelect,
  onContextMenu,
  id,
}) {
  const mesh = useRef()

  return (
    <mesh
      ref={mesh}
      name={id}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onContextMenu={onContextMenu}
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
