import { Sun, Moon, Command, Play, Check, ChevronDown, GitBranch } from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';
import type { ProjectMeta } from '../../services/agentService';

export type Mode = 'builder' | 'code' | 'inspect';

interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  onRun: () => void;
  onReset: () => void;
  meta: ProjectMeta | null;
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function AppHeader({ onOpenCommandPalette, onRun, onReset, meta, activeMode, onModeChange }: AppHeaderProps) {

  const { theme, toggleTheme } = useTheme();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the project? This will delete all files except App.tsx and clear all chat history.")) {
      onReset();
    }
  };

  return (
    <div className="h-14 border-b border-[#E5E7EB]/60 dark:border-[#1F2937]/60 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-lg flex items-center justify-between px-6 transition-all duration-300 relative z-10">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 border-2 border-white rounded" />
          </div>
        </div>

        <div className="w-px h-6 bg-[#E5E7EB] dark:bg-[#2a3441] transition-colors duration-300" />

        {/* Project Name */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a1f2e] transition-all duration-200 group active:scale-98">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
            {meta?.name || 'Loading Project...'}
          </span>
          <ChevronDown size={14} className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-all duration-200" />
        </button>

        {/* Branch Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F6F7F9] dark:bg-[#1a1f2e] border border-[#E5E7EB] dark:border-[#2a3441] rounded-full transition-all duration-300">
          <GitBranch size={12} className="text-neutral-500 dark:text-neutral-400" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors duration-300">
            {meta?.branch || '...'}
          </span>
        </div>

        <div className="w-px h-6 bg-[#E5E7EB] dark:bg-[#2a3441] transition-colors duration-300" />

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all duration-200 active:scale-95"
          title="Reset Project State"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Reset Project
        </button>
      </div>

      {/* Center Section - Segmented Control */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-1 p-1 bg-[#F6F7F9] dark:bg-[#0d1015] border border-[#E5E7EB] dark:border-[#2a3441] rounded-xl shadow-sm transition-all duration-300">
          <button
            onClick={() => onModeChange('builder')}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeMode === 'builder'
              ? 'text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
          >
            {activeMode === 'builder' && (
              <div className="absolute inset-0 bg-white dark:bg-[#1a1f2e] rounded-lg shadow-md transition-all duration-300" />
            )}
            <span className="relative z-10">Builder</span>
            {activeMode === 'builder' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-lg shadow-violet-500/50" />
            )}
          </button>

          <button
            onClick={() => onModeChange('code')}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeMode === 'code'
              ? 'text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
          >
            {activeMode === 'code' && (
              <div className="absolute inset-0 bg-white dark:bg-[#1a1f2e] rounded-lg shadow-md transition-all duration-300" />
            )}
            <span className="relative z-10">Code</span>
            {activeMode === 'code' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-lg shadow-violet-500/50" />
            )}
          </button>

          <button
            onClick={() => onModeChange('inspect')}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeMode === 'inspect'
              ? 'text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
          >
            {activeMode === 'inspect' && (
              <div className="absolute inset-0 bg-white dark:bg-[#1a1f2e] rounded-lg shadow-md transition-all duration-300" />
            )}
            <span className="relative z-10">Inspect</span>
            {activeMode === 'inspect' && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-lg shadow-violet-500/50" />
            )}
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Save Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 transition-colors duration-300">
          <Check size={14} className="text-emerald-500" />
          <span className="font-medium">Saved</span>
        </div>

        <div className="w-px h-6 bg-[#E5E7EB] dark:bg-[#2a3441] transition-colors duration-300" />

        {/* Run Button */}
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-neutral-900/20 dark:hover:shadow-neutral-100/20 transition-all duration-200 active:scale-95 group"
        >
          <Play size={14} className="group-hover:scale-110 transition-transform duration-200" fill="currentColor" />
          <span>Run</span>
        </button>

        <div className="w-px h-6 bg-[#E5E7EB] dark:bg-[#2a3441] transition-colors duration-300" />

        {/* Command Palette */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a1f2e] transition-all duration-200 group active:scale-95"
        >
          <Command size={16} className="text-neutral-500 dark:text-neutral-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors duration-200" />
          <kbd className="px-2 py-0.5 bg-[#F6F7F9] dark:bg-[#1a1f2e] border border-[#E5E7EB] dark:border-[#2a3441] rounded text-xs text-neutral-600 dark:text-neutral-400 font-medium transition-all duration-300">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#1a1f2e] transition-all duration-200 active:scale-95 group overflow-hidden"
          aria-label="Toggle theme"
        >
          <div className="relative w-5 h-5">
            <Sun
              size={20}
              className={`absolute inset-0 text-amber-500 transition-all duration-300 ${theme === 'light'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 rotate-180 scale-50'
                }`}
            />
            <Moon
              size={20}
              className={`absolute inset-0 text-indigo-400 transition-all duration-300 ${theme === 'dark'
                ? 'opacity-100 rotate-0 scale-100'
                : 'opacity-0 -rotate-180 scale-50'
                }`}
            />
          </div>

          {/* Hover glow effect */}
          <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme === 'light'
            ? 'bg-amber-500/10'
            : 'bg-indigo-500/10'
            }`} />
        </button>
      </div>
    </div>
  );
}
