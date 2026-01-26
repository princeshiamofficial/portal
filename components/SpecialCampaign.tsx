import React, { useState } from 'react';
import { Template, SpecialCampaignSettings, Customer } from '../types.ts';

interface SpecialCampaignProps {
    templates: Template[];
    settings: SpecialCampaignSettings;
    onUpdateSettings: (settings: SpecialCampaignSettings) => void;
    customers: Customer[];
    onRunManual: (templateId: number, customerIds: number[]) => void;
}

const SpecialCampaign: React.FC<SpecialCampaignProps> = ({
    templates,
    settings,
    onUpdateSettings,
    customers,
    onRunManual
}) => {
    const [showSelector, setShowSelector] = useState<'birthday' | 'anniversary' | null>(null);

    const handleSelectTemplate = (templateId: number) => {
        if (showSelector === 'birthday') {
            onUpdateSettings({ ...settings, birthdayTemplateId: templateId });
        } else if (showSelector === 'anniversary') {
            onUpdateSettings({ ...settings, anniversaryTemplateId: templateId });
        }
        setShowSelector(null);
    };

    const toggleCampaign = (type: 'birthday' | 'anniversary') => {
        if (type === 'birthday') {
            onUpdateSettings({ ...settings, birthdayActive: !settings.birthdayActive });
        } else {
            onUpdateSettings({ ...settings, anniversaryActive: !settings.anniversaryActive });
        }
    };

    const getTemplateTitle = (id: number | null) => {
        if (!id) return 'Not Selected';
        return templates.find(t => t.id === id)?.title || 'Unknown Template';
    };

    const getTodayCelebrants = (type: 'birthday' | 'anniversary') => {
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return customers.filter(c => {
            if (type === 'birthday') return c.dob.includes(todayStr);
            if (type === 'anniversary') return c.anniversaryDate?.includes(todayStr);
            return false;
        });
    };

    const birthdayCelebrants = getTodayCelebrants('birthday');
    const anniversaryCelebrants = getTodayCelebrants('anniversary');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <span className="h-1 w-8 bg-red-500 rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Automated Outreach</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Special Campaigns</h2>
                    <p className="text-slate-500 mt-2 font-medium">Configure automatic messaging for customer celebrations.</p>
                </div>
            </div>

            {/* Campaign Configuration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {/* Birthday Campaign */}
                <div className={`relative p-8 rounded-[3rem] border transition-all duration-500 ${settings.birthdayActive ? 'bg-white border-rose-100 shadow-xl shadow-rose-500/5' : 'bg-slate-50 border-slate-200 opacity-80 shadow-none'}`}>
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl ${settings.birthdayActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-200 text-slate-400'}`}>
                            <i className="fa-solid fa-cake-candles"></i>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${settings.birthdayActive ? 'text-rose-500' : 'text-slate-400'}`}>
                                {settings.birthdayActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => toggleCampaign('birthday')}
                                className={`w-14 h-7 rounded-full transition-all relative p-1 ${settings.birthdayActive ? 'bg-rose-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${settings.birthdayActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 mb-2">Birthday Campaign</h3>
                    <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Send a warm greeting and special offer to customers on their special day.</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-message text-slate-400"></i>
                                <span className="text-sm font-bold text-slate-600">Template</span>
                            </div>
                            <span className={`text-sm font-black ${settings.birthdayTemplateId ? 'text-rose-500' : 'text-slate-400'}`}>
                                {getTemplateTitle(settings.birthdayTemplateId)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-users text-slate-400"></i>
                                <span className="text-sm font-bold text-slate-600">Today's Celebrants</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">{birthdayCelebrants.length} Customers</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSelector('birthday')}
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${settings.birthdayActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50'}`}
                        disabled={!settings.birthdayActive && !!settings.birthdayTemplateId}
                    >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                        <span>{settings.birthdayTemplateId ? 'Change Template' : 'Select Template'}</span>
                    </button>
                    {!settings.birthdayTemplateId && settings.birthdayActive && (
                        <p className="text-[10px] text-rose-500 font-bold mt-3 text-center animate-pulse">⚠️ Please select a template to start auto-run</p>
                    )}
                </div>

                {/* Anniversary Campaign */}
                <div className={`relative p-8 rounded-[3rem] border transition-all duration-500 ${settings.anniversaryActive ? 'bg-white border-purple-100 shadow-xl shadow-purple-500/5' : 'bg-slate-50 border-slate-200 opacity-80 shadow-none'}`}>
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl ${settings.anniversaryActive ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-slate-200 text-slate-400'}`}>
                            <i className="fa-solid fa-heart"></i>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${settings.anniversaryActive ? 'text-purple-500' : 'text-slate-400'}`}>
                                {settings.anniversaryActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => toggleCampaign('anniversary')}
                                className={`w-14 h-7 rounded-full transition-all relative p-1 ${settings.anniversaryActive ? 'bg-purple-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${settings.anniversaryActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 mb-2">Anniversary Campaign</h3>
                    <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Celebrate customer milestones with a heartfelt message and reward.</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-message text-slate-400"></i>
                                <span className="text-sm font-bold text-slate-600">Template</span>
                            </div>
                            <span className={`text-sm font-black ${settings.anniversaryTemplateId ? 'text-purple-500' : 'text-slate-400'}`}>
                                {getTemplateTitle(settings.anniversaryTemplateId)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-users text-slate-400"></i>
                                <span className="text-sm font-bold text-slate-600">Today's Celebrants</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">{anniversaryCelebrants.length} Customers</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSelector('anniversary')}
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${settings.anniversaryActive ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-50'}`}
                        disabled={!settings.anniversaryActive && !!settings.anniversaryTemplateId}
                    >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                        <span>{settings.anniversaryTemplateId ? 'Change Template' : 'Select Template'}</span>
                    </button>
                    {!settings.anniversaryTemplateId && settings.anniversaryActive && (
                        <p className="text-[10px] text-purple-500 font-bold mt-3 text-center animate-pulse">⚠️ Please select a template to start auto-run</p>
                    )}
                </div>
            </div>

            {/* Template Selector Modal */}
            {showSelector && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSelector(null)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight capitalize">Select {showSelector} Template</h4>
                                <p className="text-slate-500 text-sm font-medium mt-1">Choose which message format to use for this campaign.</p>
                            </div>
                            <button
                                onClick={() => setShowSelector(null)}
                                className="w-12 h-12 rounded-full bg-white text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            {templates.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <i className="fa-solid fa-box-open text-4xl mb-4 opacity-20"></i>
                                    <p className="font-bold">No templates found. Go to Templates to create one.</p>
                                </div>
                            ) : (
                                templates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleSelectTemplate(template.id)}
                                        className="w-full text-left p-6 rounded-[2rem] border border-slate-100 hover:border-red-500 hover:bg-red-50/30 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{template.type}</span>
                                            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:translate-x-1 group-hover:text-red-500 transition-all"></i>
                                        </div>
                                        <h5 className="text-lg font-bold text-slate-800 mb-1">{template.title}</h5>
                                        <p className="text-slate-500 text-sm line-clamp-2">{template.content}</p>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                            <button
                                onClick={() => setShowSelector(null)}
                                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Logic Feedback */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800">Auto-Campaign Status</h3>
                    <div className="flex items-center gap-2">
                        {(settings.birthdayActive || settings.anniversaryActive) ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-600">System Monitoring</span>
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400"></span>
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">System Idle</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-center justify-center text-center py-16">
                    {(settings.birthdayActive || settings.anniversaryActive) ? (
                        <>
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center text-3xl mb-6">
                                <i className="fa-solid fa-shield-check"></i>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">System is Watching</h4>
                            <p className="text-slate-500 max-w-md mx-auto">When your WhatsApp is connected, the system will automatically scan for celebrations and send your active templates.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center text-3xl mb-6">
                                <i className="fa-solid fa-moon"></i>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Automation Paused</h4>
                            <p className="text-slate-500 max-w-md mx-auto">Toggle any campaign to "Active" to start automatic customer outreach.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpecialCampaign;
