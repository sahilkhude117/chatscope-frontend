import Link from 'next/link'
import { MessageCircle, Upload, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            ChatScope AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Ask Your Docs Anything - Upload PDFs and Chat with AI
          </p>
          
          <div className="flex justify-center gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold">Upload PDFs</h3>
              <p className="text-sm text-gray-500">Upload your documents</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold">Ask Questions</h3>
              <p className="text-sm text-gray-500">Chat in natural language</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold">Get Answers</h3>
              <p className="text-sm text-gray-500">AI-powered responses</p>
            </div>
          </div>
          
          <Link 
            href="/chat"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Chatting
          </Link>
        </div>
      </div>
    </div>
  )
}