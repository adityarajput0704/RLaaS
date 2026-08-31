import React, { useEffect, useState } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  Terminal,
  Settings,
  Zap,
  X,
} from 'lucide-react';
import { getSystemStatus } from '../../api/system';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'applications', label: 'Application', icon: Layers },
  { id: 'rules', label: 'Rules', icon: ShieldCheck },
  { id: 'tester', label: 'Request Tester', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { appId } = useAuth();
  const [apiStatus, setApiStatus] = useState('Checking');

  useEffect(() => {
    let cancelled = false;
    getSystemStatus()
      .then((result) => {
        if (!cancelled) {
          setApiStatus(result.status === 200 ? 'Operational' : 'Unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) setApiStatus('Unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-56 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#5C8BD6] flex items-center justify-center text-black font-bold text-xs">
                <Zap className="w-3.5 h-3.5 fill-black text-black" />
              </div>
              <span className="font-mono font-bold tracking-tight text-sm text-zinc-100">
                RLaaS Console
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono transition-colors text-left ${
                    isActive
                      ? 'bg-zinc-900 text-[#8EB2EB] border border-[#5C8BD6]/30 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#78A1E2]' : 'text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-zinc-800 space-y-2 font-mono text-[11px]">
          <div className="px-2 py-1 bg-black border border-zinc-900 rounded-sm">
            <div className="text-zinc-500">Authenticated app</div>
            <div className="text-zinc-300 truncate" title={appId}>
              {appId || 'N/A'}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1 bg-black border border-zinc-900 rounded-sm">
            <span className="text-zinc-500">API Status</span>
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiStatus === 'Operational' ? 'bg-[#78A1E2]' : 'bg-zinc-500'
                }`}
              />
              {apiStatus}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
