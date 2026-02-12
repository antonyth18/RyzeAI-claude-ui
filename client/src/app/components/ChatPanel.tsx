import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  actions?: string[];
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'user',
    content: 'Create a hero section with a gradient background and CTA button',
    timestamp: '2:34 PM'
  },
  {
    id: 2,
    role: 'assistant',
    content: 'I\'ll create a modern hero section for you with a clean gradient and prominent call-to-action.',
    actions: ['Generating component...', 'Updating layout...', 'Adding styles...'],
    timestamp: '2:34 PM'
  },
  {
    id: 3,
    role: 'user',
    content: 'Make the button more prominent with a hover effect',
    timestamp: '2:36 PM'
  },
  {
    id: 4,
    role: 'assistant',
    content: 'Updated the button with a scale hover effect and enhanced shadow for better prominence.',
    actions: ['Refactoring styles...'],
    timestamp: '2:36 PM'
  }
];

const quickActions = [
  'Add Section',
  'Improve Design',
  'Refactor Layout',
  'Add Animation'
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const newMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: time
    };

    setMessages([...messages, newMessage]);
    setInput('');
    
    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
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
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 transition-colors duration-300 tracking-tight">
          AI Builder
        </h2>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg transition-all duration-300">
            <Sparkles size={12} className="text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300 transition-colors duration-300">
              Claude 3.5
            </span>
          </div>
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 transition-colors duration-300">
          Editing: <span className="text-neutral-700 dark:text-neutral-200 font-medium">App.tsx</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500 transition-colors duration-300">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 transition-colors duration-300">
                  {message.timestamp}
                </div>
              </div>
              <div className={`text-[13px] leading-relaxed transition-all duration-300 ${
                message.role === 'user' 
                  ? 'text-neutral-900 dark:text-neutral-100 p-3 bg-white dark:bg-[#1a1f2e] rounded-lg border border-[#E5E7EB] dark:border-[#2a3441]' 
                  : 'text-neutral-700 dark:text-neutral-300 p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#1a1f2e] dark:to-[#151a27] rounded-lg shadow-sm'
              }`}>
                {message.content}
              </div>
              {message.actions && (
                <div className="space-y-1.5 mt-2 pl-3">
                  {message.actions.map((action, i) => (
                    <div 
                      key={i} 
                      className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 transition-colors duration-300"
                    >
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
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
