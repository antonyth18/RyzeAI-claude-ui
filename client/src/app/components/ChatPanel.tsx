import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import { useAgent } from '../../hooks/useAgent';

const quickActions = [
  'Add Section',
  'Improve Design',
  'Refactor Layout',
  'Add Animation'
];

interface ChatPanelProps {
  agent: ReturnType<typeof useAgent>;
}

export function ChatPanel({ agent }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showRevertToast, setShowRevertToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agent.messages, agent.isLoading]);

  const handleSend = () => {
    if (!input.trim() || agent.isLoading) return;
    agent.sendMessage(input);
    setInput('');
  };


  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F7F9] dark:bg-[#111318] transition-all duration-300 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300 bg-white dark:bg-[#0d1015]">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 transition-colors duration-300 tracking-tight flex items-center gap-2">
          AI Builder
          {agent.versionIndex >= 0 && (
            <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/50 px-1.5 py-0.5 rounded uppercase tracking-widest">
              v{agent.versionIndex + 1}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg transition-all duration-300">
            <Sparkles size={12} className="text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300 transition-colors duration-300">
              Groq 4.1
            </span>
          </div>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 transition-colors duration-300">
          Editing: <span className="text-neutral-700 dark:text-neutral-200 font-medium">
            {agent.agentFiles.find(f => f.id === agent.activeFileId)?.name || 'New File'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">
          {agent.messages.map((message) => (
            <div key={message.id} className="group space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500 transition-colors duration-300">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 transition-colors duration-300">
                    {message.timestamp}
                  </div>
                </div>

                {message.role === 'user' && (
                  <button
                    onClick={() => {
                      // Find the version corresponding to this prompt
                      // We link based on prompt content (or we could pass an ID if we had it in history)
                      const vIndex = agent.versions.findIndex(v => v.prompt === message.content);
                      if (vIndex !== -1) {
                        agent.rollbackVersion(agent.versions[vIndex].id, vIndex);
                        setShowRevertToast(true);
                        setTimeout(() => setShowRevertToast(false), 3000);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-200 transition-all duration-200 font-medium flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Revert
                  </button>
                )}
              </div>
              <div className={`text-[13px] leading-relaxed transition-all duration-300 ${message.role === 'user'
                ? 'text-neutral-900 dark:text-neutral-100 p-3 bg-white dark:bg-[#1a1f2e] rounded-lg border border-[#E5E7EB] dark:border-[#2a3441]'
                : 'text-neutral-700 dark:text-neutral-300 p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1f2e] dark:to-[#151a27] rounded-lg shadow-sm'
                }`}>
                {message.content}
              </div>
            </div>
          ))}

          {agent.isLoading && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                Assistant
              </div>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1f2e] dark:to-[#151a27] rounded-lg shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}


          {agent.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <div className="text-red-600 dark:text-red-400 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-red-800 dark:text-red-300">Generation Error</div>
                  <div className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                    {agent.error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>
      </div>

      {/* Quick Actions & Input */}
      <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] p-4 space-y-3 transition-colors duration-300 bg-white dark:bg-[#0d1015]">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-[#1a1f2e] border border-[#E5E7EB] dark:border-[#2a3441] text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-[#F6F7F9] dark:hover:bg-[#252b3b] hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 active:scale-95"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Undo/Revert Toasts */}
        {(agent.showUndoToast || showRevertToast) && (
          <div className="mx-auto max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg">
              <span className="text-[11px] font-medium">
                {showRevertToast ? 'Restored to previous version' : 'Changes applied.'}
              </span>
              {!showRevertToast && (
                <button
                  onClick={() => {
                    agent.undo();
                    agent.setShowUndoToast(false);
                  }}
                  className="text-[11px] font-bold text-violet-400 dark:text-violet-600 hover:text-violet-300 dark:hover:text-violet-500 transition-colors"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your changes..."
            className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-[#1a1f2e] border border-[#E5E7EB] dark:border-[#2a3441] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 dark:focus:border-violet-500 transition-all duration-200"
            rows={2}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm hover:shadow-md"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
