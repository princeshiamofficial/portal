import React, { useState, useMemo } from 'react';
import { Customer } from '../types.ts';

interface CustomersProps {
    customers: Customer[];
    loading: boolean;
}

const Customers: React.FC<CustomersProps> = ({ customers, loading }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const limit = 25;

    const calculateNextBirthday = (dob: string) => {
        if (!dob) return 'N/A';
        try {
            // Assuming format "DD Month" or similar based on HTML logic
            const parts = dob.split(',')[0].trim().split(' ');
            const day = parseInt(parts[0]);
            const monthName = parts[1];
            const monthMap: { [key: string]: number } = {
                'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1, 'Mar': 2, 'March': 2,
                'Apr': 3, 'April': 3, 'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
                'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8, 'Oct': 9, 'October': 10,
                'Nov': 10, 'November': 10, 'Dec': 11, 'December': 11
            };
            const month = monthMap[monthName] ?? monthMap[monthName.substring(0, 3)];
            const now = new Date();
            const currentYear = now.getFullYear();
            let nextBday = new Date(currentYear, month, day);
            if (nextBday < now) nextBday.setFullYear(currentYear + 1);
            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
            const formattedDate = nextBday.toLocaleDateString('en-GB', options);
            return `${formattedDate}, ${nextBday.getFullYear()}`;
        } catch (e) {
            return 'N/A';
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.whatsapp.includes(search)
        );
    }, [customers, search]);

    const paginatedCustomers = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredCustomers.slice(start, start + limit);
    }, [filteredCustomers, page]);

    const totalResults = filteredCustomers.length;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div className="flex-1">
            <header className="sticky top-0 z-30 bg-[#f8fafc]/80 backdrop-blur-md -mx-6 md:-mx-8 lg:-mx-12 -mt-6 md:-mt-8 lg:-mt-12 mb-8 md:mb-12 px-6 md:px-8 lg:px-12 py-6 md:py-8 lg:py-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <span className="h-1 w-8 bg-red-500 rounded-full"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Customer Database</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Personal Records</h2>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Full directory with direct WhatsApp contact access.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50/30 transition-all shadow-sm group"
                        >
                            <i className="fa-solid fa-filter text-slate-400 group-hover:text-red-500 transition-colors"></i>
                            <span>Filter Records</span>
                            <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}></i>
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2">
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</div>
                                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 rounded-2xl transition-all group">
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-red-600">Recently Updated</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Alphabetical (A-Z)</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>

                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>

                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Filters</div>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                            <i className="fa-solid fa-cake-candles text-xs"></i>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-700">Birthday This Month</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-2xl transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <i className="fa-solid fa-briefcase text-xs"></i>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Business Owners</span>
                                    </button>
                                </div>

                                <div className="p-2 bg-slate-50 border-t border-slate-100">
                                    <button className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-red-500 transition-colors"></i>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or number..."
                            className="w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-red-500/5 focus:border-red-400 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="hidden lg:block bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                <th className="px-8 py-5 font-bold">Identity</th>
                                <th className="px-6 py-5 font-bold">Occupation</th>
                                <th className="px-6 py-5 font-bold">Date of Birth</th>
                                <th className="px-6 py-5 font-bold">Address</th>
                                <th className="px-6 py-5 font-bold">Anniversary Date</th>
                                <th className="px-8 py-5 font-bold text-right">Whatsapp Number</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-solid fa-circle-notch fa-spin text-red-500 text-3xl mb-4"></i>
                                            <p className="text-slate-500 font-bold">Retrieving records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                                <i className="fa-solid fa-users-slash text-2xl"></i>
                                            </div>
                                            <p className="text-slate-500 font-bold">No customers found</p>
                                            <p className="text-slate-400 text-sm">Try searching for a different name or number</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border ${customer.id % 4 === 1 ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                                    customer.id % 4 === 2 ? 'bg-purple-50 text-purple-500 border-purple-100' :
                                                        customer.id % 4 === 3 ? 'bg-blue-50 text-blue-500 border-blue-100' :
                                                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                    }`}>
                                                    {getInitials(customer.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base leading-none mb-1">{customer.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {customer.customer_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-semibold text-slate-600 text-sm">{customer.occupation}</td>
                                        <td className="px-6 py-6 text-sm">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-[10px] uppercase tracking-wider">
                                                {customer.dob}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 max-w-xs text-sm text-slate-500 truncate">{customer.address}</td>
                                        <td className="px-6 py-6 text-sm">
                                            {customer.anniversaryDate ? (
                                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full font-bold text-[10px] uppercase tracking-wider">
                                                    {customer.anniversaryDate}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 font-bold ml-2">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl hover:border-emerald-200 transition-all group">
                                                <span className="text-sm font-bold text-slate-700 font-mono tracking-tight">{customer.whatsapp}</span>
                                                <a
                                                    href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all"
                                                >
                                                    <i className="fa-brands fa-whatsapp"></i>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-8 bg-slate-50/30 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing {paginatedCustomers.length} of {totalResults} Results
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50 transition-all"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page * limit >= totalResults}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-slate-300 disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Card-Based View - Eye Catching */}
            <div className="lg:hidden space-y-4">
                {paginatedCustomers.map((customer) => (
                    <div key={customer.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.02)] relative overflow-hidden group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-bold text-lg shadow-inner ${customer.id % 4 === 1 ? 'bg-orange-50 text-orange-500' :
                                customer.id % 4 === 2 ? 'bg-purple-50 text-purple-500' :
                                    customer.id % 4 === 3 ? 'bg-blue-50 text-blue-500' :
                                        'bg-emerald-50 text-emerald-500'
                                }`}>
                                {getInitials(customer.name)}
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{customer.name}</h3>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <i className="fa-solid fa-briefcase text-[10px] opacity-70"></i>
                                    {customer.occupation}
                                </p>
                            </div>
                            <a
                                href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 active:scale-90 transition-transform"
                            >
                                <i className="fa-brands fa-whatsapp text-xl"></i>
                            </a>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">WhatsApp</p>
                                <p className="text-xs font-bold text-slate-700 truncate">{customer.whatsapp}</p>
                            </div>
                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Birthday</p>
                                <p className="text-xs font-bold text-red-600 truncate">{calculateNextBirthday(customer.dob).split(',')[0]}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {customer.customer_id}</p>
                            <button className="text-slate-400 hover:text-slate-900">
                                <i className="fa-solid fa-ellipsis text-lg"></i>
                            </button>
                        </div>
                    </div>
                ))}

                {paginatedCustomers.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <i className="fa-solid fa-users-slash text-2xl"></i>
                        </div>
                        <p className="text-slate-500 font-bold">No customers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
