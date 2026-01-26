
import React, { useState } from 'react';
import { View, User } from '../types.ts';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, user, onLogout }) => {
  const [showDisabledModal, setShowDisabledModal] = useState(user.status === 'disabled');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans relative selection:bg-red-500/20">
      {/* Global Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-100/40 rounded-full blur-[120px] mix-blend-multiply opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-orange-100/40 rounded-full blur-[80px] mix-blend-multiply opacity-50"></div>
      </div>
      <Sidebar
        user={user}
        onLogout={onLogout}
        activeView={activeView} // This prop might not be needed if using NavLink but kept for compatibility if needed
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300`}>
        {/* Mobile Floating Header - Eye Catching */}
        <header className="lg:hidden fixed top-4 left-4 right-4 z-[50] bg-white/70 backdrop-blur-xl border border-white/40 px-6 py-4 rounded-[2.2rem] flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-red-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <i className="fa-solid fa-database text-white text-xs"></i>
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">Food<span className="text-red-500">Mode</span></span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-white hover:text-red-500 transition-all active:scale-95 border border-slate-100/50"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </header>

        {/* Main Content Area - With Entry Animations */}
        <main className="flex-1 overflow-y-auto relative p-6 pt-28 md:p-8 lg:p-12 lg:pt-12 custom-scrollbar lg:pb-12">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {children}
          </div>
        </main>
      </div>

      {/* Account Disabled Modal - Premium Design */}
      {showDisabledModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
              <i className="fa-solid fa-user-slash text-5xl"></i>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Account Disabled</h3>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed px-2">
              Your access to <span className="text-slate-900 font-bold">FoodMode</span> has been suspended. Please contact our support team.
            </p>
            <button
              onClick={onLogout}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
