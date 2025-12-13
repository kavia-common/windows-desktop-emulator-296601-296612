import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export default function DesktopWindow({
  /** Window DTO describing this desktop window. */
  windowData,
  /** Whether the window is currently the active/focused window. */
  active,
  /** Callback invoked when a window title bar is clicked to focus it. */
  onFocus,
  /** Callback invoked when the window is dragged and released. */
  onPositionChange,
  /** Callback invoked when the window close button is pressed. */
  onClose,
  /** Callback invoked when the window minimize/restore button is pressed. */
  onMinimizeToggle,
}) {
  /** DesktopWindow represents a draggable, focusable window similar to
   * a Windows OS application window. */

  const [position, setPosition] = useState({
    x: windowData.x,
    y: windowData.y,
  });
  const [dragState, setDragState] = useState(null);

  const minimized = windowData.state === "minimized";

  // Sync local position when external data changes and we are not dragging.
  useEffect(() => {
    if (!dragState) {
      setPosition({
        x: windowData.x,
        y: windowData.y,
      });
    }
  }, [dragState, windowData.x, windowData.y]);

  useEffect(() => {
    if (!dragState) {
      return undefined;
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
        onPositionChange(windowData.id, position);
      }
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, onPositionChange, position, windowData.id]);

  const handleTitleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    if (onFocus) {
      onFocus(windowData.id);
    }

    setDragState({
      originX: event.clientX,
      originY: event.clientY,
      initialX: position.x,
      initialY: position.y,
    });
  };

  const handleClick = () => {
    if (onFocus) {
      onFocus(windowData.id);
    }
  };

  const handleCloseClick = (event) => {
    event.stopPropagation();
    if (onClose) {
      onClose(windowData.id);
    }
  };

  const handleMinimizeClick = (event) => {
    event.stopPropagation();
    if (onMinimizeToggle) {
      onMinimizeToggle(windowData.id);
    }
  };

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    width: `${windowData.width}px`,
    height: `${windowData.height}px`,
    zIndex: windowData.zIndex || 1,
  };

  const windowClassNames = [
    "desktop-window",
    active ? "desktop-window--active" : "",
    minimized ? "desktop-window--minimized" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={windowClassNames}
      style={style}
      onMouseDown={handleClick}
      role="dialog"
      aria-label={windowData.title}
    >
      <div className="desktop-window__title-bar" onMouseDown={handleTitleMouseDown}>
        <div className="desktop-window__title">{windowData.title}</div>
        <div className="desktop-window__controls">
          <button
            type="button"
            className="desktop-window__control desktop-window__control--minimize"
            onClick={handleMinimizeClick}
            aria-label={minimized ? "Restore window" : "Minimize window"}
          >
            &#x2013;
          </button>
          <button
            type="button"
            className="desktop-window__control desktop-window__control--close"
            onClick={handleCloseClick}
            aria-label="Close window"
          >
            &#x2715;
          </button>
        </div>
      </div>
      {!minimized && (
        <div className="desktop-window__content">
          <div className="desktop-window__content-inner">
            <p className="desktop-window__placeholder">
              This is a sample window content area for{" "}
              <strong>{windowData.title}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
