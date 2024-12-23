import fs from 'fs';
import path from 'path';

const ffmpegPath = path.resolve('./node_modules/@ffmpeg/core/dist/esm');
const publicPath = path.resolve('./public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
}

// Copy FFmpeg core files
const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];
files.forEach(file => {
  const sourcePath = path.join(ffmpegPath, file);
  const destPath = path.join(publicPath, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} successfully!`);
  } else {
    console.error(`Source file not found: ${sourcePath}`);
  }
});

console.log('FFmpeg core files copy process completed!'); 