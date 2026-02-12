import { useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink } from 'lucide-react';

type Device = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel() {
  const [device, setDevice] = useState<Device>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollShadow, setShowScrollShadow] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setShowScrollShadow(target.scrollTop > 10);
  };

  return (
    <div className="h-full flex flex-col bg-[#EAECEF] dark:bg-[#0a0d11] transition-all duration-300">
      {/* Browser Chrome */}
      <div className="border-b border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111318] transition-all duration-300 shadow-sm">
        {/* Traffic Lights & URL Bar */}
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
              aria-label="Refresh"
            >
              <RotateCw 
                size={16} 
                className={`text-neutral-500 dark:text-neutral-400 transition-all duration-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
              />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a1f2e] transition-all duration-200 active:scale-95"
              aria-label="Open in new tab"
            >
              <ExternalLink size={16} className="text-neutral-500 dark:text-neutral-400 transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Device Toggle */}
        <div className="h-12 flex items-center justify-center gap-2 bg-[#FAFBFC] dark:bg-[#0d1015] transition-all duration-300">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 ${
              device === 'desktop'
                ? 'bg-white dark:bg-[#1a1f2e] text-neutral-900 dark:text-neutral-100 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 hover:bg-white dark:hover:bg-[#1a1f2e]'
            }`}
            aria-label="Desktop view"
          >
            <Monitor size={18} />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 ${
              device === 'tablet'
                ? 'bg-white dark:bg-[#1a1f2e] text-neutral-900 dark:text-neutral-100 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 hover:bg-white dark:hover:bg-[#1a1f2e]'
            }`}
            aria-label="Tablet view"
          >
            <Tablet size={18} />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2.5 rounded-lg transition-all duration-200 active:scale-95 ${
              device === 'mobile'
                ? 'bg-white dark:bg-[#1a1f2e] text-neutral-900 dark:text-neutral-100 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 hover:bg-white dark:hover:bg-[#1a1f2e]'
            }`}
            aria-label="Mobile view"
          >
            <Smartphone size={18} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div 
        className="flex-1 overflow-auto p-8 flex justify-center transition-all duration-300"
        onScroll={handleScroll}
      >
        <div 
          ref={previewRef}
          className={`bg-white transition-all duration-300 shadow-xl rounded-lg overflow-hidden border border-neutral-200 relative ${
            isRefreshing ? 'opacity-50' : 'opacity-100'
          }`}
          style={{ 
            width: getDeviceWidth(),
            maxWidth: '100%',
            height: device === 'mobile' ? '667px' : 'auto',
            minHeight: device === 'desktop' ? '100%' : 'auto'
          }}
        >
          {/* Scroll Shadow */}
          {showScrollShadow && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10" />
          )}
          
          {/* Rendered Preview */}
          <section className="relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50" />
            
            <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-24">
              <div className="max-w-3xl">
                <h1 className="text-6xl font-bold mb-6 text-neutral-900">
                  Build Something Amazing
                </h1>
                
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  The fastest way to turn your ideas into reality. Start building today.
                </p>
                
                <button className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-medium hover:scale-105 hover:shadow-2xl transition-all duration-200">
                  Get Started Free
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
