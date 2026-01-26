import React from 'react';

const SpecialCampaign: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Special Campaigns</h2>
                    <p className="text-slate-500 mt-1 font-medium">Create and manage exclusive offers for special occasions.</p>
                </div>
                <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                    <i className="fa-solid fa-plus"></i>
                    <span>New Campaign</span>
                </button>
            </div>

            {/* Occasion Types */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Birthday', icon: 'fa-cake-candles', color: 'bg-rose-50 text-rose-500', border: 'border-rose-100' },
                    { label: 'Anniversary', icon: 'fa-heart', color: 'bg-purple-50 text-purple-500', border: 'border-purple-100' },
                    { label: 'Local Events', icon: 'fa-map-location-dot', color: 'bg-orange-50 text-orange-500', border: 'border-orange-100' },
                    { label: 'Other', icon: 'fa-wand-magic-sparkles', color: 'bg-slate-50 text-slate-500', border: 'border-slate-100' },
                ].map((type, i) => (
                    <button key={i} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border ${type.border} bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all active:scale-95 group`}>
                        <div className={`w-14 h-14 ${type.color} rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-inner group-hover:scale-110 transition-transform`}>
                            <i className={`fa-solid ${type.icon}`}></i>
                        </div>
                        <span className="font-bold text-slate-700">{type.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between pt-4">
                <h3 className="text-xl font-black text-slate-800">Recent Campaigns</h3>
                <button className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">View Archive</button>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Valentine\'s Day Special', date: 'Feb 14, 2026', status: 'Active', color: 'red' },
                    { title: 'Ramadan Iftar Offer', date: 'March 10, 2026', status: 'Scheduled', color: 'emerald' },
                    { title: 'Eid Ultra Sale', date: 'April 12, 2026', status: 'Draft', color: 'slate' }
                ].map((campaign, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${campaign.color}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-${campaign.color}-50 text-${campaign.color}-500`}>
                                <i className="fa-solid fa-gift"></i>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-${campaign.color}-50 text-${campaign.color}-600 border border-${campaign.color}-100`}>
                                {campaign.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-red-500 transition-colors">{campaign.title}</h3>
                        <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                            <i className="fa-regular fa-calendar"></i>
                            {campaign.date}
                        </p>

                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((_, idx) => (
                                    <div key={idx} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-slate-400">12k+ Targeted</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State / Call to Action */}
        </div>
    );
};

export default SpecialCampaign;
