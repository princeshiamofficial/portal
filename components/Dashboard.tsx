import React from 'react';
import { User } from '../types';

interface DashboardProps {
    user?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const isAdmin = user?.role?.toLowerCase().includes('admin');
    const [stats, setStats] = React.useState({
        totalCustomers: 0,
        messagesSent: 0,
        connectionStatus: 'disconnected',
        recentActivity: [] as any[],
        totalUsers: 0
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('fm_token');
            if (!token) return;
            try {
                const res = await fetch('/api/dashboard/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }

                if (isAdmin) {
                    const resAdmin = await fetch('/api/admin/stats', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (resAdmin.ok) {
                        const adminData = await resAdmin.json();
                        setStats(prev => ({
                            ...prev,
                            totalUsers: adminData.totalUsers,
                            totalCustomers: adminData.totalCustomers,
                            messagesSent: adminData.totalBroadcasts
                        }));
                    }
                }
            } catch (e) { console.error("Failed to fetch dashboard stats", e); }
        };
        fetchStats();
    }, [isAdmin]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                    {!isAdmin && (
                        <div className="hidden flex items-center gap-3 text-red-500 p-8 md:p-12 pb-6">
                            <span className="h-1 w-10 bg-red-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Overview</p>
                        </div>
                    )}
                    {/* Ad Slideshow - Hidden for Admins */}
                    {!isAdmin && (
                        <div className="relative w-full h-64 md:h-96 lg:h-[28rem] mt-4 overflow-hidden group">
                            {(() => {
                                const [currentSlide, setCurrentSlide] = React.useState(0);
                                const slides = [
                                    {
                                        type: 'video',
                                        url: 'https://v.ftcdn.net/05/65/52/63/700_F_565526365_d8Xo5vF8n0s0GqV4xV4xV4xV4xV4xV4x.mp4', // Mock video URL
                                        poster: 'https://img.freepik.com/free-photo/diverse-friends-students-shoot-video-blog-vlog_1163-4043.jpg',
                                        title: 'Boost Engagement',
                                        cta: 'Watch Demo'
                                    },
                                    {
                                        type: 'image',
                                        url: 'https://img.freepik.com/free-vector/gradient-crm-illustration_23-2149379183.jpg',
                                        title: 'Pro Analytics',
                                        cta: 'Upgrade Now'
                                    },
                                    {
                                        type: 'image',
                                        url: 'https://img.freepik.com/free-photo/digital-marketing-with-icons-business-people_53876-94833.jpg',
                                        title: 'Automate Everything',
                                        cta: 'Learn More'
                                    }
                                ];

                                React.useEffect(() => {
                                    const interval = setInterval(() => {
                                        setCurrentSlide((prev) => (prev + 1) % slides.length);
                                    }, 5000);
                                    return () => clearInterval(interval);
                                }, [slides.length]);

                                return (
                                    <>
                                        {slides.map((slide, index) => (
                                            <div
                                                key={index}
                                                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                            >
                                                {slide.type === 'video' ? (
                                                    <video
                                                        className="w-full h-full object-cover"
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                        poster={slide.poster}
                                                    >
                                                        <source src={slide.url} type="video/mp4" />
                                                    </video>
                                                ) : (
                                                    <img
                                                        src={slide.url}
                                                        alt={slide.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}

                                                {/* Overlay Content */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                                                    <div className="transform translate-y-0 transition-transform duration-500">
                                                        <span className="bg-red-500/90 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block">
                                                            Sponsored
                                                        </span>
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-2xl font-black text-white tracking-tight">{slide.title}</h3>
                                                            <button className="bg-white text-slate-900 px-5 py-2 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg">
                                                                {slide.cta}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Indicators */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                                            {slides.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid - Glass Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {(isAdmin ? [
                    { label: 'Total Users', value: stats.totalUsers, sub: 'System Accounts', icon: 'fa-user-shield', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-100' },
                    { label: 'Total Customers', value: stats.totalCustomers, sub: 'Global Records', icon: 'fa-users', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-100' },
                    { label: 'Msgs Sent', value: stats.messagesSent, sub: 'System Wide', icon: 'fa-paper-plane', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-100' },
                    { label: 'Active Sessions', value: stats.connectionStatus === 'connected' ? 'Active' : 'Offline', sub: 'System Status', icon: 'fa-server', color: stats.connectionStatus === 'connected' ? 'text-emerald-500' : 'text-red-500', bg: stats.connectionStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-red-500/10', border: 'border-emerald-100' }
                ] : [
                    { label: 'Total Customers', value: stats.totalCustomers, sub: 'Total Records', icon: 'fa-users', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-100' },
                    { label: 'Active Sessions', value: stats.connectionStatus === 'connected' ? 'Active' : 'Offline', sub: 'System Status', icon: 'fa-server', color: stats.connectionStatus === 'connected' ? 'text-emerald-500' : 'text-red-500', bg: stats.connectionStatus === 'connected' ? 'bg-emerald-500/10' : 'bg-red-500/10', border: 'border-emerald-100' },
                    { label: 'Msgs Sent', value: stats.messagesSent, sub: 'All Time', icon: 'fa-paper-plane', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-100' },
                    { label: 'Engagement', value: 'N/A', sub: 'Coming Soon', icon: 'fa-chart-line', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-100' }
                ]).map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`w-14 h-14 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                            <i className={`fa-solid ${stat.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800">Recent Activity</h3>
                        {/* <button className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">View All</button> */}
                    </div>
                    <div className="space-y-6">
                        {stats.recentActivity.length > 0 ? stats.recentActivity.map((log, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                    <i className={`fa-solid ${log.type === 'System' ? 'fa-cake-candles' : 'fa-bullhorn'} text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">{log.type} Message sent to {log.recipient}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Sent</div>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-sm font-medium">No recent activity.</p>
                        )}
                    </div>
                </div>

                {/* System Status Dashboard (From User Request) */}
                <div className="lg:col-span-4 bg-[#111827] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border border-white/5 flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                    <h3 className="text-xl font-black mb-6 relative z-10 tracking-tight">System Status</h3>

                    <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
                        <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">API Synchronization</span>
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">Optimal</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[85%] h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Session Uptime</span>
                                <span className="text-[10px] font-black text-white bg-white/10 px-2.5 py-1 rounded-full">99.9%</span>
                            </div>
                            <div className="flex gap-1.5 items-end h-16">
                                {[15, 25, 18, 40, 30, 35, 28, 45, 32, 38].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-red-500/80 rounded-t-sm hover:bg-red-400 transition-all duration-300"
                                        style={{ height: `${h * 2}%` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between opacity-40">
                        <span className="text-[9px] font-bold uppercase tracking-widest">Instance Ready</span>
                        <i className="fa-solid fa-check-double text-[10px]"></i>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
