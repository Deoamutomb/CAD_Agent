"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Square,
  Circle,
  Cylinder,
  CuboidIcon as Cube,
  Cone,
  Hexagon,
  Settings,
  Cog,
  PlusCircle,
} from "lucide-react"
import React from "react"

// Custom gear icon since Lucide doesn't have one
const GearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
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
    width="18"
    height="18"
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
    width="18"
    height="18"
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
    width="18"
    height="18"
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

const allPrimitiveItems = [
  // Basic
  { id: "cube", label: "Cube", icon: <Cube size={18} />, category: "Basic" },
  { id: "sphere", label: "Sphere", icon: <Circle size={18} />, category: "Basic" },
  { id: "cylinder", label: "Cylinder", icon: <Cylinder size={18} />, category: "Basic" },
  { id: "cone", label: "Cone", icon: <Cone size={18} />, category: "Basic" },
  { id: "plane", label: "Plane", icon: <Square size={18} />, category: "Basic" },
  // Mechanical
  { id: "gear", label: "Gear", icon: <GearIcon />, category: "Mechanical" },
  { id: "thread", label: "Thread", icon: <ThreadIcon />, category: "Mechanical" },
  { id: "bearing", label: "Bearing", icon: <BearingIcon />, category: "Mechanical" },
  { id: "spring", label: "Spring", icon: <SpringIcon />, category: "Mechanical" },
  { id: "hex", label: "Hex", icon: <Hexagon size={18} />, category: "Mechanical" },
  // Advanced
  { id: "torus", label: "Torus", icon: <Circle size={18} />, category: "Advanced" }, 
  { id: "extrude", label: "Extrude", icon: <PlusCircle size={18} />, category: "Advanced" },
  { id: "revolve", label: "Revolve", icon: <Settings size={18} />, category: "Advanced" },
  { id: "sweep", label: "Sweep", icon: <Cog size={18} />, category: "Advanced" },
  { id: "loft", label: "Loft", icon: <Square size={18} />, category: "Advanced" },
];

export function PrimitivesToolbar({ onAddPrimitive }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 flex items-center space-x-1">
      <TooltipProvider>
        {allPrimitiveItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Add a divider before Mechanical and Advanced sections */}
            {(item.category === "Mechanical" && allPrimitiveItems[index-1]?.category === "Basic") && (
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            )}
            {(item.category === "Advanced" && allPrimitiveItems[index-1]?.category === "Mechanical") && (
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onAddPrimitive(item.id)} className="h-9 w-9">
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          </React.Fragment>
        ))}
      </TooltipProvider>
    </div>
  )
}
