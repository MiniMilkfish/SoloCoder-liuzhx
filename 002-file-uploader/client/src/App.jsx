import { useState, useEffect, useCallback } from 'react';
import { Upload, FolderOpen, Loader2, RefreshCw } from 'lucide-react';
import Login from './components/Login';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import { fileAPI } from './services/api';
import { cn } from './lib/utils';

function App() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fileAPI.getAll();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'files') {
      fetchFiles();
    }
  }, [user, activeTab, fetchFiles]);

  const handleLogin = (userData, token) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setFiles([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleUploadComplete = (fileData) => {
    setFiles((prev) => [
      {
        filename: fileData.filename,
        size: fileData.size,
        uploadDate: fileData.uploadDate,
      },
      ...prev,
    ]);
  };

  const handleFileDelete = (filename) => {
    setFiles((prev) => prev.filter((f) => f.filename !== filename));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    {
      id: 'upload',
      label: '上传文件',
      icon: Upload,
    },
    {
      id: 'files',
      label: '文件列表',
      icon: FolderOpen,
      badge: files.length > 0 ? files.length : null,
    },
  ];

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="border-b border-border">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative inline-flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium",
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    上传新文件
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    支持拖拽上传，单个文件最大 10MB
                  </p>
                </div>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      已上传文件
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      共 {files.length} 个文件
                    </p>
                  </div>
                  <button
                    onClick={fetchFiles}
                    disabled={loading}
                    className={cn(
                      "btn btn-outline h-9 px-4",
                      loading && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    <span>{loading ? '刷新中...' : '刷新'}</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-muted-foreground">加载文件列表...</p>
                    </div>
                  </div>
                ) : (
                  <FileList
                    files={files}
                    onFileDelete={handleFileDelete}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
