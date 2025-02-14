'use client';

import { useState } from 'react';
import { FiUpload, FiX, FiFile, FiTrash2 } from 'react-icons/fi';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File | null, instructions: string) => void;
}

export function AIGenerateModal({ isOpen, onClose, onSubmit }: AIGenerateModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('instructions', instructions);

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/upload`;

    try {
      console.log('Uploading to URL:', apiUrl);
      console.log('File name:', file.name);
      console.log('File type:', file.type);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.detail || 'Upload failed');
        } catch {
          throw new Error(`Upload failed: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Call the onSubmit callback with the file and instructions
      onSubmit(file, instructions);
      
      // Reset the form
      setFile(null);
      setInstructions('');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error instanceof Error ? error.message : 'An error occurred during upload');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload PDF and Provide AI Instructions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center space-x-2">
                <FiFile className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <FiUpload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center mb-2">
                  Drag & drop your PDF file here or click to upload
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Select File
                </label>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">Supported format: .pdf</p>
          
          <div className="space-y-2">
            <textarea
              placeholder="Enter your AI instructions here..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={500}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-xs text-gray-500 text-right">
              {instructions.length} / 500 characters
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !instructions.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
