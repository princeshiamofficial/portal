import React, { useState } from 'react';
import { WhatsAppSession } from '../types.ts';

interface DevicesProps {
    wa: WhatsAppSession;
    onConnect: () => void;
    onLogout: () => void;
}

const Devices: React.FC<DevicesProps> = ({ wa, onConnect, onLogout }) => {
    const [showConnect, setShowConnect] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleStartConnect = () => {
        onConnect();
        setShowConnect(true);
    };

    const handleConfirmLogout = () => {
        onLogout();
        setShowLogoutModal(false);
    };

    const formattedNumber = (id?: string) => {
        if (!id) return '';
        // Simplistic formatting for demonstration
        const num = id.split('@')[0].split(':')[0];
        return `+${num}`;
    };

    return (
        <div className="flex-1">
            <header className="z-30 bg-[#f8fafc]/80 backdrop-blur-md -mx-6 md:-mx-8 lg:-mx-12 -mt-6 md:-mt-8 lg:-mt-12 mb-8 md:mb-12 px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 flex flex-col md:flex-row md:items-end justify-end gap-6">
                <div className="hidden">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <span className="h-1 w-8 bg-red-500 rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">WhatsApp Setup</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">WhatsApp Connections</h2>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Link your account to enable automated customer engagement.</p>
                </div>

                {wa.status !== 'connected' && (
                    <button
                        onClick={handleStartConnect}
                        className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <i className="fa-solid fa-plus"></i> Connect Account
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {wa.status === 'connected' ? (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all group relative overflow-hidden animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                                <i className="fa-brands fa-whatsapp text-2xl"></i>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                        <div className="space-y-1 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Account</p>
                            <h3 className="text-xl font-bold text-slate-800">
                                {wa.user?.name || 'WhatsApp User'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <i className="fa-solid fa-phone text-[10px] text-slate-300"></i>
                                <span className="text-slate-400 text-xs font-bold font-mono">
                                    {formattedNumber(wa.user?.id)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Status</span>
                                <span className="text-xs font-bold text-emerald-500">Connected</span>
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="w-full py-3 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl text-xs font-bold transition-all mt-2"
                            >
                                Logout Instance
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={handleStartConnect}
                        className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center group cursor-pointer hover:border-red-200 hover:bg-red-50/10 transition-all h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 transition-all mb-4">
                            <i className="fa-brands fa-whatsapp text-2xl"></i>
                        </div>
                        <p className="font-bold text-slate-400 group-hover:text-red-500 transition-all text-center leading-relaxed">
                            No active connection.<br />Link your WhatsApp now.
                        </p>
                    </div>
                )}
            </div>

            {/* Connect Modal */}
            {showConnect && wa.status !== 'connected' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowConnect(false)}
                            className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>

                        <div className="p-10">
                            <div className="text-center mb-10">
                                <h3 className="text-3xl font-black text-slate-900 mb-2">Connect WhatsApp</h3>
                                <p className="text-slate-500 font-medium">Scan the QR code with your phone to link your account</p>
                            </div>

                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                <div className="w-full aspect-square qr-gradient border border-slate-100 rounded-[2rem] flex items-center justify-center p-8 relative overflow-hidden shadow-sm">
                                    {wa.qr ? (
                                        <img src={wa.qr} className="w-full h-full relative z-10" alt="WhatsApp QR" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <i className="fa-solid fa-circle-notch fa-spin text-red-500 text-3xl"></i>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating QR...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                                <p className="text-xs text-slate-400 italic font-medium">Open WhatsApp &gt; Menu or Settings &gt; Linked Devices &gt; Link a Device</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Disconnect WhatsApp?</h3>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                            Are you sure you want to disconnect your WhatsApp account? You will need to scan the QR code again to reconnect.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-sans"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLogout}
                                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 font-sans"
                            >
                                <i className="fa-solid fa-right-from-bracket"></i>
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devices;
