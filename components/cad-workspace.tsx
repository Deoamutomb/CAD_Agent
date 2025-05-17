"use client"

import { ContextMenuTrigger } from "@/components/ui/context-menu"

import { useState, useRef, Suspense, useCallback, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Html, TransformControls, Grid } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CuboidIcon as Cube,
  PanelLeft,
  PanelRight,
  Maximize,
  RotateCcw,
  Move,
  ZoomIn,
  Save,
  Upload,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Wand2,
  MessageSquareText,
  DollarSign,
  CheckSquare,
  Search,
  Plus,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { PrimitivesToolbar } from "@/components/primitives-toolbar"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import * as THREE from "three"

// Import primitive components
import {
  Cube as CubePrimitive,
  Sphere as SpherePrimitive,
  Cylinder as CylinderPrimitive,
  Cone as ConePrimitive,
  Plane as PlanePrimitive,
  Gear as GearPrimitive,
  Hex as HexPrimitive,
} from "@/components/primitive-objects"

// Import other icons
import { Circle, Cylinder, Cone, Square } from "lucide-react"

// Mock camera model using basic geometries instead of loading external files
function CameraModel({ color = "#b19cd9", position = [0, 0, 0], selected = false, onSelect }) {
  const group = useRef()

  return (
    <group
      position={position}
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      scale={[1, 1, 1]}
    >
      {/* Camera body */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1, 2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.1 : 0}
        />
      </mesh>

      {/* Camera lens */}
      <mesh castShadow receiveShadow position={[0, 0, 1.2]}>
        <cylinderGeometry args={[0.4, 0.5, 0.8, 16]} />
        <meshStandardMaterial
          color="#333333"
          roughness={0.2}
          metalness={0.8}
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.1 : 0}
        />
      </mesh>

      {/* Camera viewfinder */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0.3]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial
          color="#222222"
          roughness={0.3}
          metalness={0.5}
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.1 : 0}
        />
      </mesh>

      {/* Camera button */}
      <mesh castShadow receiveShadow position={[0.8, 0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial
          color="#ff3333"
          roughness={0.3}
          metalness={0.1}
          emissive={selected ? "#ffffff" : "#000000"}
          emissiveIntensity={selected ? 0.1 : 0}
        />
      </mesh>

      {selected && (
        <Html position={[0, 1.2, 0]}>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Camera Model</div>
        </Html>
      )}
    </group>
  )
}

// Scene setup with grid and models
function Scene({
  objects,
  selectedObject,
  setSelectedObject,
  onDeleteObject,
  onDuplicateObject,
  transformMode,
  onObjectTransform,
}) {
  const { camera, scene } = useThree()
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuObject, setContextMenuObject] = useState(null)
  const [selectedMesh, setSelectedMesh] = useState(null)

  // Effect to get the actual mesh object when selectedObject (ID) changes
  useEffect(() => {
    if (selectedObject && scene) {
      const mesh = scene.getObjectByName(selectedObject)
      setSelectedMesh(mesh || null)
    } else {
      setSelectedMesh(null)
    }
  }, [selectedObject, scene])

  // Handle right-click on objects
  const handleContextMenu = (e, object) => {
    e.stopPropagation()
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuObject(object.id)
    setShowContextMenu(true)
  }

  // Handle right-click on canvas (background)
  const handleCanvasContextMenu = (e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuObject(null)
    setShowContextMenu(true)
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => {
      if (showContextMenu) {
        setShowContextMenu(false)
      }
    }
    window.addEventListener("click", handleClick)
    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [showContextMenu])

  // Handle transform changes
  const handleTransformChange = (event) => {
    if (event && event.target && event.target.object) {
      const transformedObject = event.target.object
      const { x: posX, y: posY, z: posZ } = transformedObject.position
      const { x: rotX, y: rotY, z: rotZ } = transformedObject.rotation
      const { x: scaleX, y: scaleY, z: scaleZ } = transformedObject.scale

      const transformData = {
        position: [posX, posY, posZ],
        rotation: [rotX, rotY, rotZ],
        scale: [scaleX, scaleY, scaleZ],
      }

      if (selectedObject) {
        onObjectTransform(selectedObject, transformData)
      }
    }
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6f6f6f"
        sectionSize={3}
        sectionThickness={1.5}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1.5}
      />

      {/* Render all objects */}
      {objects.map((object) => {
        switch (object.type) {
          case "cube":
            return (
              <CubePrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                size={object.size || [1, 1, 1]}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "sphere":
            return (
              <SpherePrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                radius={object.radius || 0.5}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "cylinder":
            return (
              <CylinderPrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                args={object.args || [0.5, 0.5, 1, 32]}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "cone":
            return (
              <ConePrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                args={object.args || [0.5, 1, 32]}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "plane":
            return (
              <PlanePrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                size={object.size || [1, 1]}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "gear":
            return (
              <GearPrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                radius={object.radius || 0.7}
                teeth={object.teeth || 10}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          case "hex":
            return (
              <HexPrimitive
                key={object.id}
                id={object.id}
                position={object.position}
                radius={object.radius || 0.5}
                height={object.height || 0.2}
                color={object.color}
                selected={selectedObject === object.id}
                onSelect={() => setSelectedObject(object.id)}
                onContextMenu={(e) => handleContextMenu(e, object)}
              />
            )
          default:
            return null
        }
      })}

      {/* Transform controls for selected object */}
      {selectedMesh && (
        <TransformControls object={selectedMesh} mode={transformMode} onObjectChange={handleTransformChange} />
      )}

      {/* Context menu for objects */}
      {showContextMenu && (
        <Html
          position={[0, 0, 0]}
          style={{ position: "absolute", left: contextMenuPosition.x, top: contextMenuPosition.y, zIndex: 1000 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 p-1 min-w-[160px]">
            {contextMenuObject ? (
              <>
                <button
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    setSelectedObject(contextMenuObject)
                    setShowContextMenu(false)
                  }}
                >
                  Select
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    onDuplicateObject(contextMenuObject)
                    setShowContextMenu(false)
                  }}
                >
                  Duplicate
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button
                  className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    onDeleteObject(contextMenuObject)
                    setShowContextMenu(false)
                  }}
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    // Add a cube at the camera's position
                    const direction = new THREE.Vector3()
                    camera.getWorldDirection(direction)
                    const position = new THREE.Vector3()
                    camera.getWorldPosition(position)
                    position.add(direction.multiplyScalar(5))

                    // Add a new cube
                    const newObject = {
                      id: `cube_${Date.now()}`,
                      type: "cube",
                      position: [position.x, position.y, position.z],
                      color: "#9ae6b4",
                    }

                    // Add the object to the scene
                    // This would be handled by the parent component
                    setShowContextMenu(false)
                  }}
                >
                  Add Cube
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    // Similar to adding a cube
                    setShowContextMenu(false)
                  }}
                >
                  Add Sphere
                </button>
              </>
            )}
          </div>
        </Html>
      )}
    </>
  )
}

// Custom gear icon since Lucide doesn't have one
const GearIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 4 L12 2"></path>
    <path d="M12 22 L12 20"></path>
    <path d="M4 12 L2 12"></path>
    <path d="M22 12 L20 12"></path>
    <path d="M6.34 6.34 L4.93 4.93"></path>
    <path d="M19.07 19.07 L17.66 17.66"></path>
    <path d="M6.34 17.66 L4.93 19.07"></path>
    <path d="M19.07 4.93 L17.66 6.34"></path>
    <path d="M15.5 8.5 L17.5 6.5"></path>
    <path d="M8.5 15.5 L6.5 17.5"></path>
    <path d="M15.5 15.5 L17.5 17.5"></path>
    <path d="M8.5 8.5 L6.5 6.5"></path>
  </svg>
)

// Main CAD workspace component
export function CadWorkspace() {
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [selectedModel, setSelectedModel] = useState("camera")
  const [modelColor, setModelColor] = useState("#b19cd9") // Purple
  const [selectedObject, setSelectedObject] = useState(null)
  const [transformMode, setTransformMode] = useState("translate")
  const [activeTab, setActiveTab] = useState("transform")
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState(null)
  const { toast } = useToast()

  // State for objects in the scene
  const [objects, setObjects] = useState([
    { id: "cube_1", type: "cube", position: [-3, 0.5, 0], size: [1, 1, 1], color: "#9ae6b4" },
    { id: "sphere_1", type: "sphere", position: [-3, 0.5, 2], radius: 0.5, color: "#90cdf4" },
    { id: "cylinder_1", type: "cylinder", position: [-1, 0.5, -3], args: [0.5, 0.5, 1, 32], color: "#f6ad55" },
    { id: "gear_1", type: "gear", position: [3, 0.5, -2], radius: 0.7, color: "#fc8181" },
  ])

  // State for object properties
  const [objectProperties, setObjectProperties] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: { width: 10, height: 5, depth: 3 },
  })

  // History for undo/redo
  const [history, setHistory] = useState([objects])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Update object properties when selection changes
  useEffect(() => {
    if (selectedObject) {
      const object = objects.find((obj) => obj.id === selectedObject)
      if (object) {
        setObjectProperties({
          position: {
            x: object.position[0],
            y: object.position[1],
            z: object.position[2],
          },
          rotation: object.rotation
            ? {
                x: object.rotation[0],
                y: object.rotation[1],
                z: object.rotation[2],
              }
            : { x: 0, y: 0, z: 0 },
          scale: object.scale
            ? {
                x: object.scale[0],
                y: object.scale[1],
                z: object.scale[2],
              }
            : { x: 1, y: 1, z: 1 },
          dimensions: {
            width: object.size ? object.size[0] * 10 : 10,
            height: object.size ? object.size[1] * 10 : 5,
            depth: object.size ? object.size[2] * 10 : 3,
          },
        })
      }
    }
  }, [selectedObject, objects])

  // Handle adding a new primitive
  const handleAddPrimitive = useCallback(
    (primitiveType) => {
      // Generate a unique ID for the new primitive
      const id = `${primitiveType}_${Date.now()}`

      // Position the new primitive at a random location near the center
      const x = (Math.random() - 0.5) * 4
      const z = (Math.random() - 0.5) * 4

      // Create the new object
      const newObject = {
        id,
        type: primitiveType,
        position: [x, 0.5, z],
        color: getRandomColor(),
      }

      // Add specific properties based on primitive type
      switch (primitiveType) {
        case "cube":
          newObject.size = [1, 1, 1]
          break
        case "sphere":
          newObject.radius = 0.5
          break
        case "cylinder":
          newObject.args = [0.5, 0.5, 1, 32]
          break
        case "cone":
          newObject.args = [0.5, 1, 32]
          break
        case "plane":
          newObject.size = [1, 1]
          break
        case "gear":
          newObject.radius = 0.7
          newObject.teeth = 10
          break
        case "hex":
          newObject.radius = 0.5
          newObject.height = 0.2
          break
      }

      // Add the new object to the scene
      const newObjects = [...objects, newObject]
      setObjects(newObjects)

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newObjects)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Select the new object
      setSelectedObject(id)

      // Show a notification
      toast({
        title: "Object Added",
        description: `Added ${primitiveType} to the scene`,
      })
    },
    [objects, history, historyIndex, toast],
  )

  // Handle deleting an object
  const handleDeleteObject = useCallback((objectId) => {
    setObjectToDelete(objectId)
    setShowDeleteDialog(true)
  }, [])

  // Confirm object deletion
  const confirmDeleteObject = useCallback(() => {
    if (objectToDelete) {
      const newObjects = objects.filter((obj) => obj.id !== objectToDelete)
      setObjects(newObjects)

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newObjects)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Deselect if the selected object was deleted
      if (selectedObject === objectToDelete) {
        setSelectedObject(null)
      }

      // Show a notification
      toast({
        title: "Object Deleted",
        description: "Object has been removed from the scene",
      })

      setShowDeleteDialog(false)
      setObjectToDelete(null)
    }
  }, [objectToDelete, objects, history, historyIndex, selectedObject, toast])

  // Handle duplicating an object
  const handleDuplicateObject = useCallback(
    (objectId) => {
      const objectToDuplicate = objects.find((obj) => obj.id === objectId)

      if (objectToDuplicate) {
        // Create a new ID
        const newId = `${objectToDuplicate.type}_${Date.now()}`

        // Create a copy with a slight offset
        const newObject = {
          ...JSON.parse(JSON.stringify(objectToDuplicate)),
          id: newId,
          position: [
            objectToDuplicate.position[0] + 0.5,
            objectToDuplicate.position[1],
            objectToDuplicate.position[2] + 0.5,
          ],
        }

        // Add the new object to the scene
        const newObjects = [...objects, newObject]
        setObjects(newObjects)

        // Add to history
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newObjects)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)

        // Select the new object
        setSelectedObject(newId)

        // Show a notification
        toast({
          title: "Object Duplicated",
          description: `Duplicated ${objectToDuplicate.type}`,
        })
      }
    },
    [objects, history, historyIndex, toast],
  )

  // Handle object transformation
  const handleObjectTransform = useCallback(
    (objectId, transformData) => {
      // Update the object's position/rotation/scale
      const newObjects = objects.map((obj) => {
        if (obj.id === objectId) {
          return {
            ...obj,
            ...transformData,
          }
        }
        return obj
      })

      setObjects(newObjects)

      // We don't add to history here to avoid too many history entries
      // Instead, we'll add to history when the transform is complete
    },
    [objects],
  )

  // Handle property changes from the UI
  const handlePropertyChange = useCallback(
    (property, axis, value) => {
      if (!selectedObject) return

      // Update the local state
      setObjectProperties((prev) => ({
        ...prev,
        [property]: {
          ...prev[property],
          [axis]: Number.parseFloat(value),
        },
      }))

      // Update the object
      const newObjects = objects.map((obj) => {
        if (obj.id === selectedObject) {
          const newObj = { ...obj }

          if (property === "position") {
            newObj.position = [
              axis === "x" ? Number.parseFloat(value) : obj.position[0],
              axis === "y" ? Number.parseFloat(value) : obj.position[1],
              axis === "z" ? Number.parseFloat(value) : obj.position[2],
            ]
          } else if (property === "rotation") {
            newObj.rotation = newObj.rotation || [0, 0, 0]
            newObj.rotation = [
              axis === "x" ? Number.parseFloat(value) : newObj.rotation[0],
              axis === "y" ? Number.parseFloat(value) : newObj.rotation[1],
              axis === "z" ? Number.parseFloat(value) : newObj.rotation[2],
            ]
          } else if (property === "scale") {
            newObj.scale = newObj.scale || [1, 1, 1]
            newObj.scale = [
              axis === "x" ? Number.parseFloat(value) : newObj.scale[0],
              axis === "y" ? Number.parseFloat(value) : newObj.scale[1],
              axis === "z" ? Number.parseFloat(value) : newObj.scale[2],
            ]
          } else if (property === "dimensions") {
            if (obj.type === "cube") {
              const size = [
                axis === "width" ? Number.parseFloat(value) / 10 : obj.size[0],
                axis === "height" ? Number.parseFloat(value) / 10 : obj.size[1],
                axis === "depth" ? Number.parseFloat(value) / 10 : obj.size[2],
              ]
              newObj.size = size
            } else if (obj.type === "sphere") {
              if (axis === "width") {
                newObj.radius = Number.parseFloat(value) / 20
              }
            } else if (obj.type === "cylinder") {
              const args = [...obj.args]
              if (axis === "width") {
                args[0] = Number.parseFloat(value) / 20
                args[1] = Number.parseFloat(value) / 20
              }
              if (axis === "height") {
                args[2] = Number.parseFloat(value) / 10
              }
              newObj.args = args
            }
          }

          return newObj
        }
        return obj
      })

      setObjects(newObjects)
    },
    [selectedObject, objects],
  )

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setObjects(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setObjects(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Generate a random color
  const getRandomColor = () => {
    const colors = ["#9ae6b4", "#90cdf4", "#f6ad55", "#fc8181", "#b19cd9", "#fbd38d"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center">
          <h1 className="font-bold text-lg mr-4">CAD Mech MCP</h1>
          <TooltipProvider>
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Save className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={historyIndex <= 0} onClick={handleUndo}>
                    <Undo className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={historyIndex >= history.length - 1}
                    onClick={handleRedo}
                  >
                    <Redo className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={showAiPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAiPanel(!showAiPanel)}
            className="flex items-center"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>

          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">Instant Camera</SelectItem>
              <SelectItem value="engine">Engine Block</SelectItem>
              <SelectItem value="bracket">Mounting Bracket</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setShowLeftPanel(!showLeftPanel)}>
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Left Panel</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setShowRightPanel(!showRightPanel)}>
                  <PanelRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Right Panel</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Maximize className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        {showLeftPanel && (
          <div className="w-64 border-r bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
            <Tabs defaultValue="elements" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="elements">
                  <Cube className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Wand2 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="standards">
                  <CheckSquare className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="pricing">
                  <DollarSign className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-medium mb-2">Elements</h3>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search elements..." className="text-sm" />
                    <Button variant="ghost" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {objects.map((object) => (
                      <ContextMenu key={object.id}>
                        <ContextMenuTrigger>
                          <div
                            className={cn(
                              "flex items-center justify-between p-2 rounded cursor-pointer",
                              selectedObject === object.id
                                ? "bg-blue-100 dark:bg-blue-900"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800",
                            )}
                            onClick={() => setSelectedObject(object.id)}
                          >
                            <div className="flex items-center">
                              <Cube className="h-4 w-4 mr-2" />
                              <span>{object.type.charAt(0).toUpperCase() + object.type.slice(1)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => setSelectedObject(object.id)}>Select</ContextMenuItem>
                          <ContextMenuItem onClick={() => handleDuplicateObject(object.id)}>Duplicate</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem className="text-red-600" onClick={() => handleDeleteObject(object.id)}>
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Element
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" className="justify-start" onClick={() => handleAddPrimitive("cube")}>
                          <Cube className="h-4 w-4 mr-2" />
                          Cube
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={() => handleAddPrimitive("sphere")}>
                          <Circle className="h-4 w-4 mr-2" />
                          Sphere
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => handleAddPrimitive("cylinder")}
                        >
                          <Cylinder className="h-4 w-4 mr-2" />
                          Cylinder
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={() => handleAddPrimitive("cone")}>
                          <Cone className="h-4 w-4 mr-2" />
                          Cone
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={() => handleAddPrimitive("plane")}>
                          <Square className="h-4 w-4 mr-2" />
                          Plane
                        </Button>
                        <Button variant="ghost" className="justify-start" onClick={() => handleAddPrimitive("gear")}>
                          <GearIcon className="h-4 w-4 mr-2" />
                          Gear
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TabsContent>

              {/* Other tabs content remains the same */}
              <TabsContent value="ai" className="flex-1 overflow-hidden flex flex-col">
                {/* AI content */}
              </TabsContent>

              <TabsContent value="standards" className="flex-1 overflow-hidden flex flex-col">
                {/* Standards content */}
              </TabsContent>

              <TabsContent value="pricing" className="flex-1 overflow-hidden flex flex-col">
                {/* Pricing content */}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* 3D Viewport */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 relative">
          {/* Viewport toolbar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <ToggleGroup
              type="single"
              value={transformMode}
              onValueChange={(value) => value && setTransformMode(value)}
            >
              <ToggleGroupItem value="translate" aria-label="Move">
                <Move className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="rotate" aria-label="Rotate">
                <RotateCcw className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="scale" aria-label="Scale">
                <ZoomIn className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Primitives Toolbar */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <PrimitivesToolbar onAddPrimitive={handleAddPrimitive} />
          </div>

          {/* 3D Canvas with context menu */}
          <ContextMenu>
            <ContextMenuTrigger className="w-full h-full">
              <Canvas shadows>
                <Suspense fallback={null}>
                  <Scene
                    objects={objects}
                    selectedObject={selectedObject}
                    setSelectedObject={setSelectedObject}
                    onDeleteObject={handleDeleteObject}
                    onDuplicateObject={handleDuplicateObject}
                    transformMode={transformMode}
                    onObjectTransform={handleObjectTransform}
                  />
                  <OrbitControls makeDefault />
                  <Environment preset="studio" />
                </Suspense>
              </Canvas>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Add Primitive</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => handleAddPrimitive("cube")}>Cube</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddPrimitive("sphere")}>Sphere</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddPrimitive("cylinder")}>Cylinder</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddPrimitive("cone")}>Cone</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddPrimitive("plane")}>Plane</ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAddPrimitive("gear")}>Gear</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem onClick={() => setSelectedObject(null)}>Deselect All</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* AI Assistant Panel */}
          {showAiPanel && (
            <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10 max-h-60 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Assistant
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 mb-2">
                <div className="space-y-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <p className="text-sm">How can I help with your design today?</p>
                  </div>

                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded ml-8">
                    <p className="text-sm">Can you help me create a mounting bracket?</p>
                  </div>

                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <p className="text-sm">
                      I can help you create a mounting bracket. What specifications do you need? How many mounting
                      holes, what dimensions, and what load does it need to support?
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex">
                <Input
                  placeholder="Ask the AI assistant..."
                  className="flex-1"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button className="ml-2">
                  <MessageSquareText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        {showRightPanel && (
          <div className="w-80 border-l bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transform">Transform</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
                <TabsTrigger value="decals">Decals</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="transform" className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={objectProperties.position.x}
                          onChange={(e) => handlePropertyChange("position", "x", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={objectProperties.position.y}
                          onChange={(e) => handlePropertyChange("position", "y", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={objectProperties.position.z}
                          onChange={(e) => handlePropertyChange("position", "z", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={objectProperties.rotation.x}
                          onChange={(e) => handlePropertyChange("rotation", "x", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={objectProperties.rotation.y}
                          onChange={(e) => handlePropertyChange("rotation", "y", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={objectProperties.rotation.z}
                          onChange={(e) => handlePropertyChange("rotation", "z", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Scale</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">X</Label>
                        <Input
                          type="number"
                          value={objectProperties.scale.x}
                          onChange={(e) => handlePropertyChange("scale", "x", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y</Label>
                        <Input
                          type="number"
                          value={objectProperties.scale.y}
                          onChange={(e) => handlePropertyChange("scale", "y", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Z</Label>
                        <Input
                          type="number"
                          value={objectProperties.scale.z}
                          onChange={(e) => handlePropertyChange("scale", "z", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={objectProperties.dimensions.width}
                          onChange={(e) => handlePropertyChange("dimensions", "width", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={objectProperties.dimensions.height}
                          onChange={(e) => handlePropertyChange("dimensions", "height", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Depth</Label>
                        <Input
                          type="number"
                          value={objectProperties.dimensions.depth}
                          onChange={(e) => handlePropertyChange("dimensions", "depth", e.target.value)}
                          disabled={!selectedObject}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lock Aspect Ratio</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="material" className="p-4 space-y-4">
                  {/* Material tab content */}
                </TabsContent>

                <TabsContent value="decals" className="p-4 space-y-4">
                  {/* Decals tab content */}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Object</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this object? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteObject} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
