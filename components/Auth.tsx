import React, { useState } from 'react';
import { User } from '../types.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { email, password } : { email, password, storeName };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setLoading(false);

      if (isLogin) {
        setMessage("Login successful! Redirecting...");
        // Save token and user details
        localStorage.setItem('fm_token', data.token);
        // We can also let App handle the user saving via onLogin
        onLogin(data.user);
      } else {
        setMessage("Registration successful! Please log in.");
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setLoading(false);
      setMessage(err.message || "Something went wrong. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#f8fafc] overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100 rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[150px] opacity-30 translate-y-1/3 -translate-x-1/4"></div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-center justify-center relative z-10">
        {/* Brand Section */}
        <div className="flex flex-col items-center lg:items-start lg:w-1/2 space-y-6 lg:space-y-8 lg:pr-12 text-center lg:text-left">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-12 h-12 bg-gradient-to-tr from-red-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200">
              <i className="fa-solid fa-database text-white text-xl"></i>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800">
              Food<span className="text-red-500">Mode</span> DB
            </h1>
          </div>

          <div className="relative group hidden md:block lg:block">
            <div className="animate-float">
              <div className="bg-white p-6 rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.08)] border border-white/50 max-w-sm relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
                <img
                  src="https://illustrations.popsy.co/pink/shaking-hands.svg"
                  alt="Customer Relations"
                  className="rounded-[2rem]"
                />
              </div>
            </div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-10 -right-20 w-56 h-56 bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-pulse delay-700"></div>
          </div>

          <div className="space-y-4 max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1]">
              Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Customer Data
              </span>
              , reimagined.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
              Power your business with automated engagegement, smart insights, and centralized CRM.
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-[500px] lg:w-[480px] bg-white/80 backdrop-blur-2xl p-8 md:p-12 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isLogin ? 'Security Access' : 'New Directory'}
              </span>

            </div>
            <h3 className="text-3xl font-bold text-slate-800">
              {isLogin ? 'Welcome Back' : 'Create Admin Account'}
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              {isLogin ? 'Log in to manage your customer records.' : 'Set up your master database account today.'}
            </p>

            {/* Status Messages */}
            {message && (
              <div
                className={`mt-4 p-3 rounded-xl text-sm font-medium transition-all ${message.toLowerCase().includes('successful')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {message}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">


            <div className="group relative">
              <label className="text-xs font-bold text-slate-600 mb-2 block ml-1">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@business.com"
                  required
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-300"
                />
                <i className="fa-solid fa-shield-halved absolute right-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              </div>
            </div>

            <div className="group relative">
              <div className="flex justify-between items-end mb-2 ml-1">
                <label className="text-xs font-bold text-slate-600">Secure Password</label>
                {isLogin && (
                  <a href="#" className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:underline">
                    Forgot?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : (isLogin ? 'Access Database' : 'Initialize Database')}</span>
              {!loading ? (
                <i className="fa-solid fa-server text-xs group-hover:scale-110 transition-transform"></i>
              ) : (
                <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
              )}
            </button>

            {/* Footer Section */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 px-4 text-slate-400 font-bold">Secure Auth</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all"
              >
                <i className="fa-brands fa-google text-slate-600"></i>
                <span className="text-xs font-bold text-slate-600">Google Auth</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all"
              >
                <i className="fa-brands fa-apple text-slate-600"></i>
                <span className="text-xs font-bold text-slate-600">Apple ID</span>
              </button>
            </div>
          </form>



          {/* Decorative Blobs */}
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-100 rounded-full blur-3xl opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
