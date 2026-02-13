import { useState } from 'react';
import { Monitor, Tablet, Smartphone, RotateCw } from 'lucide-react';
import { useAgent } from '../../hooks/useAgent';
import { PreviewRenderer } from '../../preview/PreviewRenderer';

type Device = 'desktop' | 'tablet' | 'mobile';

interface PreviewPanelProps {
  agent: ReturnType<typeof useAgent>;
}

export function PreviewPanel({ agent }: PreviewPanelProps) {
  const [device, setDevice] = useState<Device>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
    agent.refresh();
  };

  return (
    <div className="h-full flex flex-col bg-[#EAECEF] dark:bg-[#0a0d11] transition-all duration-300">
      {/* Browser Chrome */}
      <div className="border-b border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111318] transition-all duration-300 shadow-sm">
        <div className="h-12 flex items-center px-4 gap-3 border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EC6A5E] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#F4BF4F] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#61C554] shadow-sm" />
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="px-4 py-2 bg-[#F6F7F9] dark:bg-[#1a1f2e] border border-[#E5E7EB] dark:border-[#2a3441] rounded-lg text-[13px] text-neutral-600 dark:text-neutral-400 transition-all duration-300 font-mono">
              localhost:5173
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-md transition-all duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Live</span>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a1f2e] transition-all duration-200 active:scale-95 group"
            >
              <RotateCw
                size={16}
                className={`text-neutral-500 dark:text-neutral-400 transition-all duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
              />
            </button>
          </div>
        </div>

        {/* Device Toggle */}
        <div className="h-12 flex items-center justify-center gap-2 bg-[#FAFBFC] dark:bg-[#0d1015] transition-all duration-300">
          <button onClick={() => setDevice('desktop')} className={`p-2.5 rounded-lg ${device === 'desktop' ? 'bg-white shadow-sm' : ''}`}><Monitor size={18} /></button>
          <button onClick={() => setDevice('tablet')} className={`p-2.5 rounded-lg ${device === 'tablet' ? 'bg-white shadow-sm' : ''}`}><Tablet size={18} /></button>
          <button onClick={() => setDevice('mobile')} className={`p-2.5 rounded-lg ${device === 'mobile' ? 'bg-white shadow-sm' : ''}`}><Smartphone size={18} /></button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div
          className="bg-white dark:bg-[#0D1117] transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative"
          style={{ width: getDeviceWidth(), height: '100%', minHeight: '400px' }}
        >
          {agent.isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
              <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-sm font-medium animate-pulse">Rebuilding Preview...</span>
            </div>
          ) : (
            <div className="preview-container h-full flex flex-col uppercase-none">
              <div className="h-8 px-4 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500">LIVE RENDERER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 font-mono">sandboxed</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative bg-white">
                <PreviewRenderer code={agent.currentCode} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

