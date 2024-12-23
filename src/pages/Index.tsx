import React, { useState } from 'react';
import FileUploadZone from '@/components/FileUploadZone';
import FileCard from '@/components/FileCard';
import ConversionProgress from '@/components/ConversionProgress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { convertFile, getPossibleConversions } from '@/utils/fileConversion';

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [possibleFormats, setPossibleFormats] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      const formats = await getPossibleConversions(newFiles[0]);
      setPossibleFormats(formats);
      setFiles((prev) => [...prev, ...newFiles]);
      toast({
        title: 'Files added',
        description: `Added ${newFiles.length} file(s) for conversion`,
      });
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    if (files.length <= 1) {
      setPossibleFormats([]);
      setTargetFormat('');
    }
  };

  const handleConvert = async () => {
    if (!targetFormat) {
      toast({
        title: 'Error',
        description: 'Please select a target format',
        variant: 'destructive',
      });
      return;
    }

    setConverting(true);
    setProgress({});

    try {
      await Promise.all(
        files.map(async (file) => {
          try {
            const converted = await convertFile(file, targetFormat, (progress) => {
              setProgress((prev) => ({
                ...prev,
                [file.name]: progress,
              }));
            });

            const url = URL.createObjectURL(converted);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${file.name.split('.')[0]}${targetFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
              title: 'Success',
              description: `Successfully converted ${file.name}`,
            });
          } catch (error) {
            toast({
              title: 'Error',
              description: `Failed to convert ${file.name}`,
              variant: 'destructive',
            });
          }
        })
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">File Converter Hub</h1>
            <p className="text-lg text-gray-600">
              Convert your files to any format, quickly and easily
            </p>
          </div>

          <FileUploadZone onFileSelect={handleFileSelect} />

          {files.length > 0 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {files.map((file) => (
                  <FileCard
                    key={file.name}
                    file={file}
                    onRemove={handleRemoveFile}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <Select
                  value={targetFormat}
                  onValueChange={setTargetFormat}
                  disabled={converting || possibleFormats.length === 0}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {possibleFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleConvert}
                  disabled={converting || files.length === 0 || !targetFormat}
                  className="flex-1"
                >
                  {converting ? 'Converting...' : 'Convert Files'}
                </Button>
              </div>

              {converting && (
                <div className="space-y-4">
                  {files.map((file) => (
                    <ConversionProgress
                      key={file.name}
                      fileName={file.name}
                      progress={progress[file.name] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;