import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  
  const iconMap = {
    pdf: 'file-pdf',
    doc: 'file-word',
    docx: 'file-word',
    xls: 'file-spreadsheet',
    xlsx: 'file-spreadsheet',
    ppt: 'file-presentation',
    pptx: 'file-presentation',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    mkv: 'video',
    mp3: 'audio',
    wav: 'audio',
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    txt: 'file-text',
    js: 'file-code',
    jsx: 'file-code',
    ts: 'file-code',
    tsx: 'file-code',
    html: 'file-code',
    css: 'file-code',
    json: 'file-code',
  };
  
  return iconMap[ext] || 'file';
}

export function isImage(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
}

export function isVideo(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext);
}

export function isPreviewable(filename) {
  return isImage(filename) || isVideo(filename);
}
