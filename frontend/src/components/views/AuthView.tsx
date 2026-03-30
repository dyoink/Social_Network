import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, AlertCircle } from 'lucide-react';
import { getSocialNetworkApiV1 } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';

// AuthView không nhận props — trực tiếp ghi vào authStore sau khi đăng nhập
const AuthView = () => {
  const { setAuth } = useAuthStore();
  const api = getSocialNetworkApiV1();

  const [isLogin, setIsLogin] = useState(true);
  // Dùng chung cho cả login (email/username) và register (email)
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Error message hiển thị dưới form
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- Đăng nhập ---
        const res = await api.postApiAuthLogin({
          emailOrUsername: emailOrUsername.trim(),
          password,
        });
        // res đã là ApiResponseOfAuthResponseDto (mutator unwrap data)
        if (!res.success || !res.data) {
          setError(res.message ?? 'Đăng nhập thất bại.');
          return;
        }
        setAuth(res.data.user!, res.data.token!);
      } else {
        // --- Đăng ký ---
        if (!username.trim()) {
          setError('Vui lòng nhập username.');
          return;
        }
        const res = await api.postApiAuthRegister({
          username: username.trim(),
          email: emailOrUsername.trim(),
          password,
          fullName: fullName.trim() || undefined,
        });
        if (!res.success || !res.data) {
          setError(res.message ?? 'Đăng ký thất bại.');
          return;
        }
        setAuth(res.data.user!, res.data.token!);
      }
    } catch (err: unknown) {
      // Axios ném lỗi khi status >= 400; lấy message từ response body
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ??
        'Có lỗi xảy ra, vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Reset form khi chuyển tab login ↔ register */
  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmailOrUsername('');
    setUsername('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <AtSign className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-on-surface-variant">
            {isLogin ? 'Enter your details to access your account' : 'Join our creative community today'}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-xl shadow-primary/5 border border-outline-variant/10">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Register only: Username */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                  <input
                    required
                    type="text"
                    placeholder="yourhandle"
                    autoComplete="username"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-xl outline-none transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Register only: Full Name (optional) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">
                  Full Name <span className="font-normal text-outline">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-xl outline-none transition-all"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email (register) hoặc Email/Username (login) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">
                {isLogin ? 'Email or Username' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  required
                  type={isLogin ? 'text' : 'email'}
                  placeholder={isLogin ? 'name@example.com or username' : 'name@example.com'}
                  autoComplete={isLogin ? 'username' : 'email'}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-xl outline-none transition-all"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-surface-container-lowest rounded-xl outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-error/10 text-error text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-headline font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-70 shadow-lg shadow-primary/20 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-on-surface-variant font-medium">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={handleToggle}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthView;
