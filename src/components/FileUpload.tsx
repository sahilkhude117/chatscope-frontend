'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onUploadSuccess: (message: string, fileName?: string) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      onUploadError('Please upload a PDF file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data.message, file.name);
      } else {
        onUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      onUploadError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const openFileExplorer = () => {
    inputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />
      
      <motion.div
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-green-400 bg-green-400/5 scale-105'
            : uploading
            ? 'border-gray-600 bg-gray-900/50'
            : 'border-gray-700 bg-gray-900/30 hover:border-green-400/50 hover:bg-green-400/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? openFileExplorer : undefined}
        whileHover={!uploading ? { scale: 1.02 } : {}}
        whileTap={!uploading ? { scale: 0.98 } : {}}
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 to-emerald-600/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <motion.div
            animate={uploading ? { rotate: 360 } : { rotate: 0 }}
            transition={uploading ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              uploading 
                ? 'bg-green-400/20 border-2 border-green-400/30' 
                : 'bg-gradient-to-br from-green-400 to-emerald-600'
            }`}
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-white">
              {uploading ? 'Processing your PDF...' : dragActive ? 'Drop your PDF here' : 'Upload your PDF document'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {uploading 
                ? 'Please wait while we process your document'
                : 'Drag and drop your PDF file here, or click to browse'
              }
            </p>
          </div>

          {!uploading && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-medium rounded-xl hover:from-green-500 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-green-400/25"
            >
              Choose File
            </motion.button>
          )}

          {uploading && (
            <div className="flex items-center space-x-2 text-green-400">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span className="text-sm">Analyzing document...</span>
            </div>
          )}
        </div>

        {/* Animated border effect */}
        {dragActive && (
          <motion.div
            className="absolute inset-0 border-2 border-green-400 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(34, 197, 94, 0.1) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 2s ease infinite',
            }}
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 text-center space-y-2"
      >
        <p className="text-sm text-gray-500">
          Supported format: PDF • Max file size: 10MB
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure upload</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AI-powered processing</span>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </motion.div>
  );
}