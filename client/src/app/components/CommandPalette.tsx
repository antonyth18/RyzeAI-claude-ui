import { useState, useEffect } from 'react';
import { Search, Code, Layout, Palette, Wand2, FileCode, Settings } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'generate' | 'edit' | 'navigate' | 'settings';
  shortcut?: string;
}

const commands: Command[] = [
  { id: 'gen-component', label: 'Generate Component', icon: <Wand2 size={16} />, category: 'generate', shortcut: '⌘G' },
  { id: 'gen-layout', label: 'Generate Layout', icon: <Layout size={16} />, category: 'generate' },
  { id: 'improve-design', label: 'Improve Design', icon: <Palette size={16} />, category: 'edit', shortcut: '⌘I' },
  { id: 'refactor', label: 'Refactor Code', icon: <Code size={16} />, category: 'edit', shortcut: '⌘R' },
  { id: 'goto-file', label: 'Go to File', icon: <FileCode size={16} />, category: 'navigate', shortcut: '⌘P' },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} />, category: 'settings' },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          console.log('Execute:', filteredCommands[selectedIndex].label);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1f2e] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <Search size={20} className="text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none text-base"
            autoFocus
          />
          <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs text-neutral-600 dark:text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    console.log('Execute:', cmd.label);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className={`${
                    index === selectedIndex
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {cmd.icon}
                  </div>
                  <span className="flex-1 text-sm font-medium">{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-xs text-neutral-600 dark:text-neutral-400">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-[10px]">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-[10px]">
                ⏎
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded text-[10px]">
                ESC
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
