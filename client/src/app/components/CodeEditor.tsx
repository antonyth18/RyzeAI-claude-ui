import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileCode, Copy, Check, ChevronDown, History, Lightbulb } from 'lucide-react';
import { useAgent } from '../../hooks/useAgent';

interface Token {
  type: 'keyword' | 'string' | 'function' | 'normal' | 'comment' | 'tag' | 'attribute';
  text: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const patterns = [
    { type: 'comment', regex: /\/\/.*$/ },
    { type: 'keyword', regex: /\b(import|export|from|const|function|return|if|else|interface|type|class|interface|as|default|void|async|await)\b/ },
    { type: 'string', regex: /'[^']*'|"[^"]*"|`[^`]*`/ },
    { type: 'tag', regex: /<[a-zA-Z0-9]+|>/ },
    { type: 'attribute', regex: /\b[a-zA-Z-]+(?==)/ },
    { type: 'function', regex: /\b[a-zA-Z0-9_]+(?=\s*\()/ },
  ];

  let lastIndex = 0;
  const matches: { type: Token['type']; index: number; length: number; text: string }[] = [];

  patterns.forEach(({ type, regex }) => {
    let match;
    const globalRegex = new RegExp(regex, 'g');
    while ((match = globalRegex.exec(line)) !== null) {
      matches.push({ type: type as Token['type'], index: match.index, length: match[0].length, text: match[0] });
    }
  });

  matches.sort((a, b) => a.index - b.index);

  matches.forEach(m => {
    if (m.index >= lastIndex) {
      if (m.index > lastIndex) {
        tokens.push({ type: 'normal', text: line.slice(lastIndex, m.index) });
      }
      tokens.push({ type: m.type, text: m.text });
      lastIndex = m.index + m.length;
    }
  });

  if (lastIndex < line.length) {
    tokens.push({ type: 'normal', text: line.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'normal', text: line }];
}

function getTokenColor(type: Token['type'], isDark: boolean): string {
  if (isDark) {
    switch (type) {
      case 'keyword': return '#ff79c6';
      case 'string': return '#a5d6ff';
      case 'function': return '#7ee787';
      case 'tag': return '#7ee787';
      case 'attribute': return '#79c0ff';
      case 'comment': return '#8b949e';
      default: return '#e6edf3';
    }
  } else {
    switch (type) {
      case 'keyword': return '#d73a49';
      case 'string': return '#032f62';
      case 'function': return '#6f42c1';
      case 'tag': return '#22863a';
      case 'attribute': return '#6f42c1';
      case 'comment': return '#6a737d';
      default: return '#24292e';
    }
  }
}

interface CodeEditorProps {
  agent: ReturnType<typeof useAgent>;
}

interface ReasoningModalProps {
  explanation: string;
  isOpen: boolean;
  onClose: () => void;
}

function ReasoningModal({ explanation, isOpen, onClose }: ReasoningModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111318] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 ease-out duration-200">
        {/* Subtle Accent Gradient Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/20 to-indigo-500/20" />

        {/* Vertical Accent Line */}
        <div className="absolute top-12 bottom-8 left-0 w-1 bg-gradient-to-b from-violet-500/50 to-indigo-500/50 rounded-full ml-1.5 opacity-20" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-900/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Lightbulb size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Design Reasoning</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">AI thought process for this version</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all duration-200 active:scale-90"
          >
            <ChevronDown size={20} className="rotate-270" />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 py-5 max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
          <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 pr-2">
            {explanation.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Footer / Action */}
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-900 flex justify-end bg-neutral-50/20 dark:bg-neutral-900/5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium rounded-lg hover:opacity-90 transition-all active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CodeEditor({ agent }: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'hero'>('app');
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flashingLines, setFlashingLines] = useState<number[]>([]);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  // File Renaming State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const isDark = document.documentElement.classList.contains('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive "changed lines" or active lines if possible - for now we'll simulate the highlight on version change
  useEffect(() => {
    if (agent.currentCode) {
      // Simulate modification flash for the first few lines or randomized lines to show the effect
      const lines = [1, 2, 3, 4, 10, 11, 12]; // Simulated changed lines
      setFlashingLines(lines);
      const timer = setTimeout(() => setFlashingLines([]), 1200);
      return () => clearTimeout(timer);
    }
  }, [agent.currentCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentVersion = agent.versions[agent.versionIndex];
  const changedLines = [1, 2, 3, 4, 10, 11, 12]; // Placeholder for demo

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117] shadow-inner transition-all duration-300 relative overflow-hidden min-h-0 min-w-0">
      {/* Subtle depth noise overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03] z-50"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")'
        }}
      />

      {/* File Tabs & Tools */}
      <div className="relative h-11 border-b border-[#E5E7EB] dark:border-[#21262d] flex items-center justify-between px-3 bg-[#FAFBFC] dark:bg-[#0a0c10] transition-all duration-300 z-10">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pr-12">
          {agent.agentFiles.map((file) => {
            const isRenaming = renamingId === file.id;

            return (
              <div
                key={file.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs transition-all duration-200 relative whitespace-nowrap cursor-pointer ${agent.activeFileId === file.id
                  ? 'bg-white dark:bg-[#0D1117] text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-[#F3F4F6] dark:hover:bg-[#161b22]'
                  }`}
                onClick={() => !isRenaming && agent.setActiveFile(file.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRenamingId(file.id);
                  setTempName(file.name);
                }}
              >
                <FileCode size={14} className={agent.activeFileId === file.id ? 'text-violet-500' : ''} />

                {isRenaming ? (
                  <input
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        agent.renameFile(file.id, tempName);
                        setRenamingId(null);
                      } else if (e.key === 'Escape') {
                        setRenamingId(null);
                      }
                    }}
                    onBlur={() => {
                      agent.renameFile(file.id, tempName);
                      setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-b border-violet-500 focus:outline-none w-20 text-xs px-0 py-0"
                  />
                ) : (
                  <span>{file.name}</span>
                )}

                {/* Delete Button (Only visible on hover, stops propagation) */}
                {!isRenaming && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      agent.deleteFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-red-500 hover:text-white transition-all ml-1 text-neutral-400"
                    title="Delete File"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}

                {agent.activeFileId === file.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/50" />
                )}
              </div>
            );
          })}

          <button
            onClick={() => agent.createFile()}
            className="p-1.5 ml-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-all active:scale-90"
            title="Create New File"
          >
            <div className="w-5 h-5 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded text-lg font-light leading-none">
              +
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Version Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-all"
            >
              <History size={12} />
              <span>v{agent.versionIndex + 1}</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${showVersionDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showVersionDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#161b22] border border-[#E5E7EB] dark:border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  <div className="px-3 py-2 border-b border-[#E5E7EB] dark:border-[#30363d] bg-neutral-50/50 dark:bg-neutral-900/50">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">History</span>
                  </div>
                  {agent.versions.map((v: any, i: number) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        agent.rollbackVersion(v.id, i);
                        setShowVersionDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 transition-all border-b border-[#E5E7EB] dark:border-[#30363d] last:border-0 ${agent.versionIndex === i
                        ? 'bg-violet-50/50 dark:bg-violet-900/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-[#1c2128]'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={`text-sm font-semibold ${agent.versionIndex === i ? 'text-violet-600 dark:text-violet-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          v{i + 1}
                        </span>
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                          {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`text-xs truncate ${agent.versionIndex === i ? 'text-violet-500/80 dark:text-violet-400/80' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {v.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium transition-all duration-200 rounded ${showReasoning
              ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
          >
            <Lightbulb size={12} />
            <span>Design Reasoning</span>
            <ChevronDown size={10} className={`transition-transform duration-300 ${showReasoning ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-all active:scale-95"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>


      {/* Editor & Explanation area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div
          className="flex-1 overflow-auto scrollbar-thin relative"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace" }}
        >
          <div className="p-4 min-h-full">
            <pre className="text-[14px] leading-[1.6] text-neutral-900 dark:text-neutral-100">
              {agent.currentCode.split('\n').map((line: string, i: number) => {
                const lineNumber = i + 1;
                const tokens = tokenizeLine(line);
                const isFlashing = flashingLines.includes(lineNumber);
                const isChanged = changedLines.includes(lineNumber);

                return (
                  <div
                    key={`${lineNumber}-${i}`}
                    onMouseEnter={() => setHoveredLine(lineNumber)}
                    onMouseLeave={() => setHoveredLine(null)}
                    className={`flex relative group transition-all duration-200 ${isFlashing ? 'bg-emerald-500/10' : ''
                      }`}
                  >
                    {isChanged && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    )}
                    <span className="select-none w-14 text-right pr-4 shrink-0 text-neutral-400 dark:text-neutral-600 transition-colors duration-300 text-[13px]">
                      {lineNumber}
                    </span>
                    <span className="flex-1 whitespace-pre">
                      {tokens.map((token: Token, j: number) => (
                        <span
                          key={j}
                          style={{ color: getTokenColor(token.type, isDark) }}
                          className="transition-colors duration-300"
                        >
                          {token.text}
                        </span>
                      ))}
                    </span>
                    {isChanged && hoveredLine === lineNumber && (
                      <div className="absolute left-16 -top-8 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] rounded shadow-lg whitespace-nowrap z-20 animate-in fade-in zoom-in-95 duration-200">
                        Updated by AI
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100" />
                      </div>
                    )}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Premium Reasoning Modal */}
        <ReasoningModal
          explanation={currentVersion?.explanation || ''}
          isOpen={showReasoning}
          onClose={() => setShowReasoning(false)}
        />
      </div>

      {/* Status Bar */}
      <div className="h-7 border-t border-[#E5E7EB] dark:border-[#21262d] bg-[#F8F9FA] dark:bg-[#0a0c10] flex items-center justify-between px-4 text-[11px] text-neutral-500 dark:text-neutral-400 transition-all duration-300 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-medium">TypeScript</span>
          <span>UTF-8</span>
          <span>Ln {agent.currentCode.split('\n').length}, Col 1</span>
        </div>
        <div>
          {agent.isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
              Processing...
            </span>
          ) : 'Ready'}
        </div>
      </div>
    </div>
  );
}
