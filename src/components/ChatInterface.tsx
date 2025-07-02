'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal } from 'lucide-react';

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
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: data.error || 'Something went wrong',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Network error occurred',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Ready to chat!</h3>
                <p className="text-gray-400 max-w-md">
                  Your PDF has been processed. Ask me anything about the document and I'll help you find the answers.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {[
                  "What is this document about?",
                  "Summarize the key points",
                  "What are the main conclusions?",
                  "Find specific information..."
                ].map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-left text-sm text-gray-300 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700 hover:border-green-400/30 rounded-lg transition-all duration-200"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex space-x-3 max-w-4xl ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-br from-green-400 to-emerald-600'
                    }`}>
                      {message.role === 'user' ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col space-y-2 ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 px-2">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-3 max-w-4xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="bg-gray-800 text-gray-100 border border-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-green-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-300">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <form onSubmit={sendMessage} className="p-4">
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your PDF..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none min-h-[48px] max-h-[120px]"
                disabled={loading}
                rows={1}
              />
              
              {/* Character count or other indicators can go here */}
              {input.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-3 top-3"
                >
                  <div className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center">
                    <span className="text-xs text-green-400 font-medium">
                      {input.length > 100 ? '!' : '✓'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                loading || !input.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-400 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-700 shadow-lg hover:shadow-green-400/25'
              }`}
              whileHover={!loading && input.trim() ? { scale: 1.05 } : {}}
              whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                />
              ) : (
                <SendHorizontal />
              )}
            </motion.button>
          </div>

          {/* Input hints */}
          <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>AI Ready</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}