import React from 'react';

export const MetricCard = ({ title, value, subtext, icon: Icon, badgeText, badgeVariant }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between text-zinc-400 mb-2">
        <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-zinc-100 font-mono">{value}</span>
        {badgeText && (
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              badgeVariant === 'danger'
                ? 'bg-red-950/60 text-red-400 border border-red-900/50'
                : badgeVariant === 'success'
                ? 'bg-blue-950/60 text-[#8EB2EB] border border-blue-900/50'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-zinc-500 mt-2 font-mono">{subtext}</p>}
    </div>
  );
};
