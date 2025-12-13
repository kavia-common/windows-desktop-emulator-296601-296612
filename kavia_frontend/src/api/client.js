const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

/**
 * Low-level helper to perform a JSON HTTP request against the backend API.
 *
 * @param {string} path Relative API path, e.g. "/api/sessions".
 * @param {RequestInit} [options] Additional fetch options.
 * @returns {Promise<any>} Parsed JSON response or null for 204 responses.
 * @throws {Error} When the response is not ok (status >= 400).
 */
async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      // ignore
    }
    const error = new Error(
      `Request to ${path} failed with status ${response.status}`
    );
    error.status = response.status;
    error.body = bodyText;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the effective base URL used for backend API calls. */
  return API_BASE_URL;
}

// SESSION ENDPOINTS

// PUBLIC_INTERFACE
export async function listSessions() {
  /** Lists all desktop sessions from the backend. */
  return request("/api/sessions");
}

// PUBLIC_INTERFACE
export async function getSession(id) {
  /** Retrieves a single desktop session by its identifier. */
  return request(`/api/sessions/${id}`);
}

// PUBLIC_INTERFACE
export async function createSession(payload) {
  /**
   * Creates a new desktop session.
   *
   * @param {{name: string}} payload The session creation payload.
   */
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateSession(id, payload) {
  /**
   * Updates an existing desktop session.
   *
   * @param {number} id Identifier of the session to update.
   * @param {{name: string}} payload The updated session fields.
   */
  return request(`/api/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteSession(id) {
  /**
   * Deletes a desktop session.
   *
   * @param {number} id Identifier of the session to delete.
   */
  return request(`/api/sessions/${id}`, {
    method: "DELETE",
  });
}

// ICON ENDPOINTS

// PUBLIC_INTERFACE
export async function listIcons(sessionId) {
  /**
   * Lists all desktop icons for a given session.
   *
   * @param {number} sessionId Identifier of the parent session.
   */
  return request(`/api/sessions/${sessionId}/icons`);
}

// PUBLIC_INTERFACE
export async function createIcon(sessionId, payload) {
  /**
   * Creates a new desktop icon in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {{title: string, x: number, y: number, payload: any}} payload Icon payload.
   */
  return request(`/api/sessions/${sessionId}/icons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateIcon(sessionId, iconId, payload) {
  /**
   * Updates an existing desktop icon in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} iconId Identifier of the icon to update.
   * @param {{title: string, x: number, y: number, payload: any}} payload Updated icon fields.
   */
  return request(`/api/sessions/${sessionId}/icons/${iconId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteIcon(sessionId, iconId) {
  /**
   * Deletes a desktop icon from the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} iconId Identifier of the icon to delete.
   */
  return request(`/api/sessions/${sessionId}/icons/${iconId}`, {
    method: "DELETE",
  });
}

// WINDOW ENDPOINTS

// PUBLIC_INTERFACE
export async function listWindows(sessionId) {
  /**
   * Lists all desktop windows for a given session.
   *
   * @param {number} sessionId Identifier of the parent session.
   */
  return request(`/api/sessions/${sessionId}/windows`);
}

// PUBLIC_INTERFACE
export async function createWindow(sessionId, payload) {
  /**
   * Creates a new desktop window in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {{title: string, x: number, y: number, width: number, height: number, zIndex: number, state: string, payload: any}} payload Window payload.
   */
  return request(`/api/sessions/${sessionId}/windows`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateWindow(sessionId, windowId, payload) {
  /**
   * Updates an existing desktop window in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} windowId Identifier of the window to update.
   * @param {{title: string, x: number, y: number, width: number, height: number, zIndex: number, state: string, payload: any}} payload Updated window fields.
   */
  return request(`/api/sessions/${sessionId}/windows/${windowId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteWindow(sessionId, windowId) {
  /**
   * Deletes a desktop window from the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} windowId Identifier of the window to delete.
   */
  return request(`/api/sessions/${sessionId}/windows/${windowId}`, {
    method: "DELETE",
  });
}

// TASKBAR ENDPOINTS

// PUBLIC_INTERFACE
export async function listTaskbarItems(sessionId) {
  /**
   * Lists all taskbar items for a given session.
   *
   * @param {number} sessionId Identifier of the parent session.
   */
  return request(`/api/sessions/${sessionId}/taskbar`);
}

// PUBLIC_INTERFACE
export async function createTaskbarItem(sessionId, payload) {
  /**
   * Creates a new taskbar item in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {{windowId: number, label: string, pinned: boolean, orderIndex: number, payload: any}} payload Taskbar item payload.
   */
  return request(`/api/sessions/${sessionId}/taskbar`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateTaskbarItem(sessionId, itemId, payload) {
  /**
   * Updates an existing taskbar item in the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} itemId Identifier of the taskbar item to update.
   * @param {{windowId: number, label: string, pinned: boolean, orderIndex: number, payload: any}} payload Updated taskbar item fields.
   */
  return request(`/api/sessions/${sessionId}/taskbar/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteTaskbarItem(sessionId, itemId) {
  /**
   * Deletes a taskbar item from the specified session.
   *
   * @param {number} sessionId Identifier of the parent session.
   * @param {number} itemId Identifier of the taskbar item to delete.
   */
  return request(`/api/sessions/${sessionId}/taskbar/${itemId}`, {
    method: "DELETE",
  });
}
