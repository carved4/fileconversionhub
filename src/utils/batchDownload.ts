import JSZip from 'jszip';

export const createBatchDownload = async (files: Blob[], filenames: string[]): Promise<Blob> => {
  const zip = new JSZip();
  
  // Add each file to the zip
  files.forEach((file, index) => {
    zip.file(filenames[index], file);
  });
  
  // Generate the zip file
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
};

export const downloadBatch = async (files: Blob[], filenames: string[]) => {
  if (files.length === 0) return;
  
  if (files.length === 1) {
    // Single file download
    const url = URL.createObjectURL(files[0]);
    const link = document.createElement('a');
    link.href = url;
    link.download = filenames[0];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Multiple files - create zip
    const zip = await createBatchDownload(files, filenames);
    const url = URL.createObjectURL(zip);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted_files.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
