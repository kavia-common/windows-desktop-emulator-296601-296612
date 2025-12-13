import React from "react";
import DesktopIcon from "./DesktopIcon";
import DesktopWindow from "./DesktopWindow";

// PUBLIC_INTERFACE
export default function Desktop({
  /** Array of icon DTOs for the current session. */
  icons,
  /** Array of window DTOs for the current session. */
  windows,
  /** Identifier of the active (focused) window, if any. */
  activeWindowId,
  /** Identifier of the currently selected icon, if any. */
  selectedIconId,
  /** Called when the user clicks on the empty desktop background. */
  onBackgroundClick,
  /** Called when an icon is selected (single-click). */
  onIconSelect,
  /** Called when an icon is opened (double-click). */
  onIconOpen,
  /** Called when an icon drag operation finishes. */
  onIconPositionChange,
  /** Called when a window title bar is clicked to focus it. */
  onWindowFocus,
  /** Called when a window drag operation finishes. */
  onWindowPositionChange,
  /** Called when a window close control is invoked. */
  onWindowClose,
  /** Called when a window minimize/restore control is invoked. */
  onWindowMinimizeToggle,
}) {
  /** Desktop component representing the wallpaper and all interactive icons
   * and windows. It delegates low-level drag and interaction events to
   * parent-supplied callbacks so that layout changes can be persisted. */

  const handleBackgroundMouseDown = (event) => {
    // Avoid de-selecting when right-clicking.
    if (event.button === 0 && onBackgroundClick) {
      onBackgroundClick();
    }
  };

  const sortedWindows = [...windows].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  return (
    <div
      className="desktop"
      onMouseDown={handleBackgroundMouseDown}
      role="presentation"
    >
      <div className="desktop-wallpaper" />

      {/* Desktop icons */}
      <div className="desktop-icons-layer">
        {icons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            selected={selectedIconId === icon.id}
            onSelect={onIconSelect}
            onOpen={onIconOpen}
            onPositionChange={onIconPositionChange}
          />
        ))}
      </div>

      {/* Windows */}
      <div className="desktop-windows-layer">
        {sortedWindows.map((win) => (
          <DesktopWindow
            key={win.id}
            windowData={win}
            active={activeWindowId === win.id}
            onFocus={onWindowFocus}
            onPositionChange={onWindowPositionChange}
            onClose={onWindowClose}
            onMinimizeToggle={onWindowMinimizeToggle}
          />
        ))}
      </div>
    </div>
  );
}
