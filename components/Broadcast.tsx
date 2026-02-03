import React, { useState, useMemo } from 'react';
import { Template, WhatsAppSession, BroadcastContact, BroadcastStats, User } from '../types.ts';

interface BroadcastProps {
    templates: Template[];
    contacts: BroadcastContact[];
    wa: WhatsAppSession;
    stats: BroadcastStats;
    onStart: (templateId: number) => void;
    onImportCSV: (file: File) => void;
    sending: boolean;
    user?: User | null;
    systemUsers?: any[];
    broadcastTarget: 'Customers' | 'Users';
    setBroadcastTarget: (t: 'Customers' | 'Users') => void;
    broadcastDesignation: string;
    setBroadcastDesignation: (d: string) => void;
}

const Broadcast: React.FC<BroadcastProps> = ({
    templates, contacts, wa, stats, onStart, onImportCSV, sending, user,
    systemUsers, broadcastTarget, setBroadcastTarget,
    broadcastDesignation, setBroadcastDesignation
}) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [templateSearch, setTemplateSearch] = useState('');
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
    const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [currentFilter, setCurrentFilter] = useState<'All' | 'Pending' | 'Success'>('All');
    const [showFinishedPopup, setShowFinishedPopup] = useState(false);
    const [lastSendingState, setLastSendingState] = useState(false);

    // Watch for campaign completion
    React.useEffect(() => {
        if (lastSendingState === true && sending === false && contacts.length > 0) {
            setShowFinishedPopup(true);
        }
        setLastSendingState(sending);
    }, [sending, lastSendingState, contacts.length]);

    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(templateSearch.toLowerCase())
    );

    const filteredContacts = useMemo(() => {
        if (currentFilter === 'All') return contacts;
        if (currentFilter === 'Pending') return contacts.filter(c => c.status === 'Pending');
        if (currentFilter === 'Success') return contacts.filter(c => c.status === 'Sent');
        return contacts;
    }, [contacts, currentFilter]);

    const successRate = useMemo(() => {
        const sent = contacts.filter(c => c.status === 'Sent').length;
        const failed = contacts.filter(c => c.status === 'Failed').length;
        if (sent + failed === 0) return '-';
        return Math.round((sent / (sent + failed)) * 100) + '%';
    }, [contacts]);

    const limitUsage = useMemo(() => {
        const limit = 5000;
        const usage = (stats.totalSentToday / limit) * 100;
        return usage.toFixed(usage % 1 === 0 ? 0 : 1);
    }, [stats.totalSentToday]);

    const formatPreview = (content: string) => {
        if (!content) return '';
        return content
            .replace(/\[name\]|\{name\}/g, 'John Doe')
            .replace(/\[business\]|\{business\}/g, 'Merchant Store');
    };

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <div className="flex-1">
            {/* Campaign Header */}
            <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                        <span className="hover:text-red-500 cursor-pointer">Console</span>
                        <i className="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
                        <span className="text-red-500">Automated Broadcast</span>
                    </nav>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Campaign Builder</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                    <input
                        type="file"
                        id="csvImport"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files && onImportCSV(e.target.files[0])}
                    />
                    <button
                        onClick={() => document.getElementById('csvImport')?.click()}
                        className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-sm"
                    >
                        <i className="fa-solid fa-file-csv text-emerald-500"></i>
                        <span>Import CSV</span>
                    </button>
                    <button
                        onClick={() => selectedTemplateId && onStart(selectedTemplateId)}
                        disabled={sending || !selectedTemplateId || wa.status !== 'connected'}
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-2xl shadow-slate-900/10 transition-all disabled:opacity-50 text-sm"
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                        <span>{sending ? 'Sending...' : 'Launch Campaign'}</span>
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold mb-1">Total Recipients</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{contacts.length.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        <i className="fa-solid fa-chart-pie"></i>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold mb-1">Daily Limit</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">5,000</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold mb-1">Safety Buffer</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">3-7s</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        <i className="fa-solid fa-bullseye"></i>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold mb-1">Success Rate</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{successRate}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Strategy Column */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="card-premium p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                                <i className="fa-solid fa-gear text-sm"></i>
                            </div>
                            <h3 className="font-bold text-slate-800">Campaign Strategy</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Outbound Device</label>
                                {wa.status === 'connected' ? (
                                    <div className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
                                        <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                            <i className="fa-brands fa-whatsapp"></i>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-slate-700 truncate">{wa.user?.name || 'Account Name'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{wa.user?.id ? '+' + wa.user.id.split(':')[0] : ''}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full px-5 py-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between group hover:bg-red-100 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-100 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-white transition-all">
                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                            </div>
                                            <span className="text-sm font-bold text-red-600">No Device Connected</span>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-[10px] text-red-500"></i>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Template Choice</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 flex items-center justify-between hover:bg-white hover:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                                    >
                                        <span>{selectedTemplate ? selectedTemplate.title : 'Select template...'}</span>
                                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`}></i>
                                    </button>

                                    {showTemplateDropdown && (
                                        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-2xl overflow-hidden max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-slate-50 bg-white/80 sticky top-0">
                                                <div className="relative">
                                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                                                    <input
                                                        type="text"
                                                        value={templateSearch}
                                                        onChange={(e) => setTemplateSearch(e.target.value)}
                                                        placeholder="Search templates..."
                                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-slate-100 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                                {filteredTemplates.map((template) => (
                                                    <div
                                                        key={template.id}
                                                        onClick={() => {
                                                            setSelectedTemplateId(template.id);
                                                            setShowTemplateDropdown(false);
                                                            setTemplateSearch('');
                                                        }}
                                                        className="px-5 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${template.type === 'System' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-500'}`}>
                                                                <i className={template.type === 'System' ? 'fa-solid fa-cube' : 'fa-solid fa-pen-nib'}></i>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{template.title}</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{template.type}</p>
                                                            </div>
                                                        </div>
                                                        {selectedTemplateId === template.id && (
                                                            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200">
                                                                <i className="fa-solid fa-check text-[10px]"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Target Business Role</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 flex items-center justify-between hover:bg-white hover:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                                            >
                                                <span>{broadcastDesignation}</span>
                                                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`}></i>
                                            </button>

                                            {showRoleDropdown && (
                                                <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {[
                                                        { label: 'All', value: 'All', icon: 'fa-globe' },
                                                        { label: 'Owner', value: 'Owner', icon: 'fa-crown' },
                                                        { label: 'Manager', value: 'Manager', icon: 'fa-briefcase' },
                                                        { label: 'Chief', value: 'Chief', icon: 'fa-user-tie' },
                                                        { label: 'Others', value: 'Others', icon: 'fa-ellipsis' }
                                                    ].map((role) => (
                                                        <div
                                                            key={role.value}
                                                            onClick={() => {
                                                                setBroadcastDesignation(role.value);
                                                                setShowRoleDropdown(false);
                                                            }}
                                                            className="px-5 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${broadcastDesignation === role.value ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                                                                    <i className={`fa-solid ${role.icon}`}></i>
                                                                </div>
                                                                <p className={`text-sm font-bold ${broadcastDesignation === role.value ? 'text-red-500' : 'text-slate-800'}`}>{role.label}</p>
                                                            </div>
                                                            {broadcastDesignation === role.value && (
                                                                <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                                                                    <i className="fa-solid fa-check text-[8px]"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                                        <div className="flex gap-3">
                                            <i className="fa-solid fa-lightbulb text-amber-500 mt-0.5 text-xs"></i>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Personalization Tags</p>
                                                <p className="text-[10px] text-amber-700/70 font-bold leading-relaxed">
                                                    Use <span className="text-amber-700 font-black">[name]</span> for the merchant's name and <span className="text-amber-700 font-black">[business]</span> for their store name.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="card-premium p-6 md:p-8 bg-slate-100/50 border-dashed">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp Preview</h3>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0"></div>
                                <div className="whatsapp-bubble max-w-[85%]">
                                    {!selectedTemplate ? (
                                        <p className="text-xs text-slate-400 italic font-sans">Please select a template to preview the message format...</p>
                                    ) : (
                                        <>
                                            {selectedTemplate.imageUrl && (
                                                <div className="mb-2.5 rounded-xl overflow-hidden border border-emerald-100/50 shadow-sm bg-white/50">
                                                    <img
                                                        src={selectedTemplate.imageUrl}
                                                        className="w-full h-auto object-cover max-h-60"
                                                        alt="Preview"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                </div>
                                            )}
                                            {selectedTemplate.videoUrl && (
                                                <div className="mb-2.5 rounded-xl overflow-hidden border border-emerald-100/50 shadow-sm bg-slate-900 group/vid relative aspect-video flex items-center justify-center">
                                                    <video
                                                        src={selectedTemplate.videoUrl}
                                                        className="w-full h-full object-contain"
                                                        muted
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/40 transition-all">
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                                                            <i className="fa-solid fa-play text-xs translate-x-0.5"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Show media caption or message content */}
                                            {(selectedTemplate.imageUrl || selectedTemplate.videoUrl) ? (
                                                selectedTemplate.mediaCaption ? (
                                                    <p className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">{formatPreview(selectedTemplate.mediaCaption)}</p>
                                                ) : selectedTemplate.content ? (
                                                    <p className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">{formatPreview(selectedTemplate.content)}</p>
                                                ) : null
                                            ) : (
                                                <p className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">{formatPreview(selectedTemplate.content)}</p>
                                            )}
                                        </>
                                    )}
                                    <span className="text-[9px] text-slate-400 font-bold block mt-2 text-right">14:20</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                <i className="fa-solid fa-circle-info text-blue-500 mr-2"></i>
                                This preview uses placeholders. Real messages will include customer names where specified.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Target Queue Column */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <section className="card-premium flex-1 flex flex-col min-h-[600px] overflow-hidden">
                        <div className="p-6 md:p-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800">Target Queue</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Monitoring outbound delivery status in real-time.</p>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setCurrentFilter('All')}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentFilter === 'All' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                >All</button>
                                <button
                                    onClick={() => setCurrentFilter('Pending')}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentFilter === 'Pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                >Pending</button>
                                <button
                                    onClick={() => setCurrentFilter('Success')}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentFilter === 'Success' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                >Success</button>
                            </div>
                        </div>

                        {contacts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center pb-20">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                                    <i className="fa-solid fa-users-slash text-3xl"></i>
                                </div>
                                <h4 className="font-bold text-slate-800">No Contacts Loaded</h4>
                                <p className="text-xs text-slate-400 max-w-xs mt-1">Import a CSV file to populate your campaign recipient list.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto flex-1 px-8 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-white z-10 border-b border-slate-50">
                                            <tr className="text-[10px] uppercase tracking-widest text-slate-400">
                                                <th className="py-5 font-bold">Contact Name</th>
                                                {broadcastTarget === 'Users' && <th className="py-5 font-bold">Business Name</th>}
                                                <th className="py-5 font-bold">WhatsApp</th>
                                                <th className="py-5 font-bold text-right">Delivery Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredContacts.map((contact, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50/50 transition-all font-sans">
                                                    <td className="py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 group-hover:bg-white group-hover:shadow-sm">
                                                                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                            </div>
                                                            <p className="font-bold text-slate-700 text-sm tracking-tight">{contact.name}</p>
                                                        </div>
                                                    </td>
                                                    {broadcastTarget === 'Users' && (
                                                        <td className="py-5">
                                                            <span className="text-xs font-semibold text-slate-600">
                                                                {contact.business || <span className="text-slate-300 italic">N/A</span>}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                                <i className="fa-brands fa-whatsapp text-xs"></i>
                                                            </div>
                                                            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{contact.phone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 text-right">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${contact.status === 'Pending' ? 'bg-slate-100 text-slate-500' :
                                                            contact.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' :
                                                                'bg-red-50 text-red-600 font-bold'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${contact.status === 'Pending' ? 'bg-slate-300' :
                                                                contact.status === 'Sent' ? 'bg-emerald-500 animate-pulse' :
                                                                    'bg-red-500'
                                                                }`}></div>
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">{contact.status}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Queue Cards - Eye Catching */}
                                <div className="md:hidden space-y-3 px-6 pb-6 overflow-y-auto max-h-[400px] custom-scrollbar">
                                    {filteredContacts.map((contact, idx) => (
                                        <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-xs text-slate-400 shadow-sm">
                                                    {contact.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{contact.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{contact.phone}</p>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${contact.status === 'Pending' ? 'bg-white text-slate-200' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 animate-in zoom-in duration-300'}`}>
                                                <i className={`fa-solid ${contact.status === 'Pending' ? 'fa-clock text-[10px]' : 'fa-check text-xs'}`}></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="p-8 pt-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Processing {contacts.length} Contacts
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Queue</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            {/* Campaign Finished Popup */}
            {showFinishedPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowFinishedPopup(false)}
                    ></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 fade-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-emerald-200 animate-bounce">
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Campaign Finished!</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Your broadcast has been processed successfully. Check the delivery logs for details.</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Success</p>
                                <p className="text-lg font-black text-emerald-600">{contacts.filter(c => c.status === 'Sent').length}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Failed</p>
                                <p className="text-lg font-black text-red-500">{contacts.filter(c => c.status === 'Failed').length}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowFinishedPopup(false)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 hover:shadow-xl transition-all active:scale-95"
                        >
                            Back to Console
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Broadcast;
