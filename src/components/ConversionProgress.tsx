import React from 'react';
import { FileIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversionProgressProps {
  fileName: string;
  progress: number;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({
  fileName,
  progress,
}) => {
  const isComplete = progress === 100;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className={cn(
          "p-2 rounded-lg",
          isComplete ? "bg-green-50" : "bg-primary/10"
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <FileIcon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          <div className="mt-1 relative">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  isComplete ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="absolute right-0 top-2 text-xs font-medium text-gray-500">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionProgress;