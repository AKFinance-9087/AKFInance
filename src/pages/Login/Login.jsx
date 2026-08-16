import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Temporary local credentials until backend authentication is connected.
    if (username === 'admin' && password === 'admin2026') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', 'admin');
      // Trigger a custom event so App.jsx or others can detect login immediately
      window.dispatchEvent(new Event('authChange'));
      navigate('/');
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Left Pane - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-blue-950/90 z-10" />
        
        {/* Content */}
        <div className="relative z-20 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-8">
              <img src={logoImg} alt="AK Finance Logo" className="h-32 w-auto object-contain bg-white rounded-2xl p-4 shadow-xl" />
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">AK Finance</h1>
            <p className="text-xl text-blue-100 font-light max-w-md mx-auto leading-relaxed">
              The complete solution for managing loans, customers, and daily collections with precision and ease.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Please sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full p-4 pl-12 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white transition-all shadow-sm"
                  placeholder="Enter your username"
                  required
                />
                <User className="absolute left-4 top-4 text-slate-400" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full p-4 pl-12 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button 
              type="submit"
              className="w-full btn-primary py-4 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Sign In
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="pt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Secure access for authorized personnel only.
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
