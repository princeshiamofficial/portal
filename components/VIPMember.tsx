import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VIPMember: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const memberId = searchParams.get('member');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isNotRegistered, setIsNotRegistered] = useState(false);

    // Registration Form State
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        dob: '',
        address: '',
        occupation: '',
        maritalStatus: 'Single',
        anniversaryDate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        if (!memberId) {
            alert("No Store ID found. Use a URL like: ?member=123456");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/public/check-customer?memberId=${memberId}&code=${code}`);
            const data = await res.json();

            if (data.registered) {
                navigate(`/store?menu=${memberId}`);
            } else {
                setIsNotRegistered(true);
                // Pre-fill whatsapp if the code looks like a phone number
                if (/^\+?[\d\s-]{10,}$/.test(code)) {
                    setFormData(prev => ({ ...prev, whatsapp: code }));
                }
            }
        } catch (error) {
            console.error("Check failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/public/register-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId, customer_id: code })
            });

            if (res.ok) {
                navigate(`/store?menu=${memberId}`);
            }
        } catch (error) {
            console.error("Registration failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Close Icon */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all active:scale-95 z-50"
            >
                <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className={`max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-1000 ${isNotRegistered ? 'mt-32 mb-32' : ''}`}>
                {/* Top Character/Icon */}
                {!isNotRegistered && (
                    <div className="mb-6">
                        <img
                            src="/assets/smiley.png"
                            alt="Smiley"
                            className="w-20 h-20 object-contain grayscale brightness-0"
                        />
                    </div>
                )}

                {isSuccess ? (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fa-solid fa-check text-2xl"></i>
                        </div>
                        <h2 className="text-4xl font-black text-black mb-4 tracking-tighter">You're in!</h2>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">Your exclusive VIP discount code is ready.</p>

                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
                                <span className="text-3xl font-black tracking-[0.3em] uppercase text-white font-mono">
                                    VIP<span className="text-red-500">2026</span>
                                </span>
                            </div>
                        </div>

                        <p className="mt-8 text-xs text-slate-400 font-medium">Please present this code at checkout.</p>
                    </div>
                ) : isNotRegistered ? (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h2 className="text-4xl font-black text-black mb-2 tracking-tighter">Join the Club!</h2>
                        <p className="text-slate-400 font-medium mb-10">Sign up to unlock your VIP rewards.</p>

                        <form onSubmit={handleRegister} className="w-full space-y-4 text-left">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="+1 234 567 890"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300 font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Occupation</label>
                                    <input
                                        type="text"
                                        placeholder="Engineer"
                                        value={formData.occupation}
                                        onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Marital Status</label>
                                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, maritalStatus: 'Single', anniversaryDate: '' })}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.maritalStatus === 'Single' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Single
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, maritalStatus: 'Married' })}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.maritalStatus === 'Married' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Married
                                    </button>
                                </div>
                            </div>

                            <div className={`grid ${formData.maritalStatus === 'Married' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 transition-all duration-500`}>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium text-slate-700"
                                    />
                                </div>
                                {formData.maritalStatus === 'Married' && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Anniversary Date</label>
                                        <input
                                            type="date"
                                            value={formData.anniversaryDate}
                                            onChange={e => setFormData({ ...formData, anniversaryDate: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium text-slate-700"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Address</label>
                                <input
                                    type="text"
                                    placeholder="Your Business/Home address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-slate-300 font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                            >
                                {isSubmitting ? 'Registering...' : 'Submit & Unlock Code'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <h1 className="text-5xl font-black text-black mb-12 tracking-tighter leading-tight">
                            Discount<br />unlocked!
                        </h1>

                        <form onSubmit={handleSubmit} className="w-full space-y-6 max-w-[320px]">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter code to redeem"
                                    required
                                    className="w-full px-8 py-5 bg-white border border-slate-200 group-hover:border-slate-300 rounded-full text-center outline-none focus:border-black transition-all placeholder:text-slate-300 font-medium text-lg"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-black text-white py-5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                            >
                                {isSubmitting ? 'Verifying...' : 'Unlock Code'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Bottom Character Peeking */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0 pointer-events-none w-full max-w-lg transition-opacity duration-500 ${isNotRegistered ? 'opacity-20' : 'opacity-100'}`}>
                <img
                    src="/assets/peeking.png"
                    alt="Peeking"
                    className="w-64 h-auto mx-auto translate-y-1 hover:-translate-y-1 transition-transform duration-500"
                />
            </div>

            {/* Bottom Black Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black"></div>
        </div>
    );
};

export default VIPMember;
