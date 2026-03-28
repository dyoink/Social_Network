import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';

interface AuthViewProps {
  onLogin: (userData: any) => void;
}

const AuthView = ({ onLogin }: AuthViewProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onLogin({
        id: 'user-1',
        name: isLogin ? 'Alex Thompson' : name,
        email: email,
        avatar: 'https://picsum.photos/seed/alex/200/200',
        cover: 'https://picsum.photos/seed/cover/1200/400',
        bio: 'Digital artist and explorer of the unknown.',
        role: 'Professional',
        followers: '12.5k',
        following: '842',
        posts: '128'
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Chrome className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-on-surface-variant">
            {isLogin ? 'Enter your details to access your account' : 'Join our creative community today'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary/5 border border-outline-variant/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-white rounded-xl outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-white rounded-xl outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-on-surface-variant">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs font-bold text-primary hover:underline">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-transparent focus:border-primary/30 focus:bg-white rounded-xl outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-outline">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors font-bold text-sm">
              <Chrome className="w-5 h-5" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-colors font-bold text-sm">
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-on-surface-variant font-medium">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
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
