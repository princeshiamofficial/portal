import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../types.ts';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    qrCode?: string;
    isOpen?: boolean;
    onClose?: () => void;
    activeView?: any;
    setView?: any;
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, qrCode, isOpen, onClose, isCollapsed, toggleCollapse }) => {
    const [profileOpen, setProfileOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie', color: 'text-slate-500' },
        { path: '/customers', label: 'Customers', icon: 'fa-users', color: 'text-slate-500' },
        { path: '/templates', label: 'Templates', icon: 'fa-paste', color: 'text-slate-500' },
        { path: '/devices', label: 'Devices', icon: 'fa-link', color: 'text-slate-500' },
        { path: '/broadcast', label: 'Broadcast', icon: 'fa-message', color: 'text-slate-500' },
        { path: '/special-campaign', label: 'Special Campaign', icon: 'fa-star', color: 'text-slate-500' },
    ];

    if (user.role === 'superadmin') {
        navItems.push(
            { path: '/inbox', label: 'Inbox', icon: 'fa-inbox', color: 'text-slate-500' },
            { path: '/admin', label: 'Manage Users', icon: 'fa-users', color: 'text-slate-500' }
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                ></div>
            )}

            <aside
                className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-24' : 'w-72'} glass-sidebar flex flex-col p-4 z-[70] transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200/60 shadow-xl lg:shadow-none`}
            >
                {/* Brand Logo & Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'} mb-8 transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <i className="fa-solid fa-database text-white text-sm relative z-10"></i>
                        </div>
                        {!isCollapsed && (
                            <span className="text-xl font-black text-slate-800 tracking-tight animate-in fade-in slide-in-from-left-4 duration-500">
                                Food<span className="text-red-500">Mode</span>
                            </span>
                        )}
                    </div>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className={`hidden lg:flex w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-500 transition-all ${isCollapsed ? 'rotate-180' : ''}`}
                    >
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>

                    {/* Mobile Close */}
                    <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            title={isCollapsed ? item.label : ''}
                            className={({ isActive }) =>
                                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative z-10 flex items-center justify-center w-6 h-6">
                                        <i className={`fa-solid ${item.icon} text-lg transition-transform duration-300 ${!isActive ? `group-hover:scale-110 ${item.color}` : 'text-white'} ${isCollapsed ? 'text-xl' : 'text-base'}`}></i>
                                    </div>
                                    {!isCollapsed && <span className="ml-3 text-sm font-bold tracking-wide transition-all z-10">{item.label}</span>}

                                    {/* Active Indicator for Collapsed Mode */}
                                    {isCollapsed && isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></div>
                                    )}

                                    {/* Custom Tooltip for Collapsed Mode */}
                                    {isCollapsed && (
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                                            {item.label}
                                            {/* Arrow */}
                                            <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* QR Code Section - Hide when collapsed */}
                {!isCollapsed && (
                    <div className="mb-6 p-5 bg-gradient-to-b from-white to-slate-50 border border-slate-100 rounded-[2rem] shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Digital Identity</p>
                        <div className="aspect-square bg-white rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-inner group relative cursor-pointer overflow-hidden">
                            <img
                                src={qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=foodmode-profile'}
                                alt="My QR Code"
                                className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                                <i className="fa-solid fa-expand text-white text-xl"></i>
                                <span className="text-white text-xs font-bold">Expand</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Profile Dropdown */}
                <div className="mt-auto relative z-[60]">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className={`w-full ${isCollapsed ? 'p-2 justify-center' : 'p-3'} bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-md transition-all group duration-300`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="relative">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user.storeName}&background=fecaca&color=dc2626&bold=true`}
                                    className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} rounded-xl transition-all shadow-sm object-cover`}
                                    alt="User Avatar"
                                />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full"></div>
                            </div>

                            {!isCollapsed && (
                                <div className="overflow-hidden">
                                    <p className="text-sm font-black text-slate-800 truncate leading-tight">{user.storeName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Super Admin</p>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <i
                                className={`fa-solid fa-chevron-up text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`}
                            ></i>
                        )}
                    </button>

                    {/* Profile Dropdown Menu */}
                    {profileOpen && (
                        <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-4' : 'left-0 w-full mb-3'} bg-white border border-slate-100 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-bottom-2 duration-300 min-w-[240px]`}>
                            <div className="p-2">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100/50 mb-2 rounded-t-2xl">
                                    <p className="text-sm font-bold text-slate-800">{user.storeName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group text-left">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-user-gear text-xs"></i>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Profile Settings</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-2xl transition-all group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:rotate-12 transition-transform">
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
