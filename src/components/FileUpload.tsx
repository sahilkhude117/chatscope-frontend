'use client';

import { useState } from 'react';

interface FileUploadProps {
  onUploadSuccess: (message: string) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const BACKEND_URL = process.env.BACKEND_URL;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data.message);
      } else {
        onUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      onUploadError('Network error during upload');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
          uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Processing...' : 'Upload PDF'}
      </label>
      <p className="mt-2 text-sm text-gray-500">
        Upload a PDF document to start chatting
      </p>
    </div>
  );
}