import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export default function Taskbar({
  /** Array of window DTOs for the current session. */
  windows,
  /** Array of taskbar item DTOs (currently used for future extensibility). */
  taskbarItems,
  /** Identifier of the active window, if any. */
  activeWindowId,
  /** Whether the Start menu is currently open. */
  startMenuOpen,
  /** Called when the Start button is toggled. */
  onToggleStart,
  /** Called when a window button is clicked on the taskbar. */
  onWindowClick,
}) {
  /** Taskbar component representing the bottom system bar with a Start button,
   * window buttons, and a simple clock, styled in a Windows-like manner. */

  const [timeString, setTimeString] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeString(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleStartClick = () => {
    if (onToggleStart) {
      onToggleStart();
    }
  };

  const handleWindowButtonClick = (windowId) => {
    if (onWindowClick) {
      onWindowClick(windowId);
    }
  };

  const sortedWindows = [...windows].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  return (
    <div className="taskbar" aria-label="Taskbar">
      <button
        type="button"
        className={`taskbar__start-button ${
          startMenuOpen ? "taskbar__start-button--active" : ""
        }`}
        onClick={handleStartClick}
      >
        <span className="taskbar__start-icon" aria-hidden="true">
          &#x2756;
        </span>
        <span className="taskbar__start-label">Start</span>
      </button>

      <div className="taskbar__windows">
        {sortedWindows.map((win) => {
          const minimized = win.state === "minimized";
          const isActive = activeWindowId === win.id && !minimized;

          const classNames = [
            "taskbar__window-button",
            isActive ? "taskbar__window-button--active" : "",
            minimized ? "taskbar__window-button--minimized" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={win.id}
              type="button"
              className={classNames}
              onClick={() => handleWindowButtonClick(win.id)}
              title={win.title}
            >
              <span className="taskbar__window-title">{win.title}</span>
            </button>
          );
        })}

        {/* Reserved area for pinned taskbar items (from taskbarItems) */}
        {Array.isArray(taskbarItems) && taskbarItems.length > 0 && (
          <div className="taskbar__pinned" aria-hidden="true" />
        )}
      </div>

      <div className="taskbar__system-tray">
        <div className="taskbar__clock" aria-label="System clock">
          {timeString}
        </div>
      </div>
    </div>
  );
}
