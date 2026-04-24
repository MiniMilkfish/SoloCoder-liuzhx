import { useState } from 'react';
import { 
  File, 
  Image, 
  FileText, 
  Archive, 
  Trash2, 
  Download, 
  Eye, 
  X,
  AlertCircle,
  Loader2,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Folder
} from 'lucide-react';
import { fileAPI } from '../services/api';
import { cn, formatFileSize, formatDate, getFileIcon, isImage, isVideo, isPreviewable } from '../lib/utils';

const FileList = ({ files, onFileDelete, onFileUpdate }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [error, setError] = useState('');
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
  });

  const handleDelete = async (filename) => {
    setError('');
    setDeletingId(filename);

    try {
      await fileAPI.delete(filename);
      if (onFileDelete) {
        onFileDelete(filename);
      }
    } catch (err) {
      setError(err.response?.data?.error || '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

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

  const handlePreview = (file) => {
    setPreviewFile(file);
    setVideoState({
      isPlaying: false,
      isMuted: false,
      currentTime: 0,
      duration: 0,
    });
  };

  const closePreview = () => {
    setPreviewFile(null);
    setVideoState({
      isPlaying: false,
      isMuted: false,
      currentTime: 0,
      duration: 0,
    });
  };

  const handleDownload = (filename) => {
    const url = fileAPI.getFileUrl(filename);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePlay = () => {
    setVideoState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const toggleMute = () => {
    setVideoState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <Folder className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无文件</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          切换到「上传文件」标签页，拖拽或点击选择文件开始上传
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 font-medium">{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {files.map((file) => (
          <div
            key={file.filename}
            className="flex items-center space-x-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex-shrink-0">
              {isImage(file.filename) ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center relative group-hover:ring-2 group-hover:ring-primary-200 transition-all">
                  <img
                    src={fileAPI.getFileUrl(file.filename)}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                    }}
                  />
                  {isPreviewable(file.filename) && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ) : isVideo(file.filename) ? (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center relative group-hover:ring-2 group-hover:ring-primary-200 transition-all overflow-hidden">
                  <Video className="w-8 h-8 text-gray-400" />
                  {isPreviewable(file.filename) && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center group-hover:ring-2 group-hover:ring-gray-200 transition-all">
                  {getFileIconComponent(file.filename)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {file.filename}
              </p>
              <div className="flex items-center space-x-4 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(file.uploadDate)}
                </span>
                {isVideo(file.filename) && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    <Video className="w-3 h-3 mr-1" />
                    视频
                  </span>
                )}
                {isImage(file.filename) && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    <Image className="w-3 h-3 mr-1" />
                    图片
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {isPreviewable(file.filename) && (
                <button
                  onClick={() => handlePreview(file)}
                  className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all group-hover:scale-105"
                  title="预览"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => handleDownload(file.filename)}
                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all group-hover:scale-105"
                title="下载"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleDelete(file.filename)}
                disabled={deletingId === file.filename}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  deletingId === file.filename
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-red-600 hover:bg-red-50 group-hover:scale-105"
                )}
                title="删除"
              >
                {deletingId === file.filename ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePreview();
            }
          }}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
            >
              <span className="text-sm">关闭</span>
              <X className="w-6 h-6" />
            </button>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isImage(previewFile.filename) ? "bg-green-100" : "bg-purple-100"
                  )}>
                    {isImage(previewFile.filename) ? (
                      <Image className="w-5 h-5 text-green-600" />
                    ) : (
                      <Video className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                      {previewFile.filename}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatFileSize(previewFile.size)} · {formatDate(previewFile.uploadDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownload(previewFile.filename)}
                    className="btn btn-secondary px-4 py-2 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </button>
                  <button
                    onClick={closePreview}
                    className="btn btn-primary px-5 py-2 rounded-xl"
                  >
                    关闭
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4 relative group">
                {isImage(previewFile.filename) ? (
                  <div className="relative max-h-[60vh]">
                    <img
                      src={fileAPI.getFileUrl(previewFile.filename)}
                      alt={previewFile.filename}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : isVideo(previewFile.filename) ? (
                  <div className="relative w-full max-w-4xl">
                    <video
                      id="preview-video"
                      src={fileAPI.getFileUrl(previewFile.filename)}
                      className="w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                      controls
                      autoPlay
                      muted={videoState.isMuted}
                      onTimeUpdate={(e) => {
                        setVideoState((prev) => ({
                          ...prev,
                          currentTime: e.target.currentTime,
                        }));
                      }}
                      onLoadedMetadata={(e) => {
                        setVideoState((prev) => ({
                          ...prev,
                          duration: e.target.duration,
                        }));
                      }}
                      onPlay={() => setVideoState((prev) => ({ ...prev, isPlaying: true }))}
                      onPause={() => setVideoState((prev) => ({ ...prev, isPlaying: false }))}
                    />
                    
                    <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={togglePlay}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            {videoState.isPlaying ? (
                              <Pause className="w-5 h-5 text-white" />
                            ) : (
                              <Play className="w-5 h-5 text-white" />
                            )}
                          </button>
                          
                          <span className="text-white text-xs">
                            {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={toggleMute}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            {videoState.isMuted ? (
                              <VolumeX className="w-5 h-5 text-white" />
                            ) : (
                              <Volume2 className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">该文件类型不支持预览</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {isImage(previewFile.filename) && (
                    <>
                      <Image className="w-4 h-4" />
                      <span>图片预览</span>
                    </>
                  )}
                  {isVideo(previewFile.filename) && (
                    <>
                      <Video className="w-4 h-4" />
                      <span>视频预览</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  按 ESC 键关闭预览
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
