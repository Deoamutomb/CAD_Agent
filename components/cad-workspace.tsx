"use client"

import { ContextMenuTrigger } from "@/components/ui/context-menu"

import { useState, useRef, Suspense, useCallback, useEffect, MouseEvent as ReactMouseEvent } from "react"
import { Canvas, useThree, Euler } from "@react-three/fiber"
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
  Trash2,
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

// Define types for scene objects
export type PrimitiveType = "cube" | "sphere" | "cylinder" | "cone" | "plane" | "gear" | "hex";

export interface BaseSceneObject {
  id: string;
  type: PrimitiveType;
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number]; // Euler angles
  scale?: [number, number, number];
}

export interface CubeObject extends BaseSceneObject {
  type: "cube";
  size: [number, number, number];
}

export interface SphereObject extends BaseSceneObject {
  type: "sphere";
  radius: number;
}

export interface CylinderObject extends BaseSceneObject {
  type: "cylinder";
  args: [number, number, number, number]; // radiusTop, radiusBottom, height, radialSegments
}

export interface ConeObject extends BaseSceneObject {
  type: "cone";
  args: [number, number, number]; // radius, height, radialSegments
}

export interface PlaneObject extends BaseSceneObject {
  type: "plane";
  size: [number, number];
}

export interface GearObject extends BaseSceneObject {
  type: "gear";
  radius: number;
  teeth: number;
}

export interface HexObject extends BaseSceneObject {
  type: "hex";
  radius: number;
  height: number;
}

export type SceneObject =
  | CubeObject
  | SphereObject
  | CylinderObject
  | ConeObject
  | PlaneObject
  | GearObject
  | HexObject;


interface CameraModelProps {
  color?: string;
  position?: [number, number, number];
  selected?: boolean;
  onSelect: () => void;
}

// Mock camera model using basic geometries instead of loading external files
function CameraModel({ color = "#b19cd9", position = [0, 0, 0], selected = false, onSelect }: CameraModelProps) {
  const group = useRef<THREE.Group>(null!)

  return (
    <group
      position={position as [number, number, number]}
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
      <mesh castShadow receiveShadow position={[0.8, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} />
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

interface SceneProps {
  objects: SceneObject[];
  selectedObject: string | null;
  setSelectedObject: (id: string | null) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  transformMode: "translate" | "rotate" | "scale";
  onObjectTransform: (id: string, transformData: Partial<Pick<BaseSceneObject, 'position' | 'rotation' | 'scale'>>) => void;
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
}: SceneProps) {
  const { camera, scene } = useThree()
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuObject, setContextMenuObject] = useState<string | null>(null)
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null)
  
  const transformDataRef = useRef<Partial<Pick<BaseSceneObject, 'position' | 'rotation' | 'scale'>> | null>(null);


  useEffect(() => {
    if (selectedObject && scene) {
      const mesh = scene.getObjectByName(selectedObject)
      setSelectedMesh(mesh || null)
    } else {
      setSelectedMesh(null)
    }
  }, [selectedObject, scene])

  const handleContextMenu = (e: ReactMouseEvent, object: SceneObject) => {
    e.stopPropagation()
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuObject(object.id)
    setShowContextMenu(true)
  }

  const handleCanvasContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuObject(null)
    setShowContextMenu(true)
  }

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

  const handleTransformChange = (event?: THREE.Event) => {
    if (event && event.target && event.target.object) {
      const transformedObject = event.target.object;
      const { x: posX, y: posY, z: posZ } = transformedObject.position;
      const euler = transformedObject.rotation as unknown as THREE.Euler;
      const { x: rotX, y: rotY, z: rotZ } = euler;
      const { x: scaleX, y: scaleY, z: scaleZ } = transformedObject.scale;

      transformDataRef.current = {
        position: [posX, posY, posZ],
        rotation: [rotX, rotY, rotZ],
        scale: [scaleX, scaleY, scaleZ],
      };
    }
  };

  const handleTransformEnd = () => {
    if (selectedObject && transformDataRef.current) {
      onObjectTransform(selectedObject, transformDataRef.current);
      transformDataRef.current = null; 
    }
  };
  

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

      {objects.map((object) => {
        const commonProps = {
          key: object.id,
          id: object.id,
          position: object.position,
          color: object.color,
          selected: selectedObject === object.id,
          onSelect: setSelectedObject,
          onContextMenu: (e: ReactMouseEvent) => handleContextMenu(e, object),
        };
        switch (object.type) {
          case "cube":
            return (
              <CubePrimitive
                {...commonProps}
                size={object.size}
              />
            )
          case "sphere":
            return (
              <SpherePrimitive
                {...commonProps}
                radius={object.radius}
              />
            )
          case "cylinder":
            return (
              <CylinderPrimitive
                {...commonProps}
                args={object.args}
              />
            )
          case "cone":
            return (
              <ConePrimitive
                {...commonProps}
                args={object.args}
              />
            )
          case "plane":
            return (
              <PlanePrimitive
                {...commonProps}
                size={object.size}
              />
            )
          case "gear":
            return (
              <GearPrimitive
                {...commonProps}
                radius={object.radius}
                teeth={object.teeth}
              />
            )
          case "hex":
            return (
              <HexPrimitive
                {...commonProps}
                radius={object.radius}
                height={object.height}
              />
            )
          default:
            return null
        }
      })}

      {selectedMesh && (
        <TransformControls 
          object={selectedMesh} 
          mode={transformMode} 
          onChange={handleTransformChange} 
          onMouseUp={handleTransformEnd} 
        />
      )}

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
                    if(contextMenuObject) onDuplicateObject(contextMenuObject)
                    setShowContextMenu(false)
                  }}
                >
                  Duplicate
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <button
                  className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    if(contextMenuObject) onDeleteObject(contextMenuObject)
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
                    const direction = new THREE.Vector3()
                    camera.getWorldDirection(direction)
                    const newPositionVec = new THREE.Vector3()
                    camera.getWorldPosition(newPositionVec)
                    newPositionVec.add(direction.multiplyScalar(5))
                    console.log("Request to add cube at", newPositionVec.toArray());
                    setShowContextMenu(false)
                  }}
                >
                  Add Cube
                </button>
                <button
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  onClick={() => {
                    console.log("Request to add sphere");
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

const GearIcon = ({ className }: { className?: string }) => (
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

// Define types for AI chat messages
interface AiChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export function CadWorkspace() {
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [selectedModel, setSelectedModel] = useState("camera")
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate")
  const [activeTab, setActiveTab] = useState("transform")
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([])

  const initialObjects: SceneObject[] = [
    { id: "cube_1", type: "cube", position: [-3, 0.5, 0], size: [1, 1, 1], color: "#9ae6b4", rotation: [0,0,0], scale: [1,1,1] },
    { id: "sphere_1", type: "sphere", position: [-3, 0.5, 2], radius: 0.5, color: "#90cdf4", rotation: [0,0,0], scale: [1,1,1] },
    { id: "cylinder_1", type: "cylinder", position: [-1, 0.5, -3], args: [0.5, 0.5, 1, 32], color: "#f6ad55", rotation: [0,0,0], scale: [1,1,1] },
    { id: "gear_1", type: "gear", position: [3, 0.5, -2], radius: 0.7, teeth: 10, color: "#fc8181", rotation: [0,0,0], scale: [1,1,1] },
  ]
  const [objects, setObjects] = useState<SceneObject[]>(initialObjects)

  const [objectProperties, setObjectProperties] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: { width: 10, height: 5, depth: 3 }, 
  })

  const [history, setHistory] = useState<SceneObject[][]>([objects])
  const [historyIndex, setHistoryIndex] = useState(0)

  // State for AI assistant
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update object properties when selection changes
  useEffect(() => {
    if (selectedObject) {
      const object = objects.find((obj) => obj.id === selectedObject)
      if (object) {
        const rotation = object.rotation || [0, 0, 0];
        const scale = object.scale || [1, 1, 1];

        let dimensions = { width: 1, height: 1, depth: 1 }; 
        if (object.type === "cube") {
          dimensions = { width: object.size[0] * 10, height: object.size[1] * 10, depth: object.size[2] * 10 };
        } else if (object.type === "sphere") {
          dimensions = { width: object.radius * 2 * 10, height: object.radius * 2 * 10, depth: object.radius * 2 * 10 };
        } else if (object.type === "cylinder") {
          dimensions = { width: object.args[0] * 2 * 10, height: object.args[2] * 10, depth: object.args[1] * 2 * 10 };
        } else if (object.type === "cone") {
          dimensions = { width: object.args[0] * 2 * 10, height: object.args[1] * 10, depth: object.args[0] * 2 * 10 };
        } else if (object.type === "plane") {
          dimensions = { width: object.size[0] * 10, height: 0.1 * 10, depth: object.size[1] * 10 }; // Height for plane is visual depth
        } else if (object.type === "gear") {
          dimensions = { width: object.radius * 2.2 * 10, height: 0.3 * 10, depth: object.radius * 2.2 * 10 }; // Approximate
        } else if (object.type === "hex") {
          dimensions = { width: object.radius * 2 * 10, height: object.height * 10, depth: object.radius * 2 * 10 };
        }


        setObjectProperties({
          position: {
            x: object.position[0],
            y: object.position[1],
            z: object.position[2],
          },
          rotation: {
            x: THREE.MathUtils.radToDeg(rotation[0]), 
            y: THREE.MathUtils.radToDeg(rotation[1]),
            z: THREE.MathUtils.radToDeg(rotation[2]),
          },
          scale: {
            x: scale[0],
            y: scale[1],
            z: scale[2],
          },
          dimensions: dimensions,
        })
      }
    } else {
       setObjectProperties({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        dimensions: { width: 10, height: 5, depth: 3 },
      });
    }
  }, [selectedObject, objects])

  const handleAddPrimitive = useCallback(
    (primitiveType: PrimitiveType) => {
      const id = `${primitiveType}_${Date.now()}`
      const x = (Math.random() - 0.5) * 4
      const z = (Math.random() - 0.5) * 4
      let newObject: SceneObject;

      const baseNewObject: Omit<BaseSceneObject, 'type' | 'id'> = { 
        position: [x, 0.5, z],
        color: getRandomColor(),
        rotation: [0,0,0], 
        scale: [1,1,1],    
      };

      switch (primitiveType) {
        case "cube":
          newObject = { ...baseNewObject, id, type: "cube", size: [1, 1, 1] };
          break
        case "sphere":
          newObject = { ...baseNewObject, id, type: "sphere", radius: 0.5 };
          break
        case "cylinder":
          newObject = { ...baseNewObject, id, type: "cylinder", args: [0.5, 0.5, 1, 32] };
          break
        case "cone":
          newObject = { ...baseNewObject, id, type: "cone", args: [0.5, 1, 32] };
          break
        case "plane":
          newObject = { ...baseNewObject, id, type: "plane", size: [1, 1] };
          break
        case "gear":
          newObject = { ...baseNewObject, id, type: "gear", radius: 0.7, teeth: 10 };
          break
        case "hex":
          newObject = { ...baseNewObject, id, type: "hex", radius: 0.5, height: 0.2 };
          break
        default:
          const exhaustiveCheck: never = primitiveType;
          console.error("Unknown primitive type:", exhaustiveCheck)
          return;
      }

      const newObjects = [...objects, newObject]
      setObjects(newObjects)

      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newObjects)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setSelectedObject(id)
      toast({
        title: "Object Added",
        description: `Added ${primitiveType} to the scene`,
      })
    },
    [objects, history, historyIndex, toast],
  )

  const handleDeleteObject = useCallback((objectId: string) => {
    setObjectToDelete(objectId)
    setShowDeleteDialog(true)
  }, [])

  const confirmDeleteObject = useCallback(() => {
    if (objectToDelete) {
      const newObjects = objects.filter((obj) => obj.id !== objectToDelete)
      setObjects(newObjects)
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newObjects)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      if (selectedObject === objectToDelete) {
        setSelectedObject(null)
      }
      toast({
        title: "Object Deleted",
        description: "Object has been removed from the scene",
      })
      setShowDeleteDialog(false)
      setObjectToDelete(null)
    }
  }, [objectToDelete, objects, history, historyIndex, selectedObject, toast])

  const handleDuplicateObject = useCallback(
    (objectId: string) => {
      const objectToDuplicate = objects.find((obj) => obj.id === objectId)
      if (objectToDuplicate) {
        const newId = `${objectToDuplicate.type}_${Date.now()}`
        const newObject: SceneObject = {
          ...JSON.parse(JSON.stringify(objectToDuplicate)), 
          id: newId,
          position: [
            objectToDuplicate.position[0] + 0.5,
            objectToDuplicate.position[1],
            objectToDuplicate.position[2] + 0.5,
          ],
        }
        const newObjects = [...objects, newObject]
        setObjects(newObjects)
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newObjects)
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        setSelectedObject(newId)
        toast({
          title: "Object Duplicated",
          description: `Duplicated ${objectToDuplicate.type}`,
        })
      }
    },
    [objects, history, historyIndex, toast],
  )

  const handleObjectTransform = useCallback(
    (objectId: string, transformData: Partial<Pick<BaseSceneObject, 'position' | 'rotation' | 'scale'>>) => {
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
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newObjects);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [objects, history, historyIndex], 
  )

  const handlePropertyChange = useCallback(
    (property: "position" | "rotation" | "scale" | "dimensions", axis: "x" | "y" | "z" | "width" | "height" | "depth", value: string) => {
      if (!selectedObject) return

      const numericValue = Number.parseFloat(value)
      if (isNaN(numericValue)) return;

      let newObjectsState = objects;

      setObjects((prevObjects) => {
        newObjectsState = prevObjects.map((obj) => {
          if (obj.id === selectedObject) {
            const newObj = { ...obj } 

            if (property === "position") {
              const newPosition = [...newObj.position] as [number, number, number];
              if (axis === "x") newPosition[0] = numericValue;
              else if (axis === "y") newPosition[1] = numericValue;
              else if (axis === "z") newPosition[2] = numericValue;
              newObj.position = newPosition;
            } else if (property === "rotation") {
              const newRotation = [...(newObj.rotation || [0,0,0])] as [number, number, number];
              const radValue = THREE.MathUtils.degToRad(numericValue); 
              if (axis === "x") newRotation[0] = radValue;
              else if (axis === "y") newRotation[1] = radValue;
              else if (axis === "z") newRotation[2] = radValue;
              newObj.rotation = newRotation;
            } else if (property === "scale") {
              const newScale = [...(newObj.scale || [1,1,1])] as [number, number, number];
              if (axis === "x") newScale[0] = numericValue;
              else if (axis === "y") newScale[1] = numericValue;
              else if (axis === "z") newScale[2] = numericValue;
              newObj.scale = newScale;
            } else if (property === "dimensions") {
              const scaledValue = numericValue / 10; 
              if (newObj.type === "cube") {
                const newSize = [...newObj.size] as [number,number,number];
                if (axis === "width") newSize[0] = scaledValue;
                else if (axis === "height") newSize[1] = scaledValue;
                else if (axis === "depth") newSize[2] = scaledValue;
                newObj.size = newSize;
              } else if (newObj.type === "sphere") {
                 if (axis === "width" || axis === "height" || axis === "depth") { 
                    newObj.radius = scaledValue / 2;
                 }
              } else if (newObj.type === "cylinder") {
                 const newArgs = [...newObj.args] as [number,number,number,number];
                 if (axis === "width" || axis === "depth") { 
                    newArgs[0] = scaledValue / 2;
                    newArgs[1] = scaledValue / 2;
                 } else if (axis === "height") {
                    newArgs[2] = scaledValue;
                 }
                 newObj.args = newArgs;
              } else if (newObj.type === "cone") {
                const newArgs = [...newObj.args] as [number,number,number];
                if (axis === "width" || axis === "depth") { newArgs[0] = scaledValue / 2; }
                else if (axis === "height") { newArgs[1] = scaledValue; }
                newObj.args = newArgs;
              } else if (newObj.type === "plane") {
                const newSize = [...newObj.size] as [number,number];
                if (axis === "width") { newSize[0] = scaledValue; }
                else if (axis === "depth") { newSize[1] = scaledValue; }
                // Height for plane is not directly settable via size
                newObj.size = newSize;
              } else if (newObj.type === "gear") {
                if (axis === "width" || axis === "depth") { newObj.radius = scaledValue / 2.2; }
                // Height for gear is fixed for this example
              } else if (newObj.type === "hex") {
                if (axis === "width" || axis === "depth") { newObj.radius = scaledValue / 2; }
                else if (axis === "height") { newObj.height = scaledValue; }
              }
            }
            return newObj
          }
          return obj
        })
        return newObjectsState;
      });
      
      setHistory(prevHistory => {
        const currentHistory = prevHistory.slice(0, historyIndex + 1);
        currentHistory.push(newObjectsState); 
        setHistoryIndex(currentHistory.length -1);
        return currentHistory;
      });
    },
    [selectedObject, objects, history, historyIndex], 
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1;
      setHistoryIndex(newHistoryIndex);
      setObjects(history[newHistoryIndex]); 
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1;
      setHistoryIndex(newHistoryIndex);
      setObjects(history[newHistoryIndex]);
    }
  }, [history, historyIndex])

  // Handle clearing messages
  const handleClearMessages = () => {
    setMessages([])
  }

  // Handle AI assistant submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          state: {
            objects,
            history,
            historyIndex,
            selectedObject,
            showLeftPanel,
            showAiPanel,
            selectedModel
          }
        })
      })

      if (!response.ok) throw new Error('Failed to fetch')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      let assistantMessage = { role: 'assistant' as const, content: '' }
      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        assistantMessage.content += text
        setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a random color
  const getRandomColor = () => {
    const colors = ["#9ae6b4", "#90cdf4", "#f6ad55", "#fc8181", "#b19cd9", "#fbd38d"]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  const handleAiSubmit = () => {
    if (!aiPrompt.trim()) return;
    const userMessage: AiChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: aiPrompt,
    };
    const aiThinkingMessage: AiChatMessage = {
      id: `ai_${Date.now()}`,
      sender: "ai",
      text: "Thinking...", // Placeholder AI response
    };
    setAiChatMessages((prevMessages) => [...prevMessages, userMessage, aiThinkingMessage]);
    console.log("AI Prompt Submitted:", aiPrompt);
    // Simulate AI response after a delay
    setTimeout(() => {
        setAiChatMessages(prevMessages => prevMessages.map(msg => 
            msg.id === aiThinkingMessage.id ? {...msg, text: "I'm ready to help with your CAD tasks! How can I assist you further?"} : msg
        ));
    }, 1500);

    setAiPrompt("");
  };


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
            <Tabs defaultValue="elements" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="elements">
                  <Cube className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="ai_tab">
                  <Wand2 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="standards">
                  <CheckSquare className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="pricing">
                  <DollarSign className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="elements" className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h3 className="font-medium mb-2">Elements</h3>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search elements..." className="text-sm" />
                    <Button variant="ghost" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 min-h-0">
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
                              {object.type === "cube" && <Cube className="h-4 w-4 mr-2" />}
                              {object.type === "sphere" && <Circle className="h-4 w-4 mr-2" />}
                              {object.type === "cylinder" && <Cylinder className="h-4 w-4 mr-2" />}
                              {object.type === "cone" && <Cone className="h-4 w-4 mr-2" />}
                              {object.type === "plane" && <Square className="h-4 w-4 mr-2" />}
                              {object.type === "gear" && <GearIcon className="h-4 w-4 mr-2" />}
                              {object.type === "hex" && <Square className="h-4 w-4 mr-2" />}
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
              </TabsContent>

              <TabsContent value="ai_tab" className="flex-1 overflow-hidden flex flex-col p-4">
                 <Label>AI Tools (Tab)</Label>
                 <p className="text-xs text-gray-500">This is the AI tab content area.</p>
              </TabsContent>
              <TabsContent value="standards" className="flex-1 overflow-hidden flex flex-col p-4">
                 <Label>Standards</Label>
                 <p className="text-xs text-gray-500">This is the Standards tab content area.</p>
              </TabsContent>
              <TabsContent value="pricing" className="flex-1 overflow-hidden flex flex-col p-4">
                 <Label>Pricing</Label>
                 <p className="text-xs text-gray-500">This is the Pricing tab content area.</p>
              </TabsContent>
            </Tabs>
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
                    {(['cube', 'sphere', 'cylinder', 'cone', 'plane', 'gear', 'hex'] as PrimitiveType[]).map((primitiveType) => (
                       <Button
                        key={primitiveType}
                        variant="ghost"
                        className="justify-start"
                        onClick={() => handleAddPrimitive(primitiveType)}
                      >
                        {primitiveType === 'cube' && <Cube className="h-4 w-4 mr-2" />}
                        {primitiveType === 'sphere' && <Circle className="h-4 w-4 mr-2" />}
                        {primitiveType === 'cylinder' && <Cylinder className="h-4 w-4 mr-2" />}
                        {primitiveType === 'cone' && <Cone className="h-4 w-4 mr-2" />}
                        {primitiveType === 'plane' && <Square className="h-4 w-4 mr-2" />}
                        {primitiveType === 'gear' && <GearIcon className="h-4 w-4 mr-2" />}
                        {primitiveType === 'hex' && <Square className="h-4 w-4 mr-2" />}
                        {primitiveType.charAt(0).toUpperCase() + primitiveType.slice(1)}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* 3D Viewport */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 relative">
          {/* Consolidated Top Controls Bar */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-transparent flex items-center space-x-2 p-1 rounded-lg">
            {/* Transform Mode Toggle Group */}
            <ToggleGroup
              type="single"
              value={transformMode}
              onValueChange={(value) => value && setTransformMode(value as "translate" | "rotate" | "scale")}
              className="bg-white dark:bg-gray-800 rounded-md shadow-md p-0.5"
            >
              <ToggleGroupItem value="translate" aria-label="Move"><Move className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="rotate" aria-label="Rotate"><RotateCcw className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="scale" aria-label="Scale"><ZoomIn className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>

            {/* Primitives Toolbar */}
            <PrimitivesToolbar onAddPrimitive={handleAddPrimitive} />

            {/* AI Assistant Button Wrapper*/}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow-md p-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(!showAiPanel)} className="h-9 w-9">
                                <Wand2 className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>AI Assistant</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
          </div>

          <ContextMenu>
            <ContextMenuTrigger asChild className="w-full h-full">
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
                 {(['cube', 'sphere', 'cylinder', 'cone', 'plane', 'gear', 'hex'] as PrimitiveType[]).map((primitiveType) => (
                    <ContextMenuItem key={primitiveType} onClick={() => handleAddPrimitive(primitiveType)}>{primitiveType.charAt(0).toUpperCase() + primitiveType.slice(1)}</ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem onClick={() => setSelectedObject(null)}>Deselect All</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* Floating AI Input Panel */}
          {showAiPanel && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-20 flex flex-col space-y-3 max-h-[40vh]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center">
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Assistant
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={handleClearMessages}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowAiPanel(false)}>
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] mb-2 overflow-y-auto">
                <div className="space-y-2 pr-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        message.role === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={handleSubmit} className="flex mt-2">
                <Input
                  placeholder="Ask the AI assistant..."
                  className="flex-1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading} className="ml-2">
                  <MessageSquareText className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Right panel */}
        {showRightPanel && (
          <div className="w-80 border-l bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transform">Transform</TabsTrigger>
                <TabsTrigger value="material">Material</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="transform" className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["x", "y", "z"] as const).map((axis) => (
                        <div className="space-y-1" key={axis}>
                          <Label className="text-xs">{axis.toUpperCase()}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={objectProperties.position[axis]}
                            onChange={(e) => handlePropertyChange("position", axis, e.target.value)}
                            disabled={!selectedObject}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation</Label>
                    <div className="grid grid-cols-3 gap-2">
                       {(["x", "y", "z"] as const).map((axis) => (
                        <div className="space-y-1" key={axis}>
                          <Label className="text-xs">{axis.toUpperCase()}</Label>
                          <Input
                            type="number"
                            step="1"
                            value={objectProperties.rotation[axis]} 
                            onChange={(e) => handlePropertyChange("rotation", axis, e.target.value)}
                            disabled={!selectedObject}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Scale</Label>
                     <div className="grid grid-cols-3 gap-2">
                       {(["x", "y", "z"] as const).map((axis) => (
                        <div className="space-y-1" key={axis}>
                          <Label className="text-xs">{axis.toUpperCase()}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={objectProperties.scale[axis]}
                            onChange={(e) => handlePropertyChange("scale", axis, e.target.value)}
                            disabled={!selectedObject}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["width", "height", "depth"] as const).map((dim) => (
                        <div className="space-y-1" key={dim}>
                          <Label className="text-xs">{dim.charAt(0).toUpperCase() + dim.slice(1)}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={objectProperties.dimensions[dim]}
                            onChange={(e) => handlePropertyChange("dimensions", dim, e.target.value)}
                            disabled={!selectedObject || !objects.find(o=>o.id===selectedObject)?.type || !(["cube", "sphere", "cylinder", "cone", "plane", "gear", "hex"].includes(objects.find(o=>o.id===selectedObject)?.type || ""))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lock Aspect Ratio</Label>
                      <Switch disabled={!selectedObject} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="material" className="p-4 space-y-4">
                  <Label>Material Properties</Label>
                  <p className="text-xs text-gray-500">Color, roughness, metalness, etc.</p>
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
