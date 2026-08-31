import React from 'react';
import { Info } from 'lucide-react';

export const Notice = ({ children, title = 'Technical Note', icon: Icon = Info }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3 text-xs text-zinc-300 flex items-start gap-3 my-4">
      <Icon className="w-4 h-4 text-[#78A1E2] shrink-0 mt-0.5" />
      <div>
        {title && <span className="font-semibold text-zinc-200 block mb-0.5 font-mono">{title}</span>}
        <div className="text-zinc-400 leading-relaxed font-sans">{children}</div>
      </div>
    </div>
  );
};
