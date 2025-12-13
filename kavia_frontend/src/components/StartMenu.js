import React from "react";

// PUBLIC_INTERFACE
export default function StartMenu({
  /** Whether the Start menu is visible. */
  open,
  /** Callback invoked when a click outside is intended to close the menu. */
  onRequestClose,
  /** List of icons that can be launched from the Start menu. */
  icons,
  /** Callback invoked when an icon/application is chosen from the Start menu. */
  onLaunchIcon,
}) {
  /** StartMenu renders a simple Windows-like start menu surface containing a
   * list of launchable icons from the current session. */

  if (!open) {
    return null;
  }

  const handleWrapperClick = (event) => {
    // Close when the overlay is clicked (but not when actual menu is clicked).
    if (event.target === event.currentTarget && onRequestClose) {
      onRequestClose();
    }
  };

  const handleLaunchClick = (iconId) => {
    if (onLaunchIcon) {
      onLaunchIcon(iconId);
    }
  };

  return (
    <div
      className="start-menu-overlay"
      onMouseDown={handleWrapperClick}
      role="presentation"
    >
      <div className="start-menu" role="menu" aria-label="Start menu">
        <div className="start-menu__header">
          <div className="start-menu__user-avatar" aria-hidden="true">
            K
          </div>
          <div className="start-menu__user-info">
            <div className="start-menu__user-name">Kavia Desktop</div>
            <div className="start-menu__user-subtitle">Windows-like UI</div>
          </div>
        </div>
        <div className="start-menu__body">
          <div className="start-menu__section-title">Pinned</div>
          <div className="start-menu__grid">
            {icons.length === 0 && (
              <div className="start-menu__empty">
                No apps pinned yet. Use desktop icons to create windows.
              </div>
            )}
            {icons.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className="start-menu__app"
                onClick={() => handleLaunchClick(icon.id)}
              >
                <div className="start-menu__app-icon" aria-hidden="true">
                  {icon.title.charAt(0).toUpperCase()}
                </div>
                <div className="start-menu__app-label">{icon.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
