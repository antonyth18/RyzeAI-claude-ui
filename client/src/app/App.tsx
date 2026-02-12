import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppHeader } from './components/AppHeader';
import { ChatPanel } from './components/ChatPanel';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { CommandPalette } from './components/CommandPalette';

function AppContent() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [health, setHealth] = useState<{ status: string } | null>(null);

  useEffect(() => {
    fetch('http://localhost:5001/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error('Fetch error:', err));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] dark:bg-[#0F1115] transition-colors duration-300">
      <AppHeader onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat (22%) */}
        <div
          style={{ width: '22%' }}
          className="border-r border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300"
        >
          <ChatPanel />
        </div>

        {/* Center Panel - Editor (48%) */}
        <div
          style={{ width: '48%' }}
          className="border-r-2 border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300 relative"
        >
          {/* Active panel glow */}
          <div className="absolute -right-px top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent pointer-events-none" />
          <CodeEditor />
        </div>

        {/* Right Panel - Preview (30%) */}
        <div
          style={{ width: '30%' }}
          className="overflow-hidden"
        >
          <PreviewPanel />
        </div>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Backend Status floating indicator */}
      <div className="backend-status">
        Backend: <strong>{health?.status || 'loading...'}</strong>
      </div>
    </div>

  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
