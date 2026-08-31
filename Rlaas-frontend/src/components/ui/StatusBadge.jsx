import React from 'react';

export const StatusBadge = ({ status, variant, label }) => {
  const text = label || status;
  const s = (status || '').toLowerCase();

  // Allowed / Active -> subtle blue accent (#8EB2EB / #5C8BD6)
  if (s === 'allowed' || s === '200' || variant === 'allowed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-950/60 text-[#8EB2EB] border border-[#5C8BD6]/40">
        <span className="w-1.5 h-1.5 rounded-full bg-[#78A1E2]" />
        {text}
      </span>
    );
  }

  // Blocked -> subtle red
  if (s === 'blocked' || s === '429' || variant === 'blocked') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-red-950/40 text-red-400 border border-red-900/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {text}
      </span>
    );
  }

  // Active state
  if (s === 'active' || variant === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-[#78A1E2]" />
        {text}
      </span>
    );
  }

  // Expiring / Warning state
  if (s === 'expiring' || variant === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        {text}
      </span>
    );
  }

  // Disabled / Inactive / Default
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      {text}
    </span>
  );
};
