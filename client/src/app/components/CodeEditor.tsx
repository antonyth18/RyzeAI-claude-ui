import { useState, useEffect } from 'react';
import { FileCode } from 'lucide-react';

const sampleCode = `import React from 'react';

export default function Hero() {
  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br 
        from-violet-50 to-indigo-50" />
      
      <div className="relative max-w-6xl mx-auto px-6 
        pt-32 pb-24">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-bold mb-6 
            text-neutral-900">
            Build Something Amazing
          </h1>
          
          <p className="text-xl text-neutral-600 mb-8 
            leading-relaxed">
            The fastest way to turn your ideas into 
            reality. Start building today.
          </p>
          
          <button className="px-8 py-4 bg-neutral-900 
            text-white rounded-lg font-medium 
            hover:scale-105 hover:shadow-2xl 
            transition-all duration-200">
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}`;

const changedLines = [19, 20, 21, 22];
const activeLine = 19;

interface Token {
  type: 'keyword' | 'string' | 'function' | 'tag' | 'attribute' | 'comment' | 'normal';
  text: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  
  // Simple syntax highlighting rules
  const keywords = /\b(import|export|default|function|return|const|let|var|from|className)\b/g;
  const strings = /"[^"]*"|'[^']*'|`[^`]*`/g;
  const tags = /<\/?[a-zA-Z][a-zA-Z0-9]*|\/>/g;
  const comments = /\/\/.*/g;
  
  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; type: Token['type'] }> = [];
  
  // Find all matches
  let match;
  while ((match = keywords.exec(line)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'keyword' });
  }
  while ((match = strings.exec(line)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'string' });
  }
  while ((match = tags.exec(line)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'tag' });
  }
  while ((match = comments.exec(line)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'comment' });
  }
  
  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);
  
  // Build tokens
  matches.forEach(m => {
    if (m.index > lastIndex) {
      tokens.push({ type: 'normal', text: line.slice(lastIndex, m.index) });
    }
    tokens.push({ type: m.type, text: line.slice(m.index, m.index + m.length) });
    lastIndex = m.index + m.length;
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

export function CodeEditor() {
  const [flashingLines, setFlashingLines] = useState<number[]>([]);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'app' | 'hero'>('app');
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    // Simulate AI modification flash
    const timer = setTimeout(() => {
      setFlashingLines(changedLines);
      setTimeout(() => setFlashingLines([]), 800);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0D1117] shadow-inner transition-all duration-300 relative">
      {/* Subtle depth overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23noise)" /%3E%3C/svg%3E")'
        }} 
      />

      {/* File Tabs */}
      <div className="relative h-11 border-b border-[#E5E7EB] dark:border-[#21262d] flex items-center px-3 gap-1 bg-[#FAFBFC] dark:bg-[#0a0c10] transition-all duration-300">
        <button
          onClick={() => setActiveTab('app')}
          className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs transition-all duration-200 relative ${
            activeTab === 'app'
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
        <button
          onClick={() => setActiveTab('hero')}
          className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs transition-all duration-200 relative ${
            activeTab === 'hero'
              ? 'bg-white dark:bg-[#0D1117] text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-[#F3F4F6] dark:hover:bg-[#161b22]'
          }`}
        >
          <FileCode size={14} />
          <span>Hero.tsx</span>
          {activeTab === 'hero' && (
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
            {sampleCode.split('\n').map((line, i) => {
              const lineNumber = i + 1;
              const isChanged = changedLines.includes(lineNumber);
              const isActiveLine = lineNumber === activeLine;
              const isFlashing = flashingLines.includes(lineNumber);
              const tokens = tokenizeLine(line);
              
              return (
                <div 
                  key={i}
                  onMouseEnter={() => setHoveredLine(lineNumber)}
                  onMouseLeave={() => setHoveredLine(null)}
                  className={`flex relative group transition-all duration-200 ${
                    isActiveLine 
                      ? 'bg-[#F3F4F6] dark:bg-[#161b22]' 
                      : ''
                  } ${
                    isFlashing
                      ? 'bg-emerald-500/10'
                      : ''
                  }`}
                >
                  {isChanged && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  )}
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
                  {isChanged && hoveredLine === lineNumber && (
                    <div className="absolute left-16 -top-8 px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] rounded shadow-lg whitespace-nowrap z-10">
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

      {/* Status Bar */}
      <div className="h-7 border-t border-[#E5E7EB] dark:border-[#21262d] bg-[#F8F9FA] dark:bg-[#0a0c10] flex items-center justify-between px-4 text-[11px] text-neutral-500 dark:text-neutral-400 transition-all duration-300">
        <div className="flex items-center gap-4">
          <span className="font-medium">TypeScript</span>
          <span>UTF-8</span>
          <span>Ln {activeLine}, Col 18</span>
        </div>
        <div>
          Spaces: 2
        </div>
      </div>
    </div>
  );
}
