import React from 'react';

interface ConversionProgressProps {
  progress: number;
  fileName: string;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm border animate-fade-in">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">{fileName}</span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ConversionProgress;