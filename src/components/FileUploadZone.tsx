import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (files: File[]) => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer overflow-hidden transition-all duration-300",
        "border-2 border-dashed rounded-xl",
        "flex flex-col items-center justify-center text-center",
        "min-h-[200px] p-8",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-12 h-12 rounded-full",
              isDragActive ? "bg-primary/20" : "bg-gray-100"
            )} />
          </div>
          <Upload 
            className={cn(
              "w-6 h-6 relative z-10 mx-auto",
              isDragActive ? "text-primary animate-bounce" : "text-gray-600"
            )} 
          />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop your files here' : 'Drag & drop your files here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse from your computer
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
          {Object.values({
            Documents: ['.txt', '.docx', '.pdf'],
            Images: ['.jpg', '.png', '.gif', '.img', '.jpeg', '.heic'],
            Audio: ['.mp3', '.wav'],
            Video: ['.mp4', '.mov'],
          }).map((formats, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
            >
              {formats.join(', ')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;