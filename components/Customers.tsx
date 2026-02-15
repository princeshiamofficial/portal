import React, { useState, useMemo, useEffect } from 'react';
import { Customer, User } from '../types.ts';

// Admin Types
interface AdminUser {
    id: number;
    store_name: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    status: string;
    whatsapp?: string;
    address?: string;
    seatCapacity?: number;
    designation?: string;
}

interface Stats {
    totalUsers: number;
    totalCustomers: number;
    totalBroadcasts: number;
    totalTemplates: number;
}

interface CustomersProps {
    customers: Customer[];
    loading: boolean;
    onDelete: (id: number) => void;
    user?: User | null; // Added user prop
}

const Customers: React.FC<CustomersProps> = ({ customers, loading, onDelete, user }) => {
    // --- Common States ---
    const [search, setSearch] = useState('');

    // --- Customer View States ---
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const limit = 25;

    // --- Admin View States ---
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCustomers: 0, totalBroadcasts: 0, totalTemplates: 0 });
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        storeName: '',
        name: '',
        role: 'user',
        plan: 'Free',
        whatsapp: '',
        address: '',
        seatCapacity: '',
        designation: ''
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // --- Admin Logic ---
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin';

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
            fetchUsers();
        }
    }, [isAdmin]);

    const getToken = () => localStorage.getItem('fm_token');

    const fetchStats = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchUsers = async () => {
        setAdminLoading(true);
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAdminUsers(data.map((u: any) => ({
                    ...u,
                    plan: u.plan || 'Free',
                    status: u.status || 'active'
                })));
            }
        } catch (e) { console.error(e); }
        setAdminLoading(false);
    };

    const openEditModal = (u: AdminUser) => {
        setCurrentUser({ ...u });
        setShowModal(true);
    };

    const updateUser = async () => {
        if (!currentUser) return;
        const token = getToken();
        if (!token) return;
        const res = await fetch('/api/admin/users/' + currentUser.id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                plan: currentUser.plan,
                role: currentUser.role,
                status: currentUser.status,
                name: currentUser.name,
                storeName: currentUser.store_name,
                whatsapp: currentUser.whatsapp,
                address: currentUser.address,
                seatCapacity: currentUser.seatCapacity,
                designation: currentUser.designation
            })
        });
        if (res.ok) {
            setShowModal(false);
            fetchUsers();
        }
    };

    const openDeleteModal = (u: AdminUser) => {
        setUserToDelete(u);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        const token = getToken();
        if (!token) return;
        const res = await fetch('/api/admin/users/' + userToDelete.id, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            setShowDeleteModal(false);
            fetchUsers();
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewUser({ email: '', password: '', storeName: '', name: '', role: 'user', plan: 'Free', whatsapp: '', address: '', seatCapacity: '', designation: '' });
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to create user');
            }
        } catch (e) {
            console.error(e);
        }
    };


    // --- Customer Logic ---
    const calculateNextBirthday = (dob: string) => {
        if (!dob) return 'N/A';
        try {
            let day, month;
            if (dob.includes('-') && dob.split('-').length === 3) {
                const parts = dob.split('-');
                month = parseInt(parts[1]) - 1;
                day = parseInt(parts[2]);
            } else {
                const parts = dob.split(',')[0].trim().split(' ');
                day = parseInt(parts[0]);
                const monthName = parts[1];
                const monthMap: { [key: string]: number } = {
                    'Jan': 0, 'January': 0, 'Feb': 1, 'February': 1, 'Mar': 2, 'March': 2,
                    'Apr': 3, 'April': 3, 'May': 4, 'Jun': 5, 'June': 5, 'Jul': 6, 'July': 6,
                    'Aug': 7, 'August': 7, 'Sep': 8, 'September': 8, 'Oct': 9, 'October': 10,
                    'Nov': 10, 'November': 10, 'Dec': 11, 'December': 11
                };
                month = monthMap[monthName] ?? monthMap[monthName.substring(0, 3)];
            }
            if (isNaN(day) || isNaN(month)) return 'N/A';
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
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const filteredAdminUsers = useMemo(() => {
        return adminUsers.filter(u =>
            u.store_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.id.toString().includes(search)
        );
    }, [adminUsers, search]);


    // --- RENDER: ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="flex-1 font-['Plus_Jakarta_Sans',sans-serif]">
                <header className="hidden z-30 bg-[#f8fafc]/80 backdrop-blur-md -mx-6 md:-mx-8 lg:-mx-12 -mt-28 md:-mt-8 lg:-mt-12 mb-8 md:mb-12 px-6 md:px-8 lg:px-12 pt-28 md:pt-8 lg:pt-12 pb-6 md:pb-8 lg:pb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <span className="h-1 w-8 bg-slate-400 rounded-full"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Administration</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Manage Customers</h2>
                        <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Control user access, plans, and system status.</p>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold mb-1">Total Clients</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-user-tag"></i>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold mb-1">End Customers</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalCustomers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-tower-broadcast"></i>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold mb-1">System Broadcasts</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalBroadcasts}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                            <i className="fa-solid fa-file-invoice"></i>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-bold mb-1">Templates</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalTemplates}</h3>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)] overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800">Customer Directory</h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium italic">Searching: {filteredAdminUsers.length} results</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-end">
                            <div className="relative group min-w-[320px] w-full sm:w-auto">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all duration-300"></i>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search store, email or ID..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white outline-none transition-all duration-300 shadow-inner"
                                />
                            </div>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
                            >
                                <i className="fa-solid fa-user-plus text-[10px]"></i> New Customer
                            </button>
                        </div>
                        {adminLoading && <i className="fa-solid fa-circle-notch fa-spin text-slate-400 self-center"></i>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                    <th className="px-8 py-4">Business Name</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">WhatsApp</th>
                                    <th className="px-6 py-4">Designation</th>
                                    <th className="px-6 py-4">Address</th>
                                    <th className="px-6 py-4">Seats</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Plan</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAdminUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-all duration-200 group/row">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-800 group-hover/row:text-indigo-600 transition-colors">{u.store_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #USR-{u.id}</p>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-slate-600 font-semibold">{u.name || 'N/A'}</td>
                                        <td className="px-6 py-6 text-sm text-slate-500 font-mono tracking-tight">{u.whatsapp || 'N/A'}</td>
                                        <td className="px-6 py-6 text-sm text-slate-500 font-semibold italic">{u.designation || 'N/A'}</td>
                                        <td className="px-6 py-6 text-sm text-slate-500 truncate max-w-[150px]">{u.address || 'N/A'}</td>
                                        <td className="px-6 py-6 text-sm font-bold text-slate-700">{u.seatCapacity || 0}</td>
                                        <td className="px-6 py-6 text-sm text-slate-500">{u.email}</td>
                                        <td className="px-6 py-6 text-sm">
                                            <span className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider ${u.plan === 'Free' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' : u.plan === 'Pro' ? 'bg-purple-50 text-purple-600 border border-purple-100/50' : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                                                }`}>{u.plan}</span>
                                        </td>
                                        <td className="px-6 py-6 text-sm">
                                            <span className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider ${u.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                                                }`}>{u.role}</span>
                                        </td>
                                        <td className="px-6 py-6 text-sm">
                                            <span className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-fit ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-red-50 text-red-600 border border-red-100/50'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => openEditModal(u)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 shadow-sm hover:shadow-md transition-all active:scale-90">
                                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                                </button>
                                                <button onClick={() => openDeleteModal(u)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 bg-white border border-slate-100 hover:border-red-200 hover:text-red-500 shadow-sm hover:shadow-md transition-all active:scale-90">
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {
                    showModal && currentUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Customer</h3>
                                            <p className="text-slate-500 text-sm font-medium">Modifying {currentUser.store_name}</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    <div className="max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Business Name</label>
                                                <input
                                                    type="text"
                                                    value={currentUser.store_name}
                                                    onChange={e => setCurrentUser({ ...currentUser, store_name: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={currentUser.name}
                                                    onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">WhatsApp Number</label>
                                                <input
                                                    type="text"
                                                    value={currentUser.whatsapp || ''}
                                                    onChange={e => setCurrentUser({ ...currentUser, whatsapp: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                    placeholder="e.g. 8801712345678"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Designation</label>
                                                    <select
                                                        value={currentUser.designation || ''}
                                                        onChange={e => setCurrentUser({ ...currentUser, designation: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                    >
                                                        <option value="">Select Designation</option>
                                                        <option value="Owner">Owner</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Chief">Chief</option>
                                                        <option value="Others">Others</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Seat Capacity</label>
                                                    <input
                                                        type="number"
                                                        value={currentUser.seatCapacity || ''}
                                                        onChange={e => setCurrentUser({ ...currentUser, seatCapacity: parseInt(e.target.value) || 0 })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="e.g. 50"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Physical Address</label>
                                                <input
                                                    type="text"
                                                    value={currentUser.address || ''}
                                                    onChange={e => setCurrentUser({ ...currentUser, address: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                    placeholder="Full street address"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Role</label>
                                                    <select
                                                        value={currentUser.role}
                                                        onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                    >
                                                        <option value="user">User (Store)</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="superadmin">SuperAdmin</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Plan</label>
                                                    <select
                                                        value={currentUser.plan}
                                                        onChange={e => setCurrentUser({ ...currentUser, plan: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                    >
                                                        <option value="Free">Free</option>
                                                        <option value="Pro">Pro</option>
                                                        <option value="Enterprise">Enterprise</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Access Status</label>
                                                <select
                                                    value={currentUser.status}
                                                    onChange={e => setCurrentUser({ ...currentUser, status: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                >
                                                    <option value="active">Active Access</option>
                                                    <option value="disabled">Disabled Access</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={updateUser}
                                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all mt-4"
                                    >
                                        Save Platform Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Delete Modal */}
                {
                    showDeleteModal && userToDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
                            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
                                <div className="mb-8 text-center">
                                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-trash-can text-2xl"></i></div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Customer?</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-2">Are you sure you want to delete <span className="text-slate-900 font-bold">{userToDelete.store_name}</span>?</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button onClick={confirmDelete} className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-200 hover:bg-red-700 transition-all">Yes, Delete Customer</button>
                                    <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Add User Modal */}
                {
                    showAddModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New Customer</h3>
                                            <p className="text-slate-500 text-sm font-medium">Provision a new customer account.</p>
                                        </div>
                                        <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddUser} className="space-y-6">
                                        <div className="max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Business Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newUser.storeName}
                                                        onChange={e => setNewUser({ ...newUser, storeName: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="e.g. Color Hut"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newUser.name}
                                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="Full Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">WhatsApp Number</label>
                                                    <input
                                                        type="text"
                                                        value={newUser.whatsapp}
                                                        onChange={e => setNewUser({ ...newUser, whatsapp: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="e.g. 8801712345678"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Email Address</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={newUser.email}
                                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="admin@colorhutbd.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Password</label>
                                                    <div className="relative group">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            required
                                                            value={newUser.password}
                                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700 pr-14"
                                                            placeholder="••••••••"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors"
                                                        >
                                                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Designation</label>
                                                        <select
                                                            value={newUser.designation}
                                                            onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                        >
                                                            <option value="">Select Designation</option>
                                                            <option value="Owner">Owner</option>
                                                            <option value="Manager">Manager</option>
                                                            <option value="Chief">Chief</option>
                                                            <option value="Others">Others</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Seat Capacity</label>
                                                        <input
                                                            type="number"
                                                            value={newUser.seatCapacity}
                                                            onChange={e => setNewUser({ ...newUser, seatCapacity: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                            placeholder="e.g. 50"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Business Address</label>
                                                    <input
                                                        type="text"
                                                        value={newUser.address}
                                                        onChange={e => setNewUser({ ...newUser, address: e.target.value })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-slate-700"
                                                        placeholder="Full street address"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Role</label>
                                                        <select
                                                            value={newUser.role}
                                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                        >
                                                            <option value="user">User (Store)</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="superadmin">SuperAdmin</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Plan</label>
                                                        <select
                                                            value={newUser.plan}
                                                            onChange={e => setNewUser({ ...newUser, plan: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700 appearance-none"
                                                        >
                                                            <option value="Free">Free</option>
                                                            <option value="Pro">Pro</option>
                                                            <option value="Enterprise">Enterprise</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all mt-4"
                                        >
                                            Create User Account
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        );
    }

    // --- RENDER: CUSTOMER VIEW (EXISTING) ---
    return (
        <div className="flex-1 font-['Plus_Jakarta_Sans',sans-serif]">
            <header className="hidden z-30 bg-[#f8fafc]/80 backdrop-blur-md -mx-6 md:-mx-8 lg:-mx-12 -mt-28 md:-mt-8 lg:-mt-12 mb-8 md:mb-12 px-6 md:px-8 lg:px-12 pt-28 md:pt-8 lg:pt-12 pb-6 md:pb-8 lg:pb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6 transition-all">
                <div>
                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                        <span className="h-1 w-8 bg-rose-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Customer Database</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Customer Records</h2>
                    <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Full directory with direct WhatsApp contact access.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:border-rose-200 hover:bg-rose-50/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.03)] group"
                        >
                            <i className="fa-solid fa-filter text-slate-400 group-hover:text-rose-500 transition-colors"></i>
                            <span>Filter Records</span>
                            <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}></i>
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2">
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</div>
                                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-rose-50 rounded-2xl transition-all group">
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-600">Recently Updated</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Alphabetical (A-Z)</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

                    <div className="relative group min-w-[320px]">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-rose-500 transition-all duration-300"></i>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or number..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-rose-500/5 focus:border-rose-300 outline-none transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
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
                                <th className="px-8 py-5 font-bold text-center">Whatsapp</th>
                                <th className="px-8 py-5 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <i className="fa-solid fa-circle-notch fa-spin text-red-500 text-3xl mb-4"></i>
                                            <p className="text-slate-500 font-bold">Retrieving records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
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
                                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-all duration-200 group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border transition-transform duration-300 group-hover/row:scale-110 ${customer.id % 4 === 1 ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                                    customer.id % 4 === 2 ? 'bg-purple-50 text-purple-500 border-purple-100' :
                                                        customer.id % 4 === 3 ? 'bg-blue-50 text-blue-500 border-blue-100' :
                                                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                    }`}>
                                                    {getInitials(customer.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base leading-none mb-1 group-hover/row:text-rose-600 transition-colors">{customer.name}</p>
                                                    <p className="text-xs text-slate-400 font-medium tracking-tight">ID: {customer.customer_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-semibold text-slate-600 text-sm">{customer.occupation}</td>
                                        <td className="px-6 py-6 text-sm">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-[10px] uppercase tracking-wider border border-blue-100/50">
                                                {customer.dob}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 max-w-xs text-sm text-slate-500 truncate italic">{customer.address}</td>
                                        <td className="px-6 py-6 text-sm">
                                            {customer.anniversaryDate ? (
                                                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full font-bold text-[10px] uppercase tracking-wider border border-purple-100/50">
                                                    {customer.anniversaryDate}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 font-bold ml-2">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
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
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => onDelete(customer.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white shadow-sm hover:shadow-rose-200 transition-all active:scale-90"
                                                    title="Delete Customer"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                                </button>
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
                            <button
                                onClick={() => onDelete(customer.id)}
                                className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                                <i className="fa-solid fa-trash-can text-sm"></i>
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
