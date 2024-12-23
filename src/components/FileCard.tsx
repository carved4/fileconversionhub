import React, { useState, useEffect } from 'react';
import { FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getPreviewUrl } from '@/utils/fileConversion';

interface FileCardProps {
  file: File;
  onRemove: (file: File) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compressionLevel, setCompressionLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const url = await getPreviewUrl(file);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Error loading preview:', error);
        setPreviewUrl('/file-icon.png');
      }
    };
    loadPreview();
  }, [file]);

  return (
    <div className="relative flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {previewUrl && (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover object-center"
          />
        )}
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
      <button
        onClick={() => onRemove(file)}
        className="absolute top-3 right-3 p-2 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all duration-300 transform hover:scale-110"
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Select
            value={compressionLevel}
            onValueChange={(value: 'none' | 'low' | 'medium' | 'high') => setCompressionLevel(value)}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Compression" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Compression</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FileCard;