import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listSessions,
  getSession,
  createSession as apiCreateSession,
  listIcons,
  listWindows,
  listTaskbarItems,
  createWindow as apiCreateWindow,
  updateWindow as apiUpdateWindow,
  deleteWindow as apiDeleteWindow,
  createIcon as apiCreateIcon,
  updateIcon as apiUpdateIcon,
  deleteIcon as apiDeleteIcon,
} from "../api/client";

const LAST_SESSION_ID_KEY = "kavia.desktop.lastSessionId";

/**
 * Computes the highest zIndex from a list of window DTOs.
 *
 * @param {Array<{zIndex: number}>} windows List of window objects.
 * @returns {number} Highest zIndex or 0 when no windows exist.
 */
function getMaxZIndex(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return 0;
  }
  return windows.reduce(
    (max, w) => (typeof w.zIndex === "number" && w.zIndex > max ? w.zIndex : max),
    0
  );
}

/**
 * Safely stores the latest layout for a session in localStorage.
 *
 * @param {number|null} sessionId Current session identifier.
 * @param {Array} icons Current list of icons.
 * @param {Array} windows Current list of windows.
 */
function persistLayout(sessionId, icons, windows) {
  if (!sessionId) {
    return;
  }
  try {
    const snapshot = JSON.stringify({ icons, windows });
    window.localStorage.setItem(
      `kavia.desktop.layout.${sessionId}`,
      snapshot
    );
  } catch {
    // Ignore storage failures (e.g. quota exceeded or unavailable).
  }
}

// PUBLIC_INTERFACE
export function useDesktopSession() {
  /**
   * React hook that manages a desktop session and synchronizes window and icon
   * layout with the backend API and localStorage.
   *
   * It is responsible for:
   * - Loading or creating a default session.
   * - Fetching icons, windows, and taskbar items for the active session.
   * - Exposing helpers to move/update windows and icons.
   * - Persisting layout changes to both the backend and localStorage.
   *
   * @returns {{
   *   session: any,
   *   windows: any[],
   *   icons: any[],
   *   taskbarItems: any[],
   *   loading: boolean,
   *   error: string | null,
   *   refreshAll: () => Promise<void> | void,
   *   createWindow: (partial: any) => Promise<any> | null,
   *   updateWindowPosition: (id: number, coords: {x:number,y:number}) => Promise<void> | void,
   *   setWindowState: (id: number, state: string) => Promise<void> | void,
   *   closeWindow: (id: number) => Promise<void> | void,
   *   bringWindowToFront: (id: number) => Promise<void> | void,
   *   createIcon: (partial: any) => Promise<any> | null,
   *   updateIconPosition: (id: number, coords: {x:number,y:number}) => Promise<void> | void,
   *   deleteIcon: (id: number) => Promise<void> | void
   * }}
   *   Object with the current session state and mutation helpers.
   */

  const [session, setSession] = useState(null);
  const [windows, setWindows] = useState([]);
  const [icons, setIcons] = useState([]);
  const [taskbarItems, setTaskbarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Loads icons, windows, and taskbar items for the given session identifier.
   */
  const loadAllForSession = useCallback(async (sessionId) => {
    const [iconsResult, windowsResult, taskbarResult] = await Promise.all([
      listIcons(sessionId),
      listWindows(sessionId),
      listTaskbarItems(sessionId),
    ]);

    setIcons(Array.isArray(iconsResult) ? iconsResult : []);
    setWindows(Array.isArray(windowsResult) ? windowsResult : []);
    setTaskbarItems(Array.isArray(taskbarResult) ? taskbarResult : []);
  }, []);

  /**
   * Initializes the desktop session:
   * - Tries to restore the last used session if it still exists.
   * - Otherwise uses the first available session.
   * - If no sessions exist, creates a default one.
   */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        let activeSession = null;

        // Try to restore last used session.
        const storedSessionId = window.localStorage.getItem(
          LAST_SESSION_ID_KEY
        );
        if (storedSessionId) {
          const idNum = Number(storedSessionId);
          if (!Number.isNaN(idNum)) {
            try {
              activeSession = await getSession(idNum);
            } catch {
              // Session might no longer exist; continue with fallback.
              activeSession = null;
            }
          }
        }

        // If restoration failed, fall back to first existing session.
        if (!activeSession) {
          const existingSessions = await listSessions();
          if (Array.isArray(existingSessions) && existingSessions.length > 0) {
            activeSession = existingSessions[0];
          }
        }

        // If still no session, create a new default session.
        if (!activeSession) {
          let created = await apiCreateSession({ name: "My Desktop" });

          // Be defensive in case backend returns an unexpected shape.
          if (!created || typeof created !== "object") {
            created = {
              id: 1,
              name: "My Desktop",
              createdAt: null,
              updatedAt: null,
            };
          }

          activeSession = created;
        }

        if (cancelled) {
          return;
        }

        setSession(activeSession);
        if (activeSession && activeSession.id != null) {
          window.localStorage.setItem(
            LAST_SESSION_ID_KEY,
            String(activeSession.id)
          );
          await loadAllForSession(activeSession.id);
        }
      } catch (e) {
        if (!cancelled) {
          const message =
            (e && e.message) || "Failed to initialize desktop session.";
          setError(message);
          setIcons([]);
          setWindows([]);
          setTaskbarItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [loadAllForSession]);

  /**
   * Persist the latest layout snapshot to localStorage whenever icons or
   * windows change for the active session.
   */
  useEffect(() => {
    if (!session || !session.id) {
      return;
    }
    persistLayout(session.id, icons, windows);
  }, [session, icons, windows]);

  /**
   * Re-fetches desktop entities for the current session.
   */
  const refreshAll = useCallback(async () => {
    if (!session || !session.id) {
      return;
    }
    try {
      await loadAllForSession(session.id);
    } catch (e) {
      const message =
        (e && e.message) || "Failed to refresh desktop session data.";
      setError(message);
    }
  }, [session, loadAllForSession]);

  /**
   * Creates a new window in the active session with some sensible defaults,
   * allowing the caller to override position, title, or payload.
   */
  const createWindow = useCallback(
    async (partial) => {
      if (!session || !session.id) {
        return null;
      }

      const base = {
        title: "New Window",
        x: 120,
        y: 80,
        width: 480,
        height: 320,
        state: "normal",
        payload: null,
      };

      const maxZ = getMaxZIndex(windows);
      const payload = {
        ...base,
        ...(partial || {}),
        zIndex: maxZ + 1,
      };

      try {
        const created = await apiCreateWindow(session.id, payload);
        setWindows((prev) => [...prev, created]);
        return created;
      } catch (e) {
        const message =
          (e && e.message) || "Failed to create desktop window.";
        setError(message);
        return null;
      }
    },
    [session, windows]
  );

  /**
   * Updates the position of a window in the active session and synchronizes
   * the change with the backend.
   */
  const updateWindowPosition = useCallback(
    async (windowId, coords) => {
      if (!session || !session.id) {
        return;
      }
      const target = windows.find((w) => w.id === windowId);
      if (!target) {
        return;
      }

      const payload = {
        title: target.title,
        x: Math.max(0, coords.x),
        y: Math.max(0, coords.y),
        width: target.width,
        height: target.height,
        zIndex: typeof target.zIndex === "number" ? target.zIndex : 1,
        state: target.state || "normal",
        payload: target.payload ?? null,
      };

      try {
        const updated = await apiUpdateWindow(
          session.id,
          windowId,
          payload
        );
        setWindows((prev) =>
          prev.map((w) => (w.id === windowId ? updated : w))
        );
      } catch (e) {
        const message =
          (e && e.message) || "Failed to update window position.";
        setError(message);
      }
    },
    [session, windows]
  );

  /**
   * Updates only the state (e.g. normal, minimized, maximized) of a window.
   */
  const setWindowState = useCallback(
    async (windowId, state) => {
      if (!session || !session.id) {
        return;
      }
      const target = windows.find((w) => w.id === windowId);
      if (!target) {
        return;
      }

      const payload = {
        title: target.title,
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
        zIndex: typeof target.zIndex === "number" ? target.zIndex : 1,
        state,
        payload: target.payload ?? null,
      };

      try {
        const updated = await apiUpdateWindow(
          session.id,
          windowId,
          payload
        );
        setWindows((prev) =>
          prev.map((w) => (w.id === windowId ? updated : w))
        );
      } catch (e) {
        const message =
          (e && e.message) || "Failed to update window state.";
        setError(message);
      }
    },
    [session, windows]
  );

  /**
   * Brings the given window to the front by increasing its zIndex and
   * ensuring it is not minimized.
   */
  const bringWindowToFront = useCallback(
    async (windowId) => {
      if (!session || !session.id) {
        return;
      }
      const target = windows.find((w) => w.id === windowId);
      if (!target) {
        return;
      }

      const maxZ = getMaxZIndex(windows);
      const payload = {
        title: target.title,
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
        zIndex: maxZ + 1,
        state: target.state === "minimized" ? "normal" : target.state,
        payload: target.payload ?? null,
      };

      try {
        const updated = await apiUpdateWindow(
          session.id,
          windowId,
          payload
        );
        setWindows((prev) =>
          prev.map((w) => (w.id === windowId ? updated : w))
        );
      } catch (e) {
        const message =
          (e && e.message) || "Failed to bring window to front.";
        setError(message);
      }
    },
    [session, windows]
  );

  /**
   * Closes (deletes) a window from the active session.
   */
  const closeWindow = useCallback(
    async (windowId) => {
      if (!session || !session.id) {
        return;
      }
      try {
        await apiDeleteWindow(session.id, windowId);
        setWindows((prev) => prev.filter((w) => w.id !== windowId));
      } catch (e) {
        const message =
          (e && e.message) || "Failed to close desktop window.";
        setError(message);
      }
    },
    [session]
  );

  /**
   * Creates a new icon in the active session.
   */
  const createIcon = useCallback(
    async (partial) => {
      if (!session || !session.id) {
        return null;
      }

      const base = {
        title: "New Icon",
        x: 32,
        y: 32,
        payload: null,
      };

      const payload = {
        ...base,
        ...(partial || {}),
      };

      try {
        const created = await apiCreateIcon(session.id, payload);
        setIcons((prev) => [...prev, created]);
        return created;
      } catch (e) {
        const message =
          (e && e.message) || "Failed to create desktop icon.";
        setError(message);
        return null;
      }
    },
    [session]
  );

  /**
   * Updates the position of an icon in the active session.
   */
  const updateIconPosition = useCallback(
    async (iconId, coords) => {
      if (!session || !session.id) {
        return;
      }
      const target = icons.find((i) => i.id === iconId);
      if (!target) {
        return;
      }

      const payload = {
        title: target.title,
        x: Math.max(0, coords.x),
        y: Math.max(0, coords.y),
        payload: target.payload ?? null,
      };

      try {
        const updated = await apiUpdateIcon(
          session.id,
          iconId,
          payload
        );
        setIcons((prev) =>
          prev.map((i) => (i.id === iconId ? updated : i))
        );
      } catch (e) {
        const message =
          (e && e.message) || "Failed to update icon position.";
        setError(message);
      }
    },
    [session, icons]
  );

  /**
   * Deletes an icon from the active session.
   */
  const deleteIcon = useCallback(
    async (iconId) => {
      if (!session || !session.id) {
        return;
      }
      try {
        await apiDeleteIcon(session.id, iconId);
        setIcons((prev) => prev.filter((i) => i.id !== iconId));
      } catch (e) {
        const message =
          (e && e.message) || "Failed to delete desktop icon.";
        setError(message);
      }
    },
    [session]
  );

  /**
   * Identifies the active (top-most and non-minimized) window for convenience.
   */
  const activeWindowId = useMemo(() => {
    const nonMinimized = windows.filter((w) => w.state !== "minimized");
    if (nonMinimized.length === 0) {
      return null;
    }
    const sorted = [...nonMinimized].sort(
      (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
    );
    return sorted[sorted.length - 1].id;
  }, [windows]);

  return {
    session,
    windows,
    icons,
    taskbarItems,
    loading,
    error,
    refreshAll,
    createWindow,
    updateWindowPosition,
    setWindowState,
    closeWindow,
    bringWindowToFront,
    createIcon,
    updateIconPosition,
    deleteIcon,
    activeWindowId,
  };
}
