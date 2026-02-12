import React from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  className?: string;
  height?: number;
}

export function BarChart({ data, className = '', height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className={`${className}`}>
      <div 
        className="flex items-end gap-2 border-b border-[var(--color-border)] px-4 pb-2"
        style={{ height: `${height}px` }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          
          return (
            <div 
              key={index}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full flex flex-col items-center">
                <small className="text-[var(--color-text-tertiary)] mb-1">
                  {item.value}
                </small>
                <div 
                  className="w-full bg-[var(--color-slate-300)] rounded-t-[var(--radius-sm)] transition-all duration-300 hover:bg-[var(--color-slate-400)]"
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-4 pt-2">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex-1 text-center"
          >
            <small className="text-[var(--color-text-secondary)] truncate block">
              {item.label}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
