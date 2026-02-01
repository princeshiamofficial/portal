import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface StoreData {
    storeName: string;
    logo?: string;
    memberId: string;
}

const StorePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const memberId = searchParams.get('menu');
    const [storeData, setStoreData] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch logic temporarily disabled to force "Store Not Found" view
        /*
        if (!memberId) {
            setLoading(false);
            return;
        }

        const fetchStoreInfo = async () => {
            try {
                // Reusing the check-customer logic or similar to get store info
                const res = await fetch(`/api/public/store-info?memberId=${memberId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStoreData(data);
                }
            } catch (error) {
                console.error("Failed to fetch store info", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreInfo();
        */
    }, [memberId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!storeData) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 font-black text-4xl italic">?</div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Store Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-xs">The store you're looking for doesn't exist or has been moved.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return null;
};

export default StorePage;
