import React, { useState } from 'react';
import { Menu, Terminal } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { maskApiKey } from '../../utils/format';

export const Header = ({ onOpenSidebar, activeTab, onOpenTester }) => {
  const { appId, apiKey, logout } = useAuth();
  const [showKey, setShowKey] = useState(false);

  const tabTitles = {
    overview: 'Overview',
    applications: 'Application',
    rules: 'Rate Limiting Rules',
    users: 'User Inspector',
    tester: 'Request Tester',
    statistics: 'Statistics',
    settings: 'Settings',
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-zinc-400 hover:text-zinc-200 p-1.5 rounded-sm bg-zinc-900 border border-zinc-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono min-w-0">
          <span className="text-zinc-500">RLaaS</span>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-200 font-semibold truncate">{tabTitles[activeTab] || 'Console'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenTester}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 rounded transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-[#78A1E2]" />
          <span>Quick Test</span>
        </button>

        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-400 max-w-[220px]"
          title="Show or hide API key"
        >
          <span className="w-2 h-2 rounded-full bg-[#78A1E2] shrink-0" />
          <span className="truncate">{showKey ? apiKey : maskApiKey(apiKey)}</span>
        </button>

        <span className="hidden lg:inline text-[11px] font-mono text-zinc-500 truncate max-w-[140px]" title={appId}>
          {appId}
        </span>

        <button
          type="button"
          onClick={() => logout()}
          className="px-2.5 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 rounded"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};
