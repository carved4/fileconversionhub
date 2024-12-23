import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph } from 'docx';
import sharp from 'sharp';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { fileTypeFromBlob } from 'file-type';

export const supportedFormats = {
  document: ['.doc', '.docx', '.odt', '.rtf', '.txt'],
  spreadsheet: ['.xls', '.xlsx', '.csv'],
  image: ['.jpeg', '.jpg', '.png', '.gif', '.heic'],
  audio: ['.wav', '.mp3'],
  video: ['.mp4', '.mov'],
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
};

export const getPossibleConversions = async (file: File): Promise<string[]> => {
  const fileType = await fileTypeFromBlob(file);
  if (!fileType) return [];

  const extension = `.${fileType.ext}`;
  const formatGroup = Object.entries(supportedFormats).find(([_, formats]) =>
    formats.includes(extension)
  );

  if (!formatGroup) return [];
  const [group] = formatGroup;
  return supportedFormats[group as keyof typeof supportedFormats].filter(
    (format) => format !== extension
  );
};

const convertDocument = async (file: File, targetFormat: string): Promise<Blob> => {
  const text = await file.text();
  
  if (targetFormat === '.txt') {
    return new Blob([text], { type: 'text/plain' });
  }

  // Convert to DOCX
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: text,
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};

const convertSpreadsheet = async (file: File, targetFormat: string): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);

  if (targetFormat === '.csv') {
    const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const convertImage = async (file: File, targetFormat: string): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const image = sharp(Buffer.from(arrayBuffer));

  const format = targetFormat.replace('.', '') as 'jpeg' | 'png' | 'gif';
  const buffer = await image[format]().toBuffer();
  
  return new Blob([buffer], { type: `image/${format}` });
};

const convertMedia = async (file: File, targetFormat: string): Promise<Blob> => {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  const arrayBuffer = await file.arrayBuffer();
  ffmpeg.FS('writeFile', 'input', new Uint8Array(arrayBuffer));

  const outputFormat = targetFormat.replace('.', '');
  await ffmpeg.run('-i', 'input', `output.${outputFormat}`);
  
  const data = ffmpeg.FS('readFile', `output.${outputFormat}`);
  return new Blob([data.buffer], { type: `audio/${outputFormat}` });
};

export const convertFile = async (
  file: File,
  targetFormat: string,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  const fileType = await fileTypeFromBlob(file);
  if (!fileType) throw new Error('Unsupported file type');

  const extension = `.${fileType.ext}`;
  let result: Blob;

  try {
    onProgress(10);

    if (supportedFormats.document.includes(extension)) {
      result = await convertDocument(file, targetFormat);
    } else if (supportedFormats.spreadsheet.includes(extension)) {
      result = await convertSpreadsheet(file, targetFormat);
    } else if (supportedFormats.image.includes(extension)) {
      result = await convertImage(file, targetFormat);
    } else if (supportedFormats.audio.includes(extension) || supportedFormats.video.includes(extension)) {
      result = await convertMedia(file, targetFormat);
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