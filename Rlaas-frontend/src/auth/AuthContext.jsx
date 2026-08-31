import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { configureApiClient } from '../api/client';
import { authenticateWithKey, registerApplication, revokeApiKey, rotateApiKey } from '../api/applications';
import { ApiError } from '../api/errors';
import { clearSession, loadSession, saveSession } from './session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initial = loadSession();
  const [apiKey, setApiKey] = useState(initial?.apiKey || null);
  const [appId, setAppId] = useState(initial?.appId || null);
  const [applicationName, setApplicationName] = useState(initial?.applicationName || null);
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt || null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initial?.apiKey && initial?.appId));

  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;

  const logout = useCallback((message = null) => {
    apiKeyRef.current = null;
    setApiKey(null);
    setAppId(null);
    setApplicationName(null);
    setExpiresAt(null);
    setIsAuthenticated(false);
    clearSession();
    if (message) {
      setAuthError(message);
    }
  }, []);

  const applySession = useCallback((session) => {
    apiKeyRef.current = session.apiKey;
    setApiKey(session.apiKey);
    setAppId(session.appId);
    setApplicationName(session.applicationName || null);
    setExpiresAt(session.expiresAt || null);
    setIsAuthenticated(true);
    setAuthError(null);
    saveSession(session);
  }, []);

  configureApiClient({
    getApiKey: () => apiKeyRef.current,
    onUnauthorized: () => {
      logout('Your API key is invalid, expired, or revoked.');
    },
  });

  const login = useCallback(
    async (rawKey) => {
      const key = rawKey.trim();
      if (!key) {
        throw new ApiError('Your API key is invalid, expired, or revoked.', { status: 401 });
      }
      const result = await authenticateWithKey(key);
      applySession({
        apiKey: key,
        appId: result.data.app_id,
        applicationName: result.data.application_name || null,
        expiresAt: null,
      });
      return result.data;
    },
    [applySession]
  );

  const register = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ApiError('Please check the submitted values.', { status: 400 });
    }
    return registerApplication(trimmed);
  }, []);

  const completeRegistration = useCallback(
    (payload, name) => {
      applySession({
        apiKey: payload.api_key,
        appId: payload.app_id,
        applicationName: name || null,
        expiresAt: payload.expires_at || null,
      });
    },
    [applySession]
  );

  const rotateCurrentKey = useCallback(async () => {
    const currentKey = apiKeyRef.current;
    try {
      const result = await rotateApiKey(currentKey);
      applySession({
        apiKey: result.data.api_key,
        appId: result.data.app_id,
        applicationName: result.data.app_name,
        expiresAt: result.data.expires_at || null,
      });
      return result.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout('Your API key is invalid, expired, or revoked.');
      }
      throw error;
    }
  }, [applySession, applicationName, logout]);

  const rotateExpiredKey = useCallback(async (rawKey) => {
    const key = rawKey.trim();
    const result = await rotateApiKey(key);
    return result.data;
  }, []);

  const revokeCurrentKey = useCallback(async () => {
    await revokeApiKey();
    logout('Your API key is invalid, expired, or revoked.');
  }, [logout]);

  const value = useMemo(
    () => ({
      apiKey,
      appId,
      applicationName,
      expiresAt,
      isAuthenticated,
      authError,
      clearAuthError: () => setAuthError(null),
      login,
      logout,
      register,
      completeRegistration,
      rotateCurrentKey,
      rotateExpiredKey,
      revokeCurrentKey,
    }),
    [
      apiKey,
      appId,
      applicationName,
      expiresAt,
      isAuthenticated,
      authError,
      login,
      logout,
      register,
      completeRegistration,
      rotateCurrentKey,
      rotateExpiredKey,
      revokeCurrentKey,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
