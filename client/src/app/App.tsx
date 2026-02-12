import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppHeader } from './components/AppHeader';
import { ChatPanel } from './components/ChatPanel';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { CommandPalette } from './components/CommandPalette';
import { useAgent } from '../hooks/useAgent';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "./components/ui/resizable";

function AppContent() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const agent = useAgent();

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
      <AppHeader
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        meta={agent.meta}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* Left Panel - Chat */}
          <ResizablePanel defaultSize="25" minSize="20" maxSize="40">
            <div className="h-full border-r border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300">
              <ChatPanel agent={agent} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Editor */}
          <ResizablePanel defaultSize="40" minSize="30">
            <div className="h-full border-r-2 border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300 relative">
              <div className="absolute -right-px top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent pointer-events-none" />
              <CodeEditor agent={agent} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Preview */}
          <ResizablePanel defaultSize="35" minSize="25">


            <div className="h-full overflow-hidden">
              <PreviewPanel agent={agent} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Backend Status floating indicator */}
      <div className="backend-status">
        Backend: <strong>{agent.isLoading ? 'loading...' : (agent.error ? 'Error' : 'Live')}</strong>
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

