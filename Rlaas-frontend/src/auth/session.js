const SESSION_KEY = 'rlaas_dashboard_session';

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.apiKey || !parsed?.appId) return null;
    return {
      apiKey: parsed.apiKey,
      appId: parsed.appId,
      applicationName: parsed.applicationName || null,
      expiresAt: parsed.expiresAt || null,
    };
  } catch {
    return null;
  }
}

export function loadSession() {
  return readSession();
}

export function saveSession(session) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      apiKey: session.apiKey,
      appId: session.appId,
      applicationName: session.applicationName || null,
      expiresAt: session.expiresAt || null,
    })
  );
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
