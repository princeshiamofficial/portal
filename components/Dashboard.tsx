import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-red-500 mb-4">
                        <span className="h-1 w-10 bg-red-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Overview</p>
                    </div>
                    {/* Ad Slideshow */}
                    <div className="relative w-full h-48 md:h-96 lg:h-[28rem] rounded-3xl overflow-hidden shadow-xl mb-8 group">
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
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
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
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
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

                    <div className="flex flex-wrap gap-4 mt-10">
                        <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 text-sm">
                            <i className="fa-solid fa-plus"></i> New Campaign
                        </button>
                        <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3 text-sm">
                            <i className="fa-solid fa-file-export"></i> Sync Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Glass Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Database', value: '12.8k', sub: '+12% this week', icon: 'fa-users', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-100' },
                    { label: 'Active Sessions', value: '04', sub: 'All systems go', icon: 'fa-server', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-100' },
                    { label: 'Msgs Sent', value: '3.4k', sub: 'Daily Volume', icon: 'fa-paper-plane', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-100' },
                    { label: 'Engagement', value: '18%', sub: 'Click-through rate', icon: 'fa-chart-line', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-100' }
                ].map((stat, i) => (
                    <div key={i} className={`bg-white/60 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] border ${stat.border} shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all group cursor-pointer`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`fa-solid ${stat.icon}`}></i>
                            </div>
                            <i className="fa-solid fa-arrow-trend-up text-[10px] text-slate-300 group-hover:text-slate-400 transition-colors"></i>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-1">{stat.value}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <p className="text-[10px] font-medium text-slate-400/80">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800">Traffic Activity</h3>
                        <button className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-6">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                                    <i className="fa-solid fa-bell text-sm"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">Campaign Batch #0{i + 4} successfully sent</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">2 Hours Ago</p>
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Success</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Identity Section */}
                <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                    <h3 className="text-xl font-black mb-6 relative z-10 tracking-tight">System Status</h3>
                    <div className="space-y-6 relative z-10">
                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">API Synchronization</span>
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Optimal</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-4/5 h-full bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Session Uptime</span>
                                <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full">99.9%</span>
                            </div>
                            <div className="flex gap-1.5 items-end h-8">
                                {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-red-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
