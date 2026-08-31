import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Terminal, Send, Clock, Shield, Code, Play } from 'lucide-react';
import { evaluateRateLimit } from '../api/rateLimiter';
import { HTTP_METHODS } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

function classifyResult({ ok, status }) {
  if (ok && status === 200) return { result: 'allowed', label: '200 Allowed' };
  if (status === 429) return { result: 'blocked', label: '429 Too Many Requests' };
  if (status === 401) return { result: 'blocked', label: '401 Authentication failure' };
  if (status === 403) return { result: 'blocked', label: '403 Authorization failure' };
  if (status === 404) return { result: 'blocked', label: '404 Resource not found' };
  if (status === 400 || status === 422) return { result: 'blocked', label: `${status} Validation error` };
  if (status >= 500) return { result: 'blocked', label: `${status} Server error` };
  if (status === 0) return { result: 'blocked', label: 'Network failure' };
  return { result: 'blocked', label: `${status || 'Error'}` };
}

export const RequestTesterPage = () => {
  const { appId } = useAuth();
  const [method, setMethod] = useState('POST');
  const [resource, setResource] = useState('/api/v1/payments');
  const [userId, setUserId] = useState('user_123');
  const [lastResponse, setLastResponse] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState([]);

  const runTest = async ({ nextMethod = method, nextResource = resource, nextUserId = userId } = {}) => {
    setIsSending(true);
    const started = performance.now();
    const outcome = await evaluateRateLimit({
      userId: nextUserId.trim(),
      method: nextMethod,
      resource: nextResource.trim(),
    });
    const latencyMs = (performance.now() - started).toFixed(1);
    const classified = classifyResult(outcome);
    const entry = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: nextUserId.trim(),
      method: nextMethod,
      resource: nextResource.trim(),
      status: outcome.status,
      result: classified.result,
      label: classified.label,
      latencyMs,
      retryAfter: outcome.retryAfter,
      body: outcome.data,
      message: outcome.message || null,
    };
    setLastResponse(entry);
    setHistory((prev) => [entry, ...prev.slice(0, 49)]);
    setIsSending(false);
  };

  const handleSendRequest = (event) => {
    event?.preventDefault();
    runTest();
  };

  const handleReRun = (item) => {
    setMethod(item.method);
    setResource(item.resource);
    setUserId(item.userId);
    runTest({
      nextMethod: item.method,
      nextResource: item.resource,
      nextUserId: item.userId,
    });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <PageHeader
        title="Interactive Request Tester"
        description="Send a real POST /rate-limiter request using this application's API key."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
            <span className="text-zinc-200 font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#78A1E2]" />
              <span>Test Payload</span>
            </span>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              Live backend
            </span>
          </div>

          <form onSubmit={handleSendRequest} className="space-y-4">
            <div>
              <label className="block text-zinc-400 mb-1">Authenticated application</label>
              <div className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100">
                {appId}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-zinc-400 mb-1">HTTP Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  {HTTP_METHODS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-zinc-400 mb-1">Resource Endpoint Path</label>
                <input
                  type="text"
                  required
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Customer User ID</label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user_123"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2 px-4 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Send className="w-3.5 h-3.5 text-[#78A1E2]" />
              <span>{isSending ? 'Sending…' : 'Send Test Request'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-md p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
            <span className="text-zinc-200 font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-zinc-400" />
              <span>Response</span>
            </span>
            {lastResponse && (
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" /> {lastResponse.latencyMs} ms
                </span>
                <StatusBadge status={lastResponse.result} label={lastResponse.label} />
              </div>
            )}
          </div>

          {!lastResponse ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-center p-6 border border-dashed border-zinc-850 rounded">
              <Terminal className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-zinc-400 font-semibold">No response yet</p>
              <p className="text-zinc-500 text-[11px] mt-1 max-w-xs">
                Send a test request to evaluate the live RLaaS backend.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-black border border-zinc-850 rounded p-3 space-y-1">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#78A1E2]" />
                  <span>HTTP metadata</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-900/60">
                  <span className="text-zinc-400">Status:</span>
                  <span className="text-zinc-100 font-semibold">{lastResponse.status || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-900/60">
                  <span className="text-zinc-400">Retry-After:</span>
                  <span className="text-zinc-100 font-semibold">{lastResponse.retryAfter || 'N/A'}</span>
                </div>
                {lastResponse.message && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Message:</span>
                    <span className="text-zinc-100 font-semibold text-right max-w-[70%]">{lastResponse.message}</span>
                  </div>
                )}
              </div>

              <div className="bg-black border border-zinc-850 rounded p-3 space-y-1">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">
                  Response Payload (JSON)
                </div>
                <pre className="text-zinc-300 font-mono text-[11px] overflow-x-auto p-2 bg-zinc-950 rounded border border-zinc-900">
                  {JSON.stringify(lastResponse.body ?? { message: lastResponse.message }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden">
        <div className="p-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200">Session test history</h3>
          <span className="text-[11px] text-zinc-500">{history.length} requests in this browser session</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-950">
                <th className="p-3 font-normal">Timestamp</th>
                <th className="p-3 font-normal">Method</th>
                <th className="p-3 font-normal">Resource</th>
                <th className="p-3 font-normal">User ID</th>
                <th className="p-3 font-normal">Status Code</th>
                <th className="p-3 font-normal">Latency</th>
                <th className="p-3 font-normal text-right">Re-run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-zinc-500">
                    No session test history yet. Execute requests above to log entries.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3 text-zinc-500">{item.timestamp}</td>
                    <td className="p-3 font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px]">
                        {item.method}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-200">{item.resource}</td>
                    <td className="p-3 text-zinc-300 font-semibold">{item.userId}</td>
                    <td className="p-3">
                      <StatusBadge status={item.result} label={item.label} />
                    </td>
                    <td className="p-3 text-zinc-400">{item.latencyMs} ms</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleReRun(item)}
                        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 rounded transition-colors"
                        title="Re-run request"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
