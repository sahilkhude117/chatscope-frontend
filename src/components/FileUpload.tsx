'use client';

import React, { useState } from 'react';
// This is the UI component you'll import from Aceternity UI
import { FileUpload } from "@/components/ui/file-upload"; 
import { AnimatePresence, motion } from 'framer-motion';

// Renamed props interface
interface FileUploaderProps {
  onUploadSuccess: (message: string, fileName?: string) => void;
  onUploadError: (error: string) => void;
}

/**
 * A handler component that wraps the Aceternity UI FileUpload.
 * It contains the logic for processing and uploading the file to your API.
 */
export function FileUploader({ onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFilename, setUploadingFilename] = useState<string | null>(null);

  // Your original file handling logic is preserved here
  const processAndUploadFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      onUploadError('Invalid file type. Please upload a PDF.');
      return;
    }

    setIsUploading(true);
    setUploadingFilename(file.name);

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
        onUploadError(data.error || 'An unknown error occurred during upload.');
      }
    } catch (error) {
      onUploadError('A network error occurred. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadingFilename(null);
    }
  };

  /**
   * This function is passed to the Aceternity UI component.
   * It receives the selected files and triggers the upload process.
   */
  const handleFileSelection = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      processAndUploadFile(selectedFiles[0]);
    }
  };

  return (
    <div className="relative w-full">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-black/80 backdrop-blur-sm"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-600 border-t-green-500" />
            <h3 className="mt-4 text-white">Analyzing Document...</h3>
            <p className="text-sm text-neutral-400">{uploadingFilename}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aceternity UI Component */}
      <FileUpload onChange={handleFileSelection} />
    </div>
  );
}