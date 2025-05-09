'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ExpenseUploadProps {
  onUpload: (file: File) => void;
}

export default function ExpenseUpload({ onUpload }: ExpenseUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 ${
        isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
      }`}
    >
      <input {...getInputProps()} />
      <svg
        className={`h-12 w-12 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`}
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M24 14v6m0 0v6m0-6h6m-6 0h-6"
        />
      </svg>
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop your receipt here, or click to browse
      </p>
      <p className="mt-1 text-xs text-gray-500">PNG, JPG, or PDF up to 10MB</p>
    </div>
  );
}
