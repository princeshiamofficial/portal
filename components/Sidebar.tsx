import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types.ts';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    qrCode?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, qrCode, isOpen, onClose }) => {
    const [profileOpen, setProfileOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie', color: 'text-slate-500' },
        { path: '/customers', label: 'Customers', icon: 'fa-users', color: 'text-blue-500' },
        { path: '/templates', label: 'Templates', icon: 'fa-paste', color: 'text-red-500' },
        { path: '/devices', label: 'Devices', icon: 'fa-link', color: 'text-amber-500' },
        { path: '/broadcast', label: 'Broadcast', icon: 'fa-message', color: 'text-emerald-500' },
        { path: '/special-campaign', label: 'Special Campaign', icon: 'fa-star', color: 'text-purple-500' },
    ];

    if (user.role === 'superadmin') {
        navItems.push(
            { path: '/inbox', label: 'Inbox', icon: 'fa-inbox', color: 'text-indigo-500' },
            { path: '/admin', label: 'Manage Users', icon: 'fa-users', color: 'text-slate-500' }
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            <aside className={`fixed inset-y-0 left-0 w-64 glass-sidebar flex flex-col p-6 z-[70] transition-transform duration-300 transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Logo & Close Button */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-red-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
                            <i className="fa-solid fa-database text-white text-xs"></i>
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">
                            Food<span className="text-red-500">Mode</span>
                        </span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-slate-100 text-slate-800 font-bold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <i className={`fa-solid ${item.icon} text-sm transition-colors ${!isActive ? `group-hover:${item.color}` : ''}`}></i>
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* QR Code Section */}
                <div className="mb-6 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Digital Identity</p>
                    <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-dashed border-slate-200 group relative cursor-pointer overflow-hidden">
                        <img
                            src={qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=foodmode-profile'}
                            alt="My QR Code"
                            className="w-full h-full object-contain rounded-xl transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <i className="fa-solid fa-expand text-white"></i>
                        </div>
                    </div>
                </div>

                {/* User Profile Dropdown */}
                <div className="mt-auto relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-white hover:border-slate-200 transition-all group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.storeName}&background=0F172A&color=fff`}
                                className="w-10 h-10 rounded-xl shadow-sm flex-shrink-0"
                                alt="User Avatar"
                            />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate">{user.storeName}</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Active Session</p>
                            </div>
                        </div>
                        <i
                            className={`fa-solid fa-chevron-up text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                        ></i>
                    </button>

                    {/* Profile Dropdown Menu */}
                    {profileOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-3 bg-white border border-slate-100 rounded-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-[80] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                            <div className="p-2">
                                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</div>
                                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group text-left">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-slate-900">
                                        <i className="fa-solid fa-user-gear text-xs"></i>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Profile Settings</span>
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-2xl transition-all group text-left mt-1"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                                        <i className="fa-solid fa-right-from-bracket text-xs"></i>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
