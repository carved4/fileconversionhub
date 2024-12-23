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
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Free & Open Source File Converter
            </div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
              Transform Your Files with Ease
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Convert your files to any supported format instantly. No sign-up required, 
              completely free, and no advertisements.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <FileUploadZone onFileSelect={handleFileSelect} />

            {files.length > 0 && (
              <div className="mt-8 space-y-8">
                <div className="grid gap-4">
                  {files.map((file) => (
                    <FileCard
                      key={file.name}
                      file={file}
                      onRemove={handleRemoveFile}
                    />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Select
                    value={targetFormat}
                    onValueChange={setTargetFormat}
                    disabled={converting || possibleFormats.length === 0}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {possibleFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleConvert}
                    disabled={converting || files.length === 0 || !targetFormat}
                    className="w-full sm:flex-1 h-11 text-base font-medium"
                  >
                    {converting ? (
                      'Converting...'
                    ) : (
                      <>
                        Convert Files
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {converting && (
                  <div className="space-y-4 animate-fade-in">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
              <p className="text-gray-600">Your files are processed locally, never uploaded to any server.</p>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Convert files instantly with our optimized conversion engine.</p>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wide Format Support</h3>
              <p className="text-gray-600">Support for documents, images, audio, and video formats.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;