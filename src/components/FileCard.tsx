import React from 'react';
import { FileIcon, X } from 'lucide-react';

interface FileCardProps {
  file: File;
  onRemove: (file: File) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove }) => {
  return (
    <div className="relative p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 group hover:shadow-xl transition-all duration-300 animate-fade-in">
      <button
        onClick={() => onRemove(file)}
        className="absolute top-3 right-3 p-2 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all duration-300 transform hover:scale-110"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FileIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate mb-1">
            {file.name}
          </p>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {file.type || `${file.name.split('.').pop()?.toUpperCase()} File`}
            </span>
            <span className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCard;