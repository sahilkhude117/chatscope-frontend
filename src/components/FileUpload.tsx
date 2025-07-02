'use client';

import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onUploadSuccess: (message: string, fileName?: string) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      onUploadError('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setFiles([file]);

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

  const handleFileUpload = (uploadedFiles: File[]) => {
    if (uploadedFiles.length > 0) {
      handleFile(uploadedFiles[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        disabled={uploading}
        className="hidden"
      />
      
      <div
        className={`relative w-full h-full min-h-96 flex flex-col items-center justify-center p-8 cursor-pointer transition-colors ${
          dragActive
            ? 'bg-neutral-100 dark:bg-neutral-900'
            : uploading
            ? 'bg-neutral-50 dark:bg-neutral-950'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? openFileExplorer : undefined}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {uploading ? (
            <div className="w-12 h-12 border-4 border-neutral-300 dark:border-neutral-600 border-t-neutral-600 dark:border-t-neutral-300 rounded-full animate-spin" />
          ) : (
            <svg
              className="w-12 h-12 text-neutral-400 dark:text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}

          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {uploading
                ? 'Processing your PDF...'
                : dragActive
                ? 'Drop your PDF here'
                : 'Upload your PDF document'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {uploading
                ? 'Please wait while we process your document'
                : 'Drag and drop your PDF file here, or click to browse'}
            </p>
          </div>

          {uploading && (
            <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-sm">Analyzing document...</span>
            </div>
          )}

          {files.length > 0 && !uploading && (
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                Selected: {files[0].name}
              </p>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center space-y-2">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Supported format: PDF • Max file size: 10MB
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-neutral-400 dark:text-neutral-500">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure upload</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>AI-powered processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo component to show usage
export function FileUploadDemo() {
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleUploadSuccess = (message: string, fileName?: string) => {
    setUploadMessage(`Success: ${message} ${fileName ? `(${fileName})` : ''}`);
    setError('');
    console.log('Upload successful:', message, fileName);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setUploadMessage('');
    console.error('Upload error:', errorMessage);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <FileUpload
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      
      {uploadMessage && (
        <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          {uploadMessage}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}