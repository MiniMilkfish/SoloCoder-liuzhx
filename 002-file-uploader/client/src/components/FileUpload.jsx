import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  File, 
  CheckCircle, 
  AlertTriangle, 
  Image, 
  FileText, 
  Archive,
  Video,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fileAPI } from '../services/api';
import { cn, formatFileSize, getFileIcon, isImage, isVideo } from '../lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FileUpload = ({ onUploadComplete }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    setError('');
    setRejectedFiles([]);

    if (fileRejections.length > 0) {
      const formattedRejections = fileRejections.map(({ file, errors }) => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        errors: errors.map(e => e.message),
      }));
      setRejectedFiles(formattedRejections);
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
      error: null,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    for (const fileItem of newFiles) {
      try {
        const data = await fileAPI.upload(fileItem.file, (progress) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, progress } : f
            )
          );
        });

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: 'completed', fileData: data.file }
              : f
          )
        );

        if (onUploadComplete) {
          onUploadComplete(data.file);
        }
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error',
                  error: err.response?.data?.error || '上传失败',
                }
              : f
          )
        );
      }
    }
  }, [onUploadComplete]);

  const removeFile = (id) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const removeRejectedFile = (id) => {
    setRejectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setUploadingFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  };

  const clearAllRejected = () => {
    setRejectedFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const getFileIconComponent = (filename) => {
    const iconType = getFileIcon(filename);
    switch (iconType) {
      case 'image':
        return <Image className="w-6 h-6 text-green-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-purple-500" />;
      case 'file-pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-yellow-500" />;
      default:
        return <File className="w-6 h-6 text-blue-500" />;
    }
  };

  const hasCompletedFiles = uploadingFiles.some((f) => f.status === 'completed');
  const hasUploadingFiles = uploadingFiles.some((f) => f.status === 'uploading');

  const getRejectionErrorMessage = (errors) => {
    if (errors.includes('File too large')) {
      return `文件大小超出限制 (最大: ${formatFileSize(MAX_FILE_SIZE)})`;
    }
    return errors.join(', ');
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-primary-500 bg-primary-50 scale-[1.01] shadow-lg'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div
            className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
              isDragActive ? 'bg-primary-100' : 'bg-gray-100'
            )}
          >
            <Upload
              className={cn(
                'w-10 h-10 transition-transform duration-300',
                isDragActive ? 'text-primary-600 scale-110' : 'text-gray-400'
              )}
            />
          </div>
          <div>
            <p className={cn('text-xl font-semibold', isDragActive ? 'text-primary-600' : 'text-gray-700')}>
              {isDragActive ? '释放文件以上传' : '拖拽文件到此处上传'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              或点击选择文件，支持批量上传
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-500">
                单个文件最大: <span className="font-medium text-gray-700">{formatFileSize(MAX_FILE_SIZE)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {rejectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-700">
                以下文件无法上传 ({rejectedFiles.length})
              </h3>
            </div>
            <button
              onClick={clearAllRejected}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              全部清除
            </button>
          </div>

          <div className="border-2 border-amber-200 rounded-xl overflow-hidden bg-amber-50">
            <div className="space-y-0 divide-y divide-amber-200">
              {rejectedFiles.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center space-x-4 p-4 hover:bg-amber-100/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      {getFileIconComponent(fileItem.name)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.name}
                      </p>
                      <button
                        onClick={() => removeRejectedFile(fileItem.id)}
                        className="p-1 hover:bg-amber-200 rounded-full transition-colors ml-2"
                      >
                        <X className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(fileItem.size)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {getRejectionErrorMessage(fileItem.errors)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              提示：请确保文件大小不超过 {formatFileSize(MAX_FILE_SIZE)}，文件格式支持图片、视频、文档、压缩包等常见格式。
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 font-medium">{error}</span>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">上传列表</h3>
              {hasUploadingFiles && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  上传中...
                </span>
              )}
            </div>
            {hasCompletedFiles && (
              <button
                onClick={clearCompleted}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                清除已完成
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadingFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className={cn(
                  'flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300',
                  fileItem.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : fileItem.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                )}
              >
                <div className="flex-shrink-0">
                  {isImage(fileItem.name) || isVideo(fileItem.name) ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {isImage(fileItem.name) ? (
                        <Image className="w-7 h-7 text-gray-400" />
                      ) : (
                        <Video className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                      {getFileIconComponent(fileItem.name)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {fileItem.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {fileItem.status === 'completed' && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">完成</span>
                        </div>
                      )}
                      {fileItem.status === 'error' && (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">失败</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          fileItem.status === 'uploading'
                            ? "hover:bg-gray-100"
                            : "hover:bg-gray-200"
                        )}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-1.5">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(fileItem.size)}
                    </span>
                    {fileItem.status === 'error' && (
                      <span className="text-xs text-red-500 font-medium">
                        {fileItem.error}
                      </span>
                    )}
                  </div>

                  {fileItem.status === 'uploading' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">上传进度</span>
                        <span className="text-xs font-semibold text-primary-600">
                          {fileItem.progress}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300 ease-out",
                            fileItem.progress === 100
                              ? "bg-green-500"
                              : "bg-gradient-to-r from-primary-500 to-blue-500"
                          )}
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
