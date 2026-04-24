import { useState } from 'react';
import { Lock, User, AlertCircle, Loader2, UploadCloud } from 'lucide-react';
import { authAPI } from '../services/api';
import { cn } from '../lib/utils';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            文件上传管理平台
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            请登录以访问您的文件
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-xl">登录账户</h3>
            <p className="card-description">
              输入您的凭据以继续
            </p>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input pl-10"
                    placeholder="请输入用户名"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "btn btn-primary w-full h-10",
                  loading && "opacity-75 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>登录中...</span>
                  </div>
                ) : (
                  '登录'
                )}
              </button>
            </form>
          </div>
          <div className="card-footer">
            <div className="w-full text-center">
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                <span className="font-medium">提示：</span>
                <span className="ml-1.5">默认账号 admin / admin123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            登录即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
