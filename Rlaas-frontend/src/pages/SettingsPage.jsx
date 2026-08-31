import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { getApiBaseUrl } from '../api/client';
import { maskApiKey } from '../utils/format';
import { Database, Shield, KeyRound } from 'lucide-react';

export const SettingsPage = () => {
  const { appId, apiKey, logout } = useAuth();

  return (
    <div className="space-y-6 font-mono text-xs max-w-4xl">
      <PageHeader
        title="Console Settings"
        description="Session and API connection details for this authenticated application."
      />

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2 text-zinc-200 font-semibold">
          <Database className="w-4 h-4 text-[#78A1E2]" />
          <span>API connection</span>
        </div>
        <div>
          <div className="text-zinc-400 mb-1">API base URL</div>
          <div className="bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100">{getApiBaseUrl()}</div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Configured with VITE_API_BASE_URL. This is a public frontend setting, not a secret.
          </p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2 text-zinc-200 font-semibold">
          <KeyRound className="w-4 h-4 text-[#78A1E2]" />
          <span>Session</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-zinc-400 mb-1">App ID</div>
            <div className="bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 break-all">{appId}</div>
          </div>
          <div>
            <div className="text-zinc-400 mb-1">API key</div>
            <div className="bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100">{maskApiKey(apiKey)}</div>
          </div>
        </div>
        <p className="text-zinc-500 leading-relaxed">
          Frontend route protection is for user experience only. The FastAPI backend remains the authorization
          boundary.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-2">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2 text-zinc-200 font-semibold">
          <Shield className="w-4 h-4 text-[#78A1E2]" />
          <span>Security notes</span>
        </div>
        <ul className="list-disc pl-4 text-zinc-400 space-y-1">
          <li>API keys are never placed in URLs or VITE_* variables.</li>
          <li>This session is stored in memory and sessionStorage for the current browser tab session.</li>
          <li>A 401 response signs you out. A 403 is shown as an authorization error without retrying.</li>
        </ul>
      </div>
    </div>
  );
};
