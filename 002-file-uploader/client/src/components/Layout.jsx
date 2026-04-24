import { UploadCloud, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = ({ children, onLogout, user }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground leading-none">
                  文件上传管理平台
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  安全、高效的文件管理系统
                </p>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      管理员
                    </span>
                  </div>
                </div>
                
                <div className="h-6 w-px bg-border" />
                
                <button
                  onClick={onLogout}
                  className={cn(
                    "btn btn-ghost h-9 px-3",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 文件上传管理平台. 保留所有权利.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-muted-foreground">
                版本 1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
