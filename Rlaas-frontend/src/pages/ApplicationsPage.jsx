import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Notice } from '../components/ui/Notice';
import {
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Slash,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import { ApiError } from '../api/errors';
import { formatExpiresAt, maskApiKey } from '../utils/format';

export const ApplicationsPage = () => {
  const {
    appId,
    applicationName,
    apiKey,
    expiresAt,
    register,
    completeRegistration,
    rotateCurrentKey,
    revokeCurrentKey,
  } = useAuth();

  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [issuedSecret, setIssuedSecret] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
  });

  const handleCopyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy to clipboard.');
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await register(newAppName);
      setIssuedSecret({
        appId: result.data.app_id,
        apiKey: result.data.api_key,
        expiresAt: result.data.expires_at,
        name: newAppName.trim(),
      });
      setNewAppName('');
      setIsRegisterOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authenticated Application"
        description="This console is scoped to the application identified by your API key. The backend app ID is authoritative."
        actions={
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 border border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#78A1E2]" />
            <span>Register Application</span>
          </button>
        }
      />

      <Notice title="Application scope" icon={Info}>
        You are managing one authenticated application. Registering a new application creates a separate tenant and
        returns a new API key. It does not grant access to other existing applications.
      </Notice>

      {error && (
        <div className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
          {error}
        </div>
      )}

      {issuedSecret && (
        <div className="bg-zinc-950 border border-amber-900/50 rounded-md p-4 space-y-3 font-mono text-xs">
          <div className="flex items-start gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>New API key issued once. Save it securely. It will not be shown again after you switch sessions.</span>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">App ID</div>
            <div className="text-zinc-100">{issuedSecret.appId}</div>
          </div>
          <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded p-2">
            <span className="flex-1 break-all">{issuedSecret.apiKey}</span>
            <button type="button" onClick={() => handleCopyKey(issuedSecret.apiKey)} className="text-zinc-400">
              {copied ? <Check className="w-4 h-4 text-[#8EB2EB]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              completeRegistration(
                {
                  api_key: issuedSecret.apiKey,
                  app_id: issuedSecret.appId,
                  expires_at: issuedSecret.expiresAt,
                },
                issuedSecret.name
              );
              setIssuedSecret(null);
            }}
            className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100"
          >
            Use this key for the current session
          </button>
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800">
              <th className="p-3 font-normal">Application</th>
              <th className="p-3 font-normal">App ID</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal">API Key</th>
              <th className="p-3 font-normal">Key expiration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 font-semibold text-zinc-100">
                <span className="inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-500" />
                  {applicationName || 'N/A'}
                </span>
              </td>
              <td className="p-3 text-zinc-400">{appId}</td>
              <td className="p-3">
                <StatusBadge status="active" label="Authenticated" />
              </td>
              <td className="p-3">
                <StatusBadge status="active" label="In session" />
              </td>
              <td className="p-3 text-zinc-400">{formatExpiresAt(expiresAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 font-medium">Secret API Key</span>
          <StatusBadge status="active" label="Session key" />
        </div>

        <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded p-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            readOnly
            value={showApiKey ? apiKey : maskApiKey(apiKey)}
            className="bg-transparent w-full text-zinc-200 text-xs font-mono focus:outline-none"
          />
          <button type="button" onClick={() => setShowApiKey((v) => !v)} className="text-zinc-500 hover:text-zinc-300 p-1">
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => handleCopyKey(apiKey)} className="text-zinc-500 hover:text-zinc-300 p-1">
            {copied ? <Check className="w-4 h-4 text-[#8EB2EB]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Keep this API key confidential. The browser is not the authorization boundary.</span>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() =>
              setConfirmState({
                isOpen: true,
                title: 'Rotate API key',
                message:
                  'Rotate the API key for this authenticated application? The current key will stop working after a successful rotation. Expired keys can still be rotated.',
                confirmText: 'Rotate key',
                isDanger: false,
                onConfirm: async () => {
                  setError(null);
                  try {
                    const data = await rotateCurrentKey();
                    setIssuedSecret({
                      appId: data.app_id,
                      apiKey: data.api_key,
                      expiresAt: data.expires_at,
                      name: applicationName,
                    });
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
                  }
                },
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#78A1E2]" />
            <span>Rotate Key</span>
          </button>

          <button
            onClick={() =>
              setConfirmState({
                isOpen: true,
                title: 'Revoke API key',
                message:
                  'Revoke the current API key? Subsequent requests will fail until you register a new application or use another valid key.',
                confirmText: 'Revoke key',
                isDanger: true,
                onConfirm: async () => {
                  setError(null);
                  try {
                    await revokeCurrentKey();
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
                  }
                },
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-red-950/40 border border-red-900/60 text-red-300 hover:bg-red-900/60"
          >
            <Slash className="w-3.5 h-3.5" />
            <span>Revoke Key</span>
          </button>
        </div>
      </div>

      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register New Application">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">Application Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Billing Microservice"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            Registration does not require an API key. Environment and other metadata are not stored by the current API.
          </p>
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700"
            >
              {busy ? 'Registering…' : 'Register & Generate Keys'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDanger={confirmState.isDanger}
      />
    </div>
  );
};
