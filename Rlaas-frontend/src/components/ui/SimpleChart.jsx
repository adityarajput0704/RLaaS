import React, { useState } from 'react';

export const SimpleChart = ({ data = [], height = 180 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => (d.allowed || 0) + (d.blocked || 0)), 100);
  const chartWidth = 600;
  const chartHeight = height;
  const paddingLeft = 40;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingRight = 15;

  const innerW = chartWidth - paddingLeft - paddingRight;
  const innerH = chartHeight - paddingTop - paddingBottom;

  const getX = (idx) => paddingLeft + (idx / (data.length - 1)) * innerW;
  const getY = (val) => paddingTop + innerH - (val / maxVal) * innerH;

  const allowedPoints = data
    .map((d, i) => `${getX(i)},${getY(d.allowed || 0)}`)
    .join(' ');

  const blockedPoints = data
    .map((d, i) => `${getX(i)},${getY(d.blocked || 0)}`)
    .join(' ');

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
        <span className="text-zinc-300 font-medium">Request Rate (24h Activity)</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#78A1E2]" /> Allowed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-500" /> Blocked
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto text-xs font-mono select-none"
        >
          {/* Subtle horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingTop + innerH * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9"
                >
                  {val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#78A1E2"
            strokeWidth="2"
            points={allowedPoints}
          />

          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            points={blockedPoints}
          />

          {/* Interactive dots & X-Axis labels */}
          {data.map((d, i) => {
            const x = getX(i);
            const yAllowed = getY(d.allowed || 0);
            const isHovered = hoveredIdx === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* X Axis Label */}
                {i % 2 === 0 && (
                  <text
                    x={x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize="9"
                  >
                    {d.time}
                  </text>
                )}

                {/* Hover line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke="#52525b"
                    strokeWidth="1"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={x}
                  cy={yAllowed}
                  r={isHovered ? 4 : 2.5}
                  fill="#78A1E2"
                  stroke="#000000"
                  strokeWidth="1"
                  className="cursor-pointer transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-4 bg-zinc-900 border border-zinc-700 text-xs font-mono p-2 rounded shadow-lg text-zinc-200 pointer-events-none">
            <div className="text-zinc-400 font-semibold mb-1">{data[hoveredIdx].time}</div>
            <div className="text-[#8EB2EB]">Allowed: {(data[hoveredIdx].allowed || 0).toLocaleString()}</div>
            <div className="text-red-400">Blocked: {(data[hoveredIdx].blocked || 0).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
