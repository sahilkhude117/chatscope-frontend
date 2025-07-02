'use client'
import { useState } from 'react'
import { Send, Upload, Bot, User } from 'lucide-react'
import axios from 'axios'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        sessionId: 'user-session'
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      await axios.post('/api/upload', formData)
      alert('File uploaded successfully!')
      setFile(null)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ChatScope AI</h1>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </label>
            {file && (
              <button
                onClick={handleFileUpload}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Process File
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.isUser ? (
                    <User className="w-4 h-4 mt-1 flex-shrink-0" />
                  ) : (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about your documents..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}