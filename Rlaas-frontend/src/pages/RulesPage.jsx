import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import { createRule, deleteRule, listRules, replaceRule } from '../api/rules';
import { ApiError } from '../api/errors';
import { ALGORITHMS, HTTP_METHODS, algorithmLabel, buildRuleConfig } from '../utils/format';
import { useAuth } from '../auth/AuthContext';

const emptyForm = {
  method: 'GET',
  resource: '',
  algorithm: 'fixed_window',
  limit: 100,
  window_size: 60,
  capacity: 100,
  refill_rate: 10,
};

export const RulesPage = () => {
  const { appId } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResource, setSearchResource] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [algorithmFilter, setAlgorithmFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, ruleId: null, ruleName: '' });

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listRules();
      setRules(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const filteredRules = rules.filter((rule) => {
    const matchesResource = (rule.resource || '').toLowerCase().includes(searchResource.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || rule.method === methodFilter;
    const matchesAlgorithm = algorithmFilter === 'ALL' || rule.algorithm === algorithmFilter;
    return matchesResource && matchesMethod && matchesAlgorithm;
  });

  const openCreateModal = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setForm({
      method: rule.method || 'GET',
      resource: rule.resource || '',
      algorithm: rule.algorithm || 'fixed_window',
      limit: rule.config?.limit ?? 100,
      window_size: rule.config?.window_size ?? 60,
      capacity: rule.config?.capacity ?? 100,
      refill_rate: rule.config?.refill_rate ?? 10,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      method: form.method,
      resource: form.resource.trim(),
      algorithm: form.algorithm,
      config: buildRuleConfig(form.algorithm, form),
    };
    try {
      if (editingRule) {
        await replaceRule(editingRule.rule_id, payload);
      } else {
        await createRule(payload);
      }
      setIsModalOpen(false);
      await loadRules();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.ruleId) return;
    setError(null);
    try {
      await deleteRule(deleteConfirm.ruleId);
      setDeleteConfirm({ isOpen: false, ruleId: null, ruleName: '' });
      await loadRules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect to RLaaS.');
      setDeleteConfirm({ isOpen: false, ruleId: null, ruleName: '' });
    }
  };

  const renderConfigSummary = (rule) => {
    if (rule.algorithm === 'token_bucket') {
      return (
        <span className="font-mono text-[11px] text-zinc-300">
          cap: <strong className="text-zinc-100">{rule.config?.capacity}</strong>, refill:{' '}
          <strong className="text-zinc-100">{rule.config?.refill_rate}/s</strong>
        </span>
      );
    }
    return (
      <span className="font-mono text-[11px] text-zinc-300">
        limit: <strong className="text-zinc-100">{rule.config?.limit}</strong> req /{' '}
        <strong className="text-zinc-100">{rule.config?.window_size}s</strong>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Limiting Policies & Rules"
        description="Configure evaluation algorithms, threshold windows, and resource paths for this application."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 border border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#78A1E2]" />
            <span>Create Rule</span>
          </button>
        }
      />

      {error && (
        <div className="text-xs font-mono text-red-300 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-3 border border-zinc-800 rounded-md font-mono text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search resource path e.g. /payments..."
            value={searchResource}
            onChange={(e) => setSearchResource(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="ALL">ALL</option>
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Algorithm:</span>
            <select
              value={algorithmFilter}
              onChange={(e) => setAlgorithmFilter(e.target.value)}
              className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="ALL">All Algorithms</option>
              {ALGORITHMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-800">
                <th className="p-3 font-normal">Method</th>
                <th className="p-3 font-normal">Resource Path</th>
                <th className="p-3 font-normal">Algorithm</th>
                <th className="p-3 font-normal">Configuration</th>
                <th className="p-3 font-normal">App Context</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-zinc-500">
                    Loading rules…
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-zinc-500">
                    No rate limiting rules match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.rule_id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3 font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
                        {rule.method}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-100 font-semibold">{rule.resource}</td>
                    <td className="p-3 text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#78A1E2]" />
                        {algorithmLabel(rule.algorithm)}
                      </span>
                    </td>
                    <td className="p-3">{renderConfigSummary(rule)}</td>
                    <td className="p-3 text-zinc-400 text-[11px] truncate max-w-[130px]">{appId}</td>
                    <td className="p-3">
                      <StatusBadge status="active" />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 rounded transition-colors"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              ruleId: rule.rule_id,
                              ruleName: `${rule.method} ${rule.resource}`,
                            })
                          }
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-850 rounded transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Rate Limiting Rule' : 'Create Rate Limiting Rule'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
          {formError && (
            <div className="text-red-300 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">{formError}</div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-zinc-400 mb-1">HTTP Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-zinc-400 mb-1">Resource Pattern</label>
              <input
                type="text"
                required
                placeholder="/api/v1/payments"
                value={form.resource}
                onChange={(e) => setForm((prev) => ({ ...prev, resource: e.target.value }))}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Rate Limit Algorithm</label>
            <select
              value={form.algorithm}
              onChange={(e) => setForm((prev) => ({ ...prev, algorithm: e.target.value }))}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              {ALGORITHMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-black border border-zinc-800 rounded p-3 space-y-3">
            <span className="text-zinc-400 text-[11px] uppercase tracking-wider block font-semibold">
              Algorithm Parameters ({algorithmLabel(form.algorithm)})
            </span>

            {(form.algorithm === 'fixed_window' || form.algorithm === 'sliding_window') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Max Requests (Limit)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.limit}
                    onChange={(e) => setForm((prev) => ({ ...prev, limit: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Window Size (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.window_size}
                    onChange={(e) => setForm((prev) => ({ ...prev, window_size: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            )}

            {form.algorithm === 'token_bucket' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Bucket Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Refill Rate (Tokens/sec)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={form.refill_rate}
                    onChange={(e) => setForm((prev) => ({ ...prev, refill_rate: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700"
            >
              {saving ? 'Saving…' : editingRule ? 'Save Changes' : 'Create Policy Rule'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, ruleId: null, ruleName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Rate Limit Rule"
        message={`Are you sure you want to delete policy "${deleteConfirm.ruleName}"? Requests to this method and resource will no longer match a rule.`}
        confirmText="Delete Rule"
        isDanger={true}
      />
    </div>
  );
};
