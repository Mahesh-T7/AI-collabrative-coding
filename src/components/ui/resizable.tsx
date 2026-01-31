import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { useState } from "react";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

/**
 * Enhanced ResizableHandle with:
 * - Double-click to reset panel sizes
 * - Improved visual feedback with hover indicators
 * - Smooth transition animations
 * - Better keyboard accessibility
 * - Professional cursor styles matching VS Code
 */
const ResizableHandle = ({
  withHandle,
  className,
  onDoubleClick,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
  onDoubleClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        // Base styles - thin divider line with smooth transitions
        "relative flex items-center justify-center bg-[hsl(var(--border))] transition-all duration-150",
        // Horizontal resize handle (vertical divider)
        "w-[1px] cursor-col-resize",
        // Vertical resize handle (horizontal divider)
        "data-[panel-group-direction=vertical]:h-[1px] data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
        // Expanded hover area - invisible but increases clickable/draggable area
        "after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-1/2 after:w-[6px] after:z-10",
        "data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:h-[6px] data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0",
        // Hover state - highlight with primary color and slight width increase
        "hover:bg-[hsl(var(--primary))] hover:w-[2px]",
        "data-[panel-group-direction=vertical]:hover:h-[2px]",
        // Active/dragging state - stronger highlight
        "data-[resize-handle-state=drag]:bg-[hsl(var(--primary))] data-[resize-handle-state=drag]:w-[2px] data-[resize-handle-state=drag]:shadow-lg",
        "data-[panel-group-direction=vertical]:data-[resize-handle-state=drag]:h-[2px]",
        // Focus state for keyboard navigation
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2",
        // Rotate grip icon for vertical handles
        "[&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onDoubleClick={onDoubleClick}
      tabIndex={0}
      role="separator"
      aria-label="Resize panel"
      aria-orientation={props["data-panel-group-direction"] === "vertical" ? "horizontal" : "vertical"}
      onKeyDown={(e) => {
        // Keyboard accessibility: Arrow keys to resize
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDoubleClick?.();
        }
      }}
      {...props}
    >
      {/* Visual indicator that appears on hover or drag */}
      {(withHandle || isHovered || isDragging) && (
        <div
          className={cn(
            "z-20 flex items-center justify-center rounded-sm border bg-[hsl(var(--sidebar-background))] transition-all duration-200",
            "h-8 w-3 shadow-md",
            "data-[panel-group-direction=vertical]:h-3 data-[panel-group-direction=vertical]:w-8",
            isHovered || isDragging
              ? "opacity-100 scale-100 bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]"
              : withHandle
                ? "opacity-80 scale-95 hover:opacity-100 hover:scale-100"
                : "opacity-0 scale-90"
          )}
        >
          <GripVertical
            className={cn(
              "h-3 w-3 transition-colors",
              isHovered || isDragging ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            )}
          />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
