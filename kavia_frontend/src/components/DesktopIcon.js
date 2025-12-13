import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export default function DesktopIcon({
  /** Icon DTO representing this desktop icon. */
  icon,
  /** Whether the icon is currently selected. */
  selected,
  /** Callback invoked when the icon is selected (single click). */
  onSelect,
  /** Callback invoked when the icon is opened (double click). */
  onOpen,
  /** Callback invoked when a drag operation ends with a new position. */
  onPositionChange,
}) {
  /** DesktopIcon represents a draggable icon on the desktop surface.
   * It exposes high-level events to the parent instead of mutating
   * any external state directly. */

  const [position, setPosition] = useState({ x: icon.x, y: icon.y });
  const [dragState, setDragState] = useState(null);

  // Keep internal position in sync with icon updates when not dragging.
  useEffect(() => {
    if (!dragState) {
      setPosition({ x: icon.x, y: icon.y });
    }
  }, [icon.x, icon.y, dragState]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    function handleMouseMove(event) {
      const dx = event.clientX - dragState.originX;
      const dy = event.clientY - dragState.originY;

      const nextX = dragState.initialX + dx;
      const nextY = dragState.initialY + dy;

      setPosition({
        x: Math.max(0, nextX),
        y: Math.max(0, nextY),
      });
    }

    function handleMouseUp() {
      setDragState(null);
      if (onPositionChange) {
        onPositionChange(icon.id, position);
      }
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, icon.id, onPositionChange, position]);

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    if (onSelect) {
      onSelect(icon.id);
    }

    setDragState({
      originX: event.clientX,
      originY: event.clientY,
      initialX: position.x,
      initialY: position.y,
    });
  };

  const handleDoubleClick = (event) => {
    event.stopPropagation();
    if (onOpen) {
      onOpen(icon.id);
    }
  };

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  return (
    <button
      type="button"
      className={`desktop-icon ${selected ? "desktop-icon--selected" : ""}`}
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      aria-label={icon.title}
    >
      <div className="desktop-icon__thumbnail" />
      <div className="desktop-icon__label">{icon.title}</div>
    </button>
  );
}
