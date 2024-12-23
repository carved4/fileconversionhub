import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import mammoth from 'mammoth';
import docx4js from 'docx4js';

export const supportedFormats = {
  document: ['.docx', '.odt', '.rtf', '.txt'],
  spreadsheet: ['.xls', '.xlsx', '.csv'],
  image: ['.jpeg', '.jpg', '.png', '.gif', '.heic'],
  audio: ['.wav', '.mp3'],
  video: ['.mp4', '.mov'],
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
};

export const getPossibleConversions = async (file: File): Promise<string[]> => {
  const extension = `.${getFileExtension(file.name)}`;
  const formatGroup = Object.entries(supportedFormats).find(([_, formats]) =>
    formats.includes(extension)
  );

  if (!formatGroup) return [];
  const [group] = formatGroup;
  return supportedFormats[group as keyof typeof supportedFormats].filter(
    (format) => format !== extension
  );
};

const convertDocument = async (file: File, targetFormat: string, compressionSettings: Record<string, any>): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  let result: ArrayBuffer | string;
  let html: string;
  
  try {
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    html = value;
    
    switch (targetFormat) {
      case '.docx':
        const docxDoc = new Document({
          sections: [{
            properties: {},
            children: html
              .split(/<\/?p>/)
              .filter(p => p.trim())
              .map(p => {
                const text = p.replace(/<[^>]*>/g, '').trim();
                return new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      size: 24,
                    }),
                  ],
                });
              }),
          }],
        });
        result = await Packer.toBuffer(docxDoc);
        return new Blob([result], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });

      case '.txt':
        result = html
          .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
          .replace(/<br\/?>/g, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        return new Blob([result], { type: 'text/plain' });

      case '.rtf':
        const rtfHeader = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\n';
        const rtfContent = html
          .replace(/<p>(.*?)<\/p>/g, '$1\\par\n')
          .replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, '{\\b $1}\\par\n')
          .replace(/<b>(.*?)<\/b>/g, '{\\b $1}')
          .replace(/<i>(.*?)<\/i>/g, '{\\i $1}')
          .replace(/<u>(.*?)<\/u>/g, '{\\ul $1}')
          .replace(/<br\/?>/g, '\\line\n')
          .replace(/[\\{}]/g, '\\$&');
        result = rtfHeader + rtfContent + '}';
        return new Blob([result], { type: 'application/rtf' });

      case '.odt':
        const odtContent = `<?xml version="1.0" encoding="UTF-8"?>
          <office:document-content 
            xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
            xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
            xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0">
            <office:automatic-styles/>
            <office:body>
              <office:text>
                ${html
                  .replace(/<p>(.*?)<\/p>/g, '<text:p>$1</text:p>')
                  .replace(/<b>(.*?)<\/b>/g, '<text:span text:style-name="bold">$1</text:span>')
                  .replace(/<i>(.*?)<\/i>/g, '<text:span text:style-name="italic">$1</text:span>')
                }
              </office:text>
            </office:body>
          </office:document-content>`;
        return new Blob([odtContent], { type: 'application/vnd.oasis.opendocument.text' });

      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  } catch (error) {
    console.error('Document conversion error:', error);
    throw new Error(`Failed to convert document to ${targetFormat}: ${error.message}`);
  }
};

const convertSpreadsheet = async (file: File, targetFormat: string, compressionSettings: Record<string, any>): Promise<Blob> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      throw new Error('No sheets found in the workbook');
    }

    if (targetFormat === '.csv') {
      // Enhanced CSV conversion with better handling of multiple sheets
      const sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        return XLSX.utils.sheet_to_csv(sheet, { 
          blankrows: false,
          dateNF: 'YYYY-MM-DD'
        });
      });
      return new Blob([sheets.join('\n\n')], { type: 'text/csv' });
    }

    // For Excel formats, preserve all sheets and formatting
    const buffer = XLSX.write(workbook, { 
      bookType: targetFormat === '.xls' ? 'biff8' : 'xlsx',
      type: 'array',
      bookSST: false,
      compression: compressionSettings.compression
    });
    
    const mimeType = targetFormat === '.xls' 
      ? 'application/vnd.ms-excel'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
    return new Blob([buffer], { type: mimeType });
  } catch (error) {
    console.error('Spreadsheet conversion error:', error);
    throw new Error(`Failed to convert spreadsheet to ${targetFormat}: ${error.message}`);
  }
};

const convertImage = async (file: File, targetFormat: string, compressionSettings: Record<string, any>): Promise<Blob> => {
  const extension = `.${getFileExtension(file.name)}`;
  
  if (extension === '.heic') {
    const ffmpeg = new FFmpeg();
    try {
      await ffmpeg.load({
        coreURL: '/ffmpeg-core.js',
        wasmURL: '/ffmpeg-core.wasm',
      });

      const fileData = await fetchFile(file);
      await ffmpeg.writeFile('input.heic', fileData);

      const outputFormat = targetFormat.replace('.', '');
      await ffmpeg.exec(['-i', 'input.heic', '-quality', '95', `output.${outputFormat}`]);
      
      const data = await ffmpeg.readFile(`output.${outputFormat}`);
      return new Blob([data], { type: `image/${outputFormat}` });
    } finally {
      await ffmpeg.terminate();
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      try {
        const maxSize = 4096;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const format = targetFormat.replace('.', '');
        const quality = compressionSettings.quality;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(new Error(`Image conversion failed: ${error.message}`));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const convertMedia = async (file: File, targetFormat: string, compressionSettings: Record<string, any>): Promise<Blob> => {
  const ffmpeg = new FFmpeg();
  
  try {
    // Load FFmpeg with proper configuration
    await ffmpeg.load({
      coreURL: '/ffmpeg-core.js',
      wasmURL: '/ffmpeg-core.wasm',
    });

    const inputFormat = file.name.split('.').pop()?.toLowerCase();
    const outputFormat = targetFormat.replace('.', '');
    
    // Write input file
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile('input.' + inputFormat, fileData);
    
    // Prepare FFmpeg command based on media type
    const isAudio = supportedFormats.audio.includes(targetFormat);
    const ffmpegArgs = isAudio
      ? ['-i', `input.${inputFormat}`, '-acodec', 'libmp3lame', '-q:a', '2', `output.${outputFormat}`]
      : ['-i', `input.${inputFormat}`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', `output.${outputFormat}`];
    
    // Apply compression settings
    if (compressionSettings.videoBitrate) {
      ffmpegArgs.splice(ffmpegArgs.indexOf('-c:v'), 0, '-b:v', compressionSettings.videoBitrate);
    }
    
    // Run conversion
    await ffmpeg.exec(ffmpegArgs);
    
    // Read output file
    const data = await ffmpeg.readFile(`output.${outputFormat}`);
    const mediaType = isAudio ? 'audio' : 'video';
    
    return new Blob([data], { type: `${mediaType}/${outputFormat}` });
  } catch (error) {
    console.error('Media conversion error:', error);
    throw new Error(`Failed to convert media to ${targetFormat}: ${error.message}`);
  } finally {
    try {
      await ffmpeg.terminate();
    } catch (error) {
      console.warn('Failed to terminate FFmpeg:', error);
    }
  }
};

const getCompressionSettings = (targetFormat: string, level: 'none' | 'low' | 'medium' | 'high') => {
  const settings: Record<string, any> = {
    quality: 1.0,
    compression: false,
  };

  switch (level) {
    case 'low':
      settings.quality = 0.9;
      settings.compression = true;
      break;
    case 'medium':
      settings.quality = 0.75;
      settings.compression = true;
      break;
    case 'high':
      settings.quality = 0.6;
      settings.compression = true;
      break;
  }

  // Format-specific adjustments
  if (targetFormat === '.jpg' || targetFormat === '.jpeg') {
    settings.quality = Math.max(0.5, settings.quality);
  } else if (targetFormat === '.mp4') {
    settings.videoBitrate = level === 'none' ? '4M' :
                           level === 'low' ? '2M' :
                           level === 'medium' ? '1M' : '800k';
  }

  return settings;
};

export const convertFile = async (
  file: File,
  targetFormat: string,
  onProgress: (progress: number) => void,
  compressionLevel: 'none' | 'low' | 'medium' | 'high' = 'none'
): Promise<Blob> => {
  const extension = `.${getFileExtension(file.name)}`;
  let result: Blob;

  try {
    onProgress(10);

    // Apply compression settings based on file type and compression level
    const compressionSettings = getCompressionSettings(targetFormat, compressionLevel);

    if (supportedFormats.document.includes(extension)) {
      result = await convertDocument(file, targetFormat, compressionSettings);
    } else if (supportedFormats.spreadsheet.includes(extension)) {
      result = await convertSpreadsheet(file, targetFormat, compressionSettings);
    } else if (supportedFormats.image.includes(extension)) {
      result = await convertImage(file, targetFormat, compressionSettings);
    } else if (supportedFormats.audio.includes(extension) || supportedFormats.video.includes(extension)) {
      result = await convertMedia(file, targetFormat, compressionSettings);
    } else {
      throw new Error('Unsupported conversion');
    }

    onProgress(100);
    return result;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
};