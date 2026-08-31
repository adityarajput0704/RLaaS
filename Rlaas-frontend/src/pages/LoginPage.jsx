import React, { useState } from 'react';
import { Zap, KeyRound, Plus, Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/errors';
import { formatExpiresAt } from '../utils/format';

export function LoginPage() {
  const { login, register, completeRegistration, rotateExpiredKey, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState('signin');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [appName, setAppName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [issuedSecret, setIssuedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const visibleError = error || authError;

  const handleSignIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    clearAuthError();
    try {
      await login(apiKeyInput);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    clearAuthError();
    try {
      const result = await register(appName);
      setIssuedSecret({
        appId: result.data.app_id,
        apiKey: result.data.api_key,
        expiresAt: result.data.expires_at,
        name: appName.trim(),
      });
      setAppName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setBusy(false);
    }
  };

  const handleRotateExpired = async () => {
    setBusy(true);
    setError(null);
    clearAuthError();
    try {
      const result = await rotateExpiredKey(apiKeyInput);
      setIssuedSecret({
        appId: result.app_id,
        apiKey: result.api_key,
        expiresAt: result.expires_at,
        name: null,
        rotated: true,
      });
      setApiKeyInput('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy to clipboard.');
    }
  };

  if (issuedSecret) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-md p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#5C8BD6] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
            </div>
            <h1 className="font-mono font-bold text-sm">API key issued</h1>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-900/50 rounded p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              This API key is shown once. Save it securely now. RLaaS cannot display it again after you leave
              this screen.
            </p>
          </div>

          <div className="font-mono text-xs space-y-3">
            <div>
              <div className="text-zinc-500 mb-1">App ID</div>
              <div className="bg-black border border-zinc-800 rounded px-3 py-2 text-zinc-100">
                {issuedSecret.appId}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">API key</div>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded px-3 py-2">
                <span className="flex-1 break-all text-zinc-100">
                  {showKey ? issuedSecret.apiKey : `${issuedSecret.apiKey.slice(0, 6)}${'•'.repeat(16)}`}
                </span>
                <button type="button" onClick={() => setShowKey((v) => !v)} className="text-zinc-500 hover:text-zinc-200">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(issuedSecret.apiKey)}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  {copied ? <Check className="w-4 h-4 text-[#8EB2EB]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Expires</div>
              <div className="text-zinc-300">{formatExpiresAt(issuedSecret.expiresAt)}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              completeRegistration(
                {
                  api_key: issuedSecret.apiKey,
                  app_id: issuedSecret.appId,
                  expires_at: issuedSecret.expiresAt,
                },
                issuedSecret.name
              )
            }
            className="w-full py-2 text-xs font-mono rounded bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700"
          >
            Continue to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-md p-6 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#5C8BD6] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <div>
            <div className="font-mono font-bold text-sm">RLaaS Console</div>
            <div className="text-[11px] text-zinc-500 font-mono">Customer application dashboard</div>
          </div>
        </div>

        <div className="flex border border-zinc-800 rounded overflow-hidden text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 px-3 py-2 ${mode === 'signin' ? 'bg-zinc-900 text-[#8EB2EB]' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 px-3 py-2 border-l border-zinc-800 ${mode === 'register' ? 'bg-zinc-900 text-[#8EB2EB]' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Register application
          </button>
        </div>

        {visibleError && (
          <div className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
            {visibleError}
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">API key</label>
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded px-3 py-1.5">
                <KeyRound className="w-4 h-4 text-zinc-500" />
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  autoComplete="off"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="rlaas_…"
                  className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
                <button type="button" onClick={() => setShowKey((v) => !v)} className="text-zinc-500 hover:text-zinc-200">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700 disabled:opacity-60"
            >
              {busy ? 'Authenticating…' : 'Open dashboard'}
            </button>
            <button
              type="button"
              disabled={busy || !apiKeyInput.trim()}
              onClick={handleRotateExpired}
              className="w-full py-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
            >
              Rotate expired key
            </button>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Authentication uses the existing <span className="text-zinc-300">X-API-Key</span> header. The
              backend determines which application you can access. Expired keys can be rotated without creating a
              new application.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Application name</label>
              <input
                type="text"
                required
                minLength={1}
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Payment Service"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#78A1E2]" />
              {busy ? 'Registering…' : 'Register application'}
            </button>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Registration is a public bootstrap operation. The API key is returned once by the backend.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
