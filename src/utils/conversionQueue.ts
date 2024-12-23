import { convertFile } from './fileConversion';

interface QueueItem {
  file: File;
  targetFormat: string;
  onProgress: (progress: number) => void;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

class ConversionQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrent = 3;
  private activeConversions = 0;

  public async add(item: QueueItem): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        ...item,
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
        
        // Create and trigger download
        const url = URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${item.file.name.split('.')[0]}${item.targetFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Conversion error:', error);
        item.onProgress(0);
        this.activeConversions--;
      }
    }

    this.processing = false;
  }

  public clear() {
    this.queue = [];
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveConversions(): number {
    return this.activeConversions;
  }
}

export const conversionQueue = new ConversionQueue();
