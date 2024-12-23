import { convertFile } from './fileConversion';
import { downloadBatch } from './batchDownload';

interface QueueItem {
  file: File;
  targetFormat: string;
  onProgress: (progress: number) => void;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  resolve: (value: Blob) => void;
  reject: (reason: any) => void;
}

class ConversionQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrent = 2; // Reduced to prevent FFmpeg memory issues
  private activeConversions = 0;
  private batchResults: { blob: Blob; filename: string }[] = [];

  public async add(item: QueueItem): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...item,
        resolve,
        reject,
        onProgress: (progress: number) => {
          item.onProgress(progress);
          if (progress === 100) {
            this.activeConversions--;
            this.processQueue();
          }
        },
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.activeConversions >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeConversions < this.maxConcurrent) {
        const item = this.queue.shift();
        if (!item) continue;

        this.activeConversions++;
        
        try {
          const result = await convertFile(
            item.file,
            item.targetFormat,
            item.onProgress,
            item.compressionLevel
          );
          
          // Store the result for batch download
          this.batchResults.push({
            blob: result,
            filename: `${item.file.name.split('.')[0]}${item.targetFormat}`
          });
          
          // Resolve the promise with the converted blob
          item.resolve(result);
        } catch (error) {
          console.error('Conversion error:', error);
          item.onProgress(0);
          item.reject(error);
          this.activeConversions--;
        }
      }

      // If all conversions are complete, trigger batch download
      if (this.activeConversions === 0 && this.queue.length === 0 && this.batchResults.length > 0) {
        const blobs = this.batchResults.map(r => r.blob);
        const filenames = this.batchResults.map(r => r.filename);
        
        if (blobs.length === 1) {
          // Single file - download directly
          const url = URL.createObjectURL(blobs[0]);
          const link = document.createElement('a');
          link.href = url;
          link.download = filenames[0];
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Multiple files - create zip
          await downloadBatch(blobs, filenames);
        }
        
        // Clear batch results after download
        this.batchResults = [];
      }
    } finally {
      this.processing = false;
    }
  }

  public clear() {
    this.queue = [];
    this.batchResults = [];
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveConversions(): number {
    return this.activeConversions;
  }
}

export const conversionQueue = new ConversionQueue();
