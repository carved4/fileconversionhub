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

export const getPossibleConversions = (fileExtension: string): string[] => {
  // In a real app, this would be based on actual conversion capabilities
  const formatGroup = Object.entries(supportedFormats).find(([_, formats]) =>
    formats.includes(`.${fileExtension}`)
  );

  if (!formatGroup) return [];

  const [group] = formatGroup;
  return supportedFormats[group as keyof typeof supportedFormats].filter(
    (format) => format !== `.${fileExtension}`
  );
};

export const convertFile = async (
  file: File,
  targetFormat: string,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  // Simulate file conversion with progress
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // In a real app, this would be actual conversion logic
        resolve(file);
      }
    }, 200);
  });
};