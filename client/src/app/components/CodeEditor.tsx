import { useState } from 'react';
import { FileCode } from 'lucide-react';
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

export function CodeEditor({ agent }: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'app' | 'hero'>('app');
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117] shadow-inner transition-all duration-300 relative">
      {/* File Tabs */}
      <div className="relative h-11 border-b border-[#E5E7EB] dark:border-[#21262d] flex items-center px-3 gap-1 bg-[#FAFBFC] dark:bg-[#0a0c10] transition-all duration-300">
        <button
          onClick={() => setActiveTab('app')}
          className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs transition-all duration-200 relative ${activeTab === 'app'
            ? 'bg-white dark:bg-[#0D1117] text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-[#F3F4F6] dark:hover:bg-[#161b22]'
            }`}
        >
          <FileCode size={14} />
          <span>App.tsx</span>
          {activeTab === 'app' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/50" />
          )}
        </button>
      </div>

      {/* Editor */}
      <div
        className="flex-1 overflow-y-auto relative"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace" }}
      >
        <div className="p-4">
          <pre className="text-[14px] leading-[1.6]">
            {agent.currentCode.split('\n').map((line, i) => {
              const lineNumber = i + 1;
              const tokens = tokenizeLine(line);

              return (
                <div
                  key={i}
                  className="flex relative group transition-all duration-200"
                >
                  <span className="select-none w-14 text-right pr-4 shrink-0 text-neutral-400 dark:text-neutral-600 transition-colors duration-300 text-[13px]">
                    {lineNumber}
                  </span>
                  <span className="flex-1">
                    {tokens.map((token, j) => (
                      <span
                        key={j}
                        style={{ color: getTokenColor(token.type, isDark) }}
                        className="transition-colors duration-300"
                      >
                        {token.text}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-7 border-t border-[#E5E7EB] dark:border-[#21262d] bg-[#F8F9FA] dark:bg-[#0a0c10] flex items-center justify-between px-4 text-[11px] text-neutral-500 dark:text-neutral-400 transition-all duration-300">
        <div className="flex items-center gap-4">
          <span className="font-medium">TypeScript</span>
          <span>UTF-8</span>
          <span>Ln 1, Col 1</span>
        </div>
        <div>
          {agent.isLoading ? 'Processing...' : 'Ready'}
        </div>
      </div>
    </div>
  );
}
