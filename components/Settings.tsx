import React, { useState, useRef } from 'react';
import { User } from '../types';

interface SettingsProps {
    user: User;
    onUpdateUser: (updatedUser: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
    const [storeName, setStoreName] = useState(user.storeName);
    const [logoPreview, setLogoPreview] = useState<string | undefined>(user.logo);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChangePassword = async () => {
        const token = localStorage.getItem('fm_token');
        if (!token) return;

        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (res.ok) {
                    alert('Password updated successfully');
                    setCurrentPassword('');
                    setNewPassword('');
                } else {
                    alert(data.message || 'Failed to update password');
                }
            } else {
                if (res.status === 404) alert("Server endpoint not found. Please ensure the server is fully updated and running.");
                else alert(`Server Error (${res.status}): Please try again later.`);
            }
        } catch (e) {
            console.error(e);
            alert(`Network or Application Error: ${e}`);
        }
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate Dimensions
        const validateDimensions = (file: File): Promise<{ width: number, height: number }> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                };
                img.onerror = () => reject('Error loading image');
                img.src = URL.createObjectURL(file);
            });
        };

        try {
            const { width, height } = await validateDimensions(file);
            const reqWidth = 4900;
            const reqHeight = 900;

            if (width !== reqWidth || height !== reqHeight) {
                alert(`Logo must be exactly ${reqWidth}x${reqHeight}px. (Current: ${width}x${height}px)`);
                return;
            }

            const token = localStorage.getItem('fm_token');
            if (!token) return;

            const formData = new FormData();
            formData.append('logo', file);

            const res = await fetch('/api/upload-logo', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setLogoPreview(data.logoUrl);
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to upload logo');
            }
        } catch (err) {
            console.error('Logo upload/validation error', err);
            alert('Error processing logo upload');
        }
    };

    const handleSave = () => {
        onUpdateUser({
            storeName,
            logo: logoPreview
        });
        setShowSuccess(true);
    };

    return (
        <div className="p-0 md:p-8 h-full overflow-y-auto custom-scrollbar relative">
            <div className="max-w-6xl space-y-6 md:space-y-8 pb-12 pt-6 md:pt-0 px-4 md:px-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Branding Section */}
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                <i className="fa-solid fa-paintbrush text-lg"></i>
                            </div>
                            Branding & Appearance
                        </h2>

                        <div className="space-y-6 flex-1">
                            {/* Logo Upload */}
                            <div className="md:block">
                                <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-4 md:mb-3 ml-1 md:ml-0">Sidebar Logo</label>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className="w-32 h-32 bg-slate-50 rounded-[2rem] md:rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group shrink-0 shadow-inner">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <i className="fa-solid fa-cloud-arrow-up text-slate-300 text-2xl group-hover:text-violet-500 transition-colors"></i>
                                        )}
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all w-full sm:w-fit mx-auto sm:mx-0 flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-200"
                                            >
                                                <i className="fa-solid fa-upload"></i>
                                                Upload Photo
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Supports PNG, JPG, or SVG.<br />
                                                Required exact size: 4900x900px.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <i className="fa-solid fa-user-shield text-lg"></i>
                            </div>
                            Store Information
                        </h2>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-2 ml-1 md:ml-0">Store Name</label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50/50 md:bg-slate-50 border border-slate-100 md:border-slate-200 rounded-[1.5rem] md:rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 md:focus:ring-2 md:focus:ring-blue-500/20 focus:border-blue-400 md:focus:border-blue-500 font-bold md:font-semibold text-slate-700 transition-all"
                                    placeholder="Enter your store name"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-2 ml-1 md:ml-0">Live Store Page</label>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="w-full flex-1 bg-slate-50/50 md:bg-slate-50 px-5 py-4 rounded-[1.5rem] md:rounded-xl border border-slate-100 md:border-slate-200 text-[11px] md:text-sm text-slate-500 font-mono truncate">
                                        {window.location.origin}/store?menu={user.memberId}
                                    </div>
                                    <button
                                        onClick={() => window.open(`${window.location.origin}/store?menu=${user.memberId}`, '_blank')}
                                        className="w-full sm:w-auto px-6 py-4 bg-white border border-slate-100 md:border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] md:rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        View Page
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">This page is automatically generated based on your settings.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-2 ml-1 md:ml-0">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-5 py-4 bg-slate-100/50 md:bg-slate-100 border border-slate-100 md:border-slate-200 rounded-[1.5rem] md:rounded-xl text-slate-400 md:text-slate-500 font-bold md:font-medium cursor-not-allowed pr-10"
                                    />
                                    <i className="fa-solid fa-lock absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                            <i className="fa-solid fa-lock text-lg"></i>
                        </div>
                        Security
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-2 ml-1 md:ml-0">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPass ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50/50 md:bg-slate-50 border border-slate-100 md:border-slate-200 rounded-[1.5rem] md:rounded-xl focus:outline-none focus:ring-4 focus:ring-rose-100 md:focus:ring-2 md:focus:ring-rose-500/20 focus:border-rose-400 md:focus:border-rose-500 font-bold md:font-semibold text-slate-700 pr-12 transition-all"
                                    placeholder="Enter current password"
                                />
                                <button
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    <i className={`fa-solid ${showCurrentPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] md:text-sm font-black md:font-bold uppercase md:capitalize tracking-widest md:tracking-normal text-slate-400 md:text-slate-700 mb-2 ml-1 md:ml-0">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50/50 md:bg-slate-50 border border-slate-100 md:border-slate-200 rounded-[1.5rem] md:rounded-xl focus:outline-none focus:ring-4 focus:ring-rose-100 md:focus:ring-2 md:focus:ring-rose-500/20 focus:border-rose-400 md:focus:border-rose-500 font-bold md:font-semibold text-slate-700 pr-12 transition-all"
                                    placeholder="Enter new password"
                                />
                                <button
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    <i className={`fa-solid ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleChangePassword}
                            disabled={!currentPassword || !newPassword}
                            className={`w-full py-4 md:py-3 rounded-[1.5rem] md:rounded-xl font-black md:font-bold text-[10px] md:text-sm uppercase md:capitalize tracking-widest md:tracking-wide transition-all ${!currentPassword || !newPassword
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-200 active:scale-[0.98]'
                                }`}
                        >
                            Update Password
                        </button>
                    </div>
                </div>

                {/* Store QR Code Section */}
                {user.role?.toLowerCase() === 'user' && (
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <i className="fa-solid fa-qrcode text-lg"></i>
                            </div>
                            Store Identity QR
                        </h2>

                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="w-48 h-48 bg-slate-50 rounded-[2rem] p-4 border border-slate-100 shadow-inner group relative cursor-pointer overflow-hidden shrink-0">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/vip?member=${user.memberId || '000000'}`)}`}
                                    alt="Store QR Code"
                                    className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(`${window.location.origin}/vip?member=${user.memberId || '000000'}`)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-transform"
                                    >
                                        Download HQ
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-5">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 mb-2">VIP Member Registration Link</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-slate-50 px-5 py-3 rounded-2xl text-sm text-slate-600 border border-slate-100 font-mono truncate">
                                            {window.location.origin}/vip?member={user.memberId}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/vip?member=${user.memberId}`);
                                                alert('Link copied to clipboard!');
                                            }}
                                            className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="Copy Link"
                                        >
                                            <i className="fa-solid fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                                    This QR code and link are unique to your store. Customers who use them will be automatically registered into your database as <b>VIP Members</b>, allowing you to track visits and send automated rewards.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 sm:gap-6 pt-4">
                    <button
                        onClick={() => {
                            setStoreName(user.storeName);
                            setLogoPreview(user.logo);
                        }}
                        className="w-full sm:w-auto text-sm font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors py-4 sm:py-0"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-10 py-5 sm:py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>

            {/* Success Modal */}
            {
                showSuccess && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-2xl shadow-sm">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Changes Saved!</h3>
                                <p className="text-slate-500 mb-6 text-sm leading-relaxed">Your profile settings have been updated successfully.</p>
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-500/20"
                                >
                                    Awesome
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Settings;
