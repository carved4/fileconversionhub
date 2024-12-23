import React from 'react';
import { FileIcon, X } from 'lucide-react';

interface FileCardProps {
  file: File;
  onRemove: (file: File) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove }) => {
  return (
    <div className="relative p-4 bg-white rounded-lg shadow-sm border group animate-fade-in">
      <button
        onClick={() => onRemove(file)}
        className="absolute top-2 right-2 p-1 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center space-x-3">
        <FileIcon className="w-8 h-8 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileCard;