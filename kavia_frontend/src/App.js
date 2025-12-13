import React, { useEffect, useState } from "react";
import "./App.css";
import Desktop from "./components/Desktop";
import Taskbar from "./components/Taskbar";
import StartMenu from "./components/StartMenu";
import { useDesktopSession } from "./hooks/useDesktopSession";

// PUBLIC_INTERFACE
export default function App() {
  /** Root React component that renders the Windows-like desktop shell, wiring
   * together the Desktop, Taskbar, StartMenu, and the desktop session hook. */

  const [theme, setTheme] = useState("light");
  const [selectedIconId, setSelectedIconId] = useState(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const {
    session,
    windows,
    icons,
    taskbarItems,
    loading,
    error,
    createWindow,
    updateWindowPosition,
    setWindowState,
    closeWindow,
    bringWindowToFront,
    updateIconPosition,
    activeWindowId,
  } = useDesktopSession();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleBackgroundClick = () => {
    setSelectedIconId(null);
    setStartMenuOpen(false);
  };

  const handleIconSelect = (iconId) => {
    setSelectedIconId(iconId);
  };

  const handleIconOpen = async (iconId) => {
    const icon = icons.find((i) => i.id === iconId);
    if (!icon) {
      return;
    }

    await createWindow({
      title: icon.title,
      x: icon.x + 40,
      y: icon.y + 20,
      payload: icon.payload || { launchedFromIconId: icon.id },
    });

    setStartMenuOpen(false);
  };

  const handleIconPositionChange = (iconId, coords) => {
    updateIconPosition(iconId, coords);
  };

  const handleWindowFocus = (windowId) => {
    bringWindowToFront(windowId);
  };

  const handleWindowPositionChange = (windowId, coords) => {
    updateWindowPosition(windowId, coords);
  };

  const handleWindowClose = (windowId) => {
    closeWindow(windowId);
  };

  const handleWindowMinimizeToggle = (windowId) => {
    const win = windows.find((w) => w.id === windowId);
    if (!win) {
      return;
    }
    const nextState = win.state === "minimized" ? "normal" : "minimized";
    setWindowState(windowId, nextState);
    if (nextState === "normal") {
      bringWindowToFront(windowId);
    }
  };

  const handleToggleStart = () => {
    setStartMenuOpen((prev) => !prev);
  };

  const handleTaskbarWindowClick = (windowId) => {
    const win = windows.find((w) => w.id === windowId);
    if (!win) {
      return;
    }
    if (win.state === "minimized") {
      setWindowState(windowId, "normal");
      bringWindowToFront(windowId);
    } else {
      setWindowState(windowId, "minimized");
    }
  };

  const handleStartMenuRequestClose = () => {
    setStartMenuOpen(false);
  };

  const handleStartMenuLaunchIcon = (iconId) => {
    handleIconOpen(iconId);
  };

  return (
    <div className="app-shell">
      <header className="app-shell__top-bar">
        <div className="app-shell__brand">
          <span className="app-shell__brand-mark" />
          <span className="app-shell__brand-label">Kavia Windows Desktop</span>
        </div>
        <div className="app-shell__status">
          {session && (
            <span className="app-shell__session-name">
              Session: <strong>{session.name}</strong>
            </span>
          )}
          {loading && (
            <span className="app-shell__badge app-shell__badge--info">
              Loading…
            </span>
          )}
          {error && (
            <span className="app-shell__badge app-shell__badge--error">
              {error}
            </span>
          )}
          <button
            type="button"
            className="app-shell__theme-toggle"
            onClick={handleToggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? "Dark" : "Light"} mode
          </button>
        </div>
      </header>

      <main className="app-shell__main">
        <Desktop
          icons={icons}
          windows={windows}
          activeWindowId={activeWindowId}
          selectedIconId={selectedIconId}
          onBackgroundClick={handleBackgroundClick}
          onIconSelect={handleIconSelect}
          onIconOpen={handleIconOpen}
          onIconPositionChange={handleIconPositionChange}
          onWindowFocus={handleWindowFocus}
          onWindowPositionChange={handleWindowPositionChange}
          onWindowClose={handleWindowClose}
          onWindowMinimizeToggle={handleWindowMinimizeToggle}
        />
      </main>

      <Taskbar
        windows={windows}
        taskbarItems={taskbarItems}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        onToggleStart={handleToggleStart}
        onWindowClick={handleTaskbarWindowClick}
      />

      <StartMenu
        open={startMenuOpen}
        onRequestClose={handleStartMenuRequestClose}
        icons={icons}
        onLaunchIcon={handleStartMenuLaunchIcon}
      />
    </div>
  );
}
