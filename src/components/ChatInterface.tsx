'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Bot, User, CornerDownLeft } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming you have a utility for merging Tailwind classes

// --- Magic UI Components (or similar implementations) ---

// A subtle animated background pattern
const DotPattern = () => (
  <div className="absolute inset-0 h-full w-full bg-transparent bg-[radial-gradient(#2d3748,transparent_1px)] [background-size:16px_16px]" />
);

// A card that has a glowing effect
const MagicCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/80 p-4 shadow-2xl backdrop-blur-sm", className)}>
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_farthest-side_at_50%_50%,rgba(34,197,94,0.15),rgba(255,255,255,0))]"></div>
    {children}
  </div>
);


// --- Main Chat Interface Component ---

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (loading) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.error || 'An unexpected error occurred.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Network error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white relative">
      <DotPattern />
      <div className="flex-1 overflow-y-auto p-6 space-y-8 z-10">
        <AnimatePresence>
          {messages.length === 0 ? (
            <WelcomeScreen setInput={setInput} />
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))
          )}
        </AnimatePresence>

        {loading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-700/60 bg-gray-900/50 backdrop-blur-lg p-4 z-10">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your document..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            disabled={loading}
            rows={1}
          />
          <motion.button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.1, backgroundColor: '#22c55e' }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full"
                />
            ) : (
              <SendHorizontal size={24} />
            )}
          </motion.button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-2">
            <CornerDownLeft size={12} /> Press Enter to send, <kbd className="font-sans">Shift + Enter</kbd> for a new line.
        </p>
      </div>
    </div>
  );
}

// --- Sub-components for a cleaner structure ---

const WelcomeScreen = ({ setInput }: { setInput: (value: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center h-full text-center space-y-6"
  >
    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
      <Bot size={32} className="text-white" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-white">AI Assistant Ready</h2>
      <p className="text-gray-400 max-w-md mt-2">
        I've analyzed your document. What would you like to know?
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full pt-4">
      {[
        "What is the main purpose of this document?",
        "Summarize the key findings.",
        "Who is the intended audience?",
        "Are there any action items for me?",
      ].map((text, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 + 0.3 }}
          onClick={() => setInput(text)}
          className="p-3 text-left text-sm text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
        >
          {text}
        </motion.button>
      ))}
    </div>
  </motion.div>
);

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-start gap-3", isUser && "justify-end")}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot size={18} />
        </div>
      )}
      <MagicCard
        className={cn(
          "max-w-2xl",
          isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none border-gray-700"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </MagicCard>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <User size={18} />
        </div>
      )}
    </motion.div>
  );
};

const LoadingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3"
    >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot size={18} />
        </div>
        <MagicCard className="bg-gray-800 text-gray-200 rounded-bl-none border-gray-700">
            <div className="flex items-center gap-2">
                <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
            </div>
      </MagicCard>
    </motion.div>
);