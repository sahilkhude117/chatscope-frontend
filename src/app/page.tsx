'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleUploadSuccess = (message: string) => {
    setUploadStatus({ type: 'success', message });
    setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
  };

  const handleUploadError = (error: string) => {
    setUploadStatus({ type: 'error', message: error });
    setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PDF RAG Chatbot
        </h1>
        <p className="text-gray-600">
          Upload a PDF document and ask questions about its content
        </p>
      </div>

      <div className="space-y-6">
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        {uploadStatus.type && (
          <div
            className={`p-4 rounded-lg ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {uploadStatus.message}
          </div>
        )}

        <ChatInterface />
      </div>

      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>
          This chatbot uses RAG (Retrieval-Augmented Generation) to answer
          questions based on your uploaded PDF documents.
        </p>
      </div>
    </main>
  );
}