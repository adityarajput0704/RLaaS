import React from 'react';

export const PageHeader = ({ title, description, actions, badge }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100 font-mono">{title}</h1>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
