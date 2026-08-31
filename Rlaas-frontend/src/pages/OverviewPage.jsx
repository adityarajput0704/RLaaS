import { useEffect, useState } from 'react';
import { getAppStats } from '../api/statistics';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, Info } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { listRules } from '../api/rules';
import { ApiError } from '../api/errors';
import { getSystemStatus } from '../api/system';

export const OverviewPage = ({ onNavigate }) => {
  const { appId, applicationName } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemOk, setSystemOk] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const result = await getAppStats();

        if (mounted) {
          setStats(result.data);
        }
      } catch {
        if (mounted) {
          setStats(null);
        }
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([listRules(), getSystemStatus().catch(() => null)])
      .then(([rulesResult, systemResult]) => {
        if (cancelled) return;
        setRules(Array.isArray(rulesResult.data) ? rulesResult.data : []);
        setSystemOk(systemResult?.status === 200);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Overview"
        description="Rate-limiting console for the authenticated application. Metrics shown here come only from existing backend endpoints."
        badge={appId}
      />

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-xs">
        <div className="text-zinc-500 uppercase tracking-wider mb-2">Current application</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-zinc-500">Name</div>
            <div className="text-zinc-100 font-semibold">{applicationName || 'N/A'}</div>
          </div>
          <div>
            <div className="text-zinc-500">App ID</div>
            <div className="text-zinc-100 font-semibold break-all">{appId || 'N/A'}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={statsLoading ? '…' : Number(stats?.total || 0).toLocaleString()}
          subtext="All requests for this application"
          icon={Activity}
        />

        <MetricCard
          title="Allowed Requests"
          value={statsLoading ? '…' : Number(stats?.allowed || 0).toLocaleString()}
          subtext="Requests allowed"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Blocked Requests"
          value={statsLoading ? '…' : Number(stats?.blocked || 0).toLocaleString()}
          subtext="Requests blocked"
          icon={AlertCircle}
        />

        <MetricCard
          title="Block Rate"
          value={statsLoading ? '…' : `${Number(stats?.block_rate || 0).toFixed(2)}%`}
          subtext="Blocked ÷ total requests"
          icon={ShieldCheck}
        />
      </div>

  
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-md p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold font-mono text-zinc-100">Configured rules</h3>
              <p className="text-[11px] text-zinc-500 font-mono">Scoped to the authenticated application</p>
            </div>
            <button
              onClick={() => onNavigate('rules')}
              className="text-xs font-mono text-[#8EB2EB] hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              Manage rules <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <p className="text-xs font-mono text-zinc-500">Loading rules…</p>
          ) : rules.length === 0 ? (
            <p className="text-xs font-mono text-zinc-500">No rules are configured for this application.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-850">
                    <th className="pb-2 font-normal">Method</th>
                    <th className="pb-2 font-normal">Resource</th>
                    <th className="pb-2 font-normal">Algorithm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {rules.slice(0, 8).map((rule) => (
                    <tr key={rule.rule_id} className="hover:bg-zinc-900/50">
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px]">
                          {rule.method}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-300">{rule.resource}</td>
                      <td className="py-2.5 text-zinc-400">{rule.algorithm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Application</span>
              <button
                onClick={() => onNavigate('applications')}
                className="text-xs font-mono text-[#78A1E2] hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="text-sm font-mono text-zinc-100 break-all">{appId}</div>
            <p className="text-[11px] text-zinc-500 font-mono mt-2">
              Status is determined by a successful API-key authentication. Access is enforced by the backend.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase">System Status</div>
              <div className="text-xs font-mono text-zinc-200 mt-1 font-semibold">
                {systemOk === null ? 'Checking…' : systemOk ? 'RLaaS API reachable' : 'RLaaS API unreachable'}
              </div>
            </div>
            <span
              className={`w-3 h-3 rounded-full ${systemOk ? 'bg-[#78A1E2]' : 'bg-zinc-600'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
