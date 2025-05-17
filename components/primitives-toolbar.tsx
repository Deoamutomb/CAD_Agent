"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Square,
  Circle,
  Cylinder,
  CuboidIcon as Cube,
  Cone,
  Hexagon,
  ChevronDown,
  Settings,
  Cog,
  PlusCircle,
} from "lucide-react"

// Custom gear icon since Lucide doesn't have one
const GearIcon = () => (
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

// Custom thread icon
const ThreadIcon = () => (
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
  >
    <path d="M12 3L12 21"></path>
    <path d="M9 6L15 6"></path>
    <path d="M9 10L15 10"></path>
    <path d="M9 14L15 14"></path>
    <path d="M9 18L15 18"></path>
  </svg>
)

// Custom bearing icon
const BearingIcon = () => (
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
  >
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 4 L12 6"></path>
    <path d="M12 18 L12 20"></path>
    <path d="M4 12 L6 12"></path>
    <path d="M18 12 L20 12"></path>
  </svg>
)

// Custom spring icon
const SpringIcon = () => (
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
  >
    <path d="M7 4 L17 4"></path>
    <path d="M7 20 L17 20"></path>
    <path d="M7 4 L7 6 C7 7 9 8 12 8 S17 7 17 6 L17 4"></path>
    <path d="M7 8 L7 10 C7 11 9 12 12 12 S17 11 17 10 L17 8"></path>
    <path d="M7 12 L7 14 C7 15 9 16 12 16 S17 15 17 14 L17 12"></path>
    <path d="M7 16 L7 18 C7 19 9 20 12 20 S17 19 17 18 L17 16"></path>
  </svg>
)

// Define primitive categories and their items
const primitiveCategories = [
  {
    id: "basic",
    label: "Basic",
    items: [
      { id: "cube", label: "Cube", icon: <Cube size={18} /> },
      { id: "sphere", label: "Sphere", icon: <Circle size={18} /> },
      { id: "cylinder", label: "Cylinder", icon: <Cylinder size={18} /> },
      { id: "cone", label: "Cone", icon: <Cone size={18} /> },
      { id: "plane", label: "Plane", icon: <Square size={18} /> },
    ],
  },
  {
    id: "mechanical",
    label: "Mechanical",
    items: [
      { id: "gear", label: "Gear", icon: <GearIcon /> },
      { id: "thread", label: "Thread", icon: <ThreadIcon /> },
      { id: "bearing", label: "Bearing", icon: <BearingIcon /> },
      { id: "spring", label: "Spring", icon: <SpringIcon /> },
      { id: "hex", label: "Hex", icon: <Hexagon size={18} /> },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    items: [
      { id: "torus", label: "Torus", icon: <Circle size={18} /> },
      { id: "extrude", label: "Extrude", icon: <Square size={18} /> },
      { id: "revolve", label: "Revolve", icon: <Settings size={18} /> },
      { id: "sweep", label: "Sweep", icon: <Cog size={18} /> },
      { id: "loft", label: "Loft", icon: <PlusCircle size={18} /> },
    ],
  },
]

export function PrimitivesToolbar({ onAddPrimitive }) {
  const [activeCategory, setActiveCategory] = useState("basic")

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 flex items-center">
      <TooltipProvider>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {primitiveCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="flex space-x-1 p-1">
              {category.items.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onAddPrimitive(item.id)} className="h-9 w-9">
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </TooltipProvider>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-1">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="grid grid-cols-2 gap-2">
            {primitiveCategories.flatMap((category) =>
              category.items.map((item) => (
                <Button key={item.id} variant="ghost" className="justify-start" onClick={() => onAddPrimitive(item.id)}>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              )),
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
