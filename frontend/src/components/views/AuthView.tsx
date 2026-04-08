import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, AlertCircle, Sparkles, Heart, Globe, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSocialNetworkApiV1 } from '../../api/api-generated';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const AuthView = () => {
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const api = getSocialNetworkApiV1();

  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const res = await api.postApiAuthLogin({
          emailOrUsername: emailOrUsername.trim(),
          password,
        });
        if (!res.success || !res.data) {
          setError(res.message ?? 'Đăng nhập thất bại.');
          return;
        }
        setAuth(res.data.user!, res.data.token!);
      } else {
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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message ??
        'Có lỗi xảy ra, vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmailOrUsername('');
    setUsername('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* --- Theme Toggle Button --- */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-surface-container-low/50 backdrop-blur-md border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center cursor-pointer"
          aria-label="Toggle Theme"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      {/* --- Animated Ambient Background --- */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px]" 
        />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col items-center">
        
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <AtSign className="w-7 h-7 text-on-primary" />
          </div>
          <span className="text-3xl font-headline font-black tracking-tighter uppercase italic text-on-surface">Lumina</span>
        </motion.div>

        <div className="w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Slogan Text Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center lg:text-left hidden md:block"
          >
            <h1 className="text-5xl lg:text-6xl font-headline font-black text-on-surface leading-[1.1] mb-6">
              Life's More <br />
              <span className="text-primary underline decoration-primary/20 underline-offset-8">Fun</span> <br />
              Together.
            </h1>
            <p className="text-xl text-on-surface-variant font-medium max-w-md mx-auto lg:mx-0">
              Ready for your daily dose of laughs, stories, and cool people? You're in the right place!
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
              {[
                { icon: Sparkles, label: 'Inspire' },
                { icon: Heart, label: 'Connect' },
                { icon: Globe, label: 'Explore' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant/30 text-sm font-bold text-on-surface-variant">
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-[460px] bg-surface-container-lowest/70 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-black/5 rounded-[40px] overflow-hidden"
          >
            {/* Tab Header */}
            <div className="flex p-2 bg-surface-container-low/50">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 rounded-[28px] font-headline font-black text-sm transition-all ${isLogin ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                SIGN IN
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 rounded-[28px] font-headline font-black text-sm transition-all ${!isLogin ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                REGISTER
              </button>
            </div>

            <div className="p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {!isLogin && (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="relative group">
                          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
                          <input
                            required
                            type="text"
                            placeholder="Username"
                            className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 focus:border-primary/30 rounded-2xl outline-none transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            placeholder="Full Name (optional)"
                            className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 focus:border-primary/30 rounded-2xl outline-none transition-all"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        type={isLogin ? 'text' : 'email'}
                        placeholder={isLogin ? 'Email or Username' : 'Email Address'}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 focus:border-primary/30 rounded-2xl outline-none transition-all"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
                      <input
                        required
                        type="password"
                        placeholder="Password"
                        minLength={6}
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 focus:border-primary/30 rounded-2xl outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <div className="p-4 rounded-2xl bg-error/10 text-error text-sm font-medium border border-error/10 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl font-headline font-black text-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 shadow-xl shadow-primary/20"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-3 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Continue' : 'Create Account'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-outline-variant/30 text-center">
                <p className="text-sm text-on-surface-variant font-medium">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button onClick={handleToggle} className="text-primary font-black hover:underline underline-offset-4">
                    {isLogin ? 'Join Lumina' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer info */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-sm text-on-surface-variant/60 font-medium"
        >
          &copy; 2026 Lumina. All rights reserved.
        </motion.p>
      </div>
    </div>
  );
};

export default AuthView;
