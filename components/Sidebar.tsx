import React, { useState, useEffect, useRef } from 'react';
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
    const [shouldHideQR, setShouldHideQR] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);



    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie', color: 'text-slate-600', hoverColor: 'text-slate-900' },
        { path: '/customers', label: 'Customers', icon: 'fa-users', color: 'text-slate-500', hoverColor: 'text-blue-500' },
        { path: '/templates', label: 'Templates', icon: 'fa-paste', color: 'text-slate-500', hoverColor: 'text-red-500' },
        { path: '/devices', label: 'Devices', icon: 'fa-link', color: 'text-slate-500', hoverColor: 'text-amber-500' },
        { path: '/broadcast', label: 'Broadcast', icon: 'fa-message', color: 'text-slate-500', hoverColor: 'text-emerald-500' },
        { path: '/special-campaign', label: user.role?.toLowerCase().includes('admin') ? 'Schedule Campaign' : 'Special Campaign', icon: 'fa-star', color: 'text-slate-500', hoverColor: 'text-yellow-500' },
    ];



    useEffect(() => {
        if (isCollapsed) return;

        const checkSpace = () => {
            // Estimate heights to avoid layout thrashing/flickering
            // Logo (~100px) + Nav Items (~50px each) + QR Section (~260px) + Profile (~100px)
            const itemHeight = 52;
            const staticHeights = 120 + 100; // Logo + Profile
            const qrHeight = 280;
            const totalNavHeight = navItems.length * itemHeight;
            const availableHeight = window.innerHeight;

            setShouldHideQR(staticHeights + totalNavHeight + qrHeight > availableHeight);
        };

        window.addEventListener('resize', checkSpace);
        checkSpace();

        return () => window.removeEventListener('resize', checkSpace);
    }, [isCollapsed, navItems.length]);

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
                className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-24' : 'w-64'} glass-sidebar flex flex-col p-6 z-[70] transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200 shadow-xl lg:shadow-none bg-white`}
            >
                {/* Brand Logo & Toggle */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'} mb-10 transition-all duration-300`}>
                    <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'flex-1 overflow-hidden'}`}>
                        {user.logo ? (
                            <img
                                src={user.logo}
                                alt="Logo"
                                className={`${isCollapsed ? 'w-8 h-8 rounded-lg shadow-md bg-white' : 'max-h-16 w-auto max-w-full'} object-contain transition-all duration-300`}
                            />
                        ) : (
                            <img
                                src="https://colorhutbd.com/uploads/1771158033705-971599892.png"
                                alt="Color Hut"
                                className={`${isCollapsed ? 'w-8 h-8 rounded-lg shadow-md bg-white' : 'max-h-14 w-auto max-w-full'} object-contain transition-all duration-300`}
                            />
                        )}
                    </div>


                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className={`hidden lg:flex w-6 h-6 rounded-md bg-slate-50 hover:bg-slate-100 items-center justify-center text-slate-400 hover:text-slate-600 transition-all ${isCollapsed ? 'rotate-180' : ''}`}
                    >
                        <i className="fa-solid fa-chevron-left text-[10px]"></i>
                    </button>

                    {/* Mobile Close */}
                    <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav ref={navRef} className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            title={isCollapsed ? item.label : ''}
                            className={({ isActive }) =>
                                `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300 group relative ${isActive
                                    ? 'bg-slate-100 text-slate-800 font-bold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative z-10 flex items-center justify-center w-5 h-5">
                                        <i className={`fa-solid ${item.icon} text-sm transition-colors duration-300 ${isActive ? '' : `group-hover:${item.hoverColor.replace('text-', '')}`} ${isCollapsed ? 'text-lg' : 'text-sm'}`}></i>
                                    </div>
                                    {!isCollapsed && <span className="ml-3 text-sm tracking-wide transition-all z-10">{item.label}</span>}

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

                {/* QR Code Section - Only show for regular users/store owners */}
                {!isCollapsed && !shouldHideQR && user.role?.toLowerCase() === 'user' && (
                    <div className="mb-6 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">Store Identity</p>
                        <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-dashed border-slate-200 group relative cursor-pointer overflow-hidden">
                            <img
                                src={qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/vip?member=${user.memberId || '000000'}`)}`}
                                alt="Store QR Code"
                                className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                                <i className="fa-solid fa-expand text-white text-xl"></i>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-3 text-center leading-tight">
                            Scan to join the <br /> <b>VIP Member Program</b>
                        </p>
                    </div>
                )}

                {/* User Profile Dropdown */}
                <div className="mt-auto relative z-[60]">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className={`w-full ${isCollapsed ? 'p-2 justify-center' : 'p-4'} bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group duration-300`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="relative">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user?.storeName || 'Color Hut'}&background=0F172A&color=fff&bold=true`}
                                    className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} rounded-xl transition-all shadow-sm object-cover flex-shrink-0`}
                                    alt="User Avatar"
                                />
                            </div>

                            {!isCollapsed && (
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.storeName || 'Color Hut'}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-0.5">Active Session</p>
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
                        <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-4' : 'left-0 w-full mb-3'} bg-white border border-slate-100 rounded-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-bottom-2 duration-300 min-w-[240px]`}>
                            <div className="p-2">
                                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</div>
                                <NavLink
                                    to="/settings"
                                    onClick={() => setProfileOpen(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-transform">
                                        <i className="fa-solid fa-user-gear text-xs"></i>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Profile Settings</span>
                                </NavLink>
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-2xl transition-all group text-left mt-1"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500 group-hover:rotate-12 transition-transform">
                                        <i className="fa-solid fa-right-from-bracket text-xs"></i>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
};

export default Sidebar;
