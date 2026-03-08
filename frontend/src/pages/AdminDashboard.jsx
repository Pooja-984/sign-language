import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Brain, Users, Settings, LogOut, Shield, Bell, Search, Activity, Camera, ChevronRight, Menu, X } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalModels: 0,
        recentActivity: [],
        recentUsers: []
    });
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'admin') {
            navigate('/admin/login');
            return;
        }

        // Simulating user fetch or decoding token
        setUser({ role: 'admin', name: "Administrator" });

        // Fetch Dashboard Stats
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/dashboard/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Brain, label: 'Model Training', path: '/admin/training' },
        { icon: Users, label: 'Skill Management', path: '/admin/skills' },
    ];

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-slate-50 relative">
            {/* Animated Background Blobs - Matching Login/User View */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Enhanced Glassmorphism */}
            <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white/90 md:bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-4 rounded-3xl h-[calc(100vh-2rem)] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                <div className="p-8 border-b border-white/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Shield className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">SignTrans</h2>
                            <span className="text-xs text-red-500 uppercase tracking-widest font-bold">Admin Panel</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-red-500 md:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-red-600'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500'}`} />
                                <span className="font-bold text-sm">{item.label}</span>
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-red-400" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/20">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group font-bold"
                    >
                        <LogOut size={20} className="group-hover:stroke-red-600" />
                        <span className="text-sm">Sign Out</span>
                    </button>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">v1.2.0-beta</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent z-10">
                {/* Header - Enhanced Glassmorphism */}
                <header className="h-24 bg-transparent flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
                    <div className="flex-1 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl p-4 shadow-sm flex items-center justify-between mx-2 md:mx-4 mt-4">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-slate-500 hover:text-red-600 md:hidden"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="relative w-full max-w-md hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users, logs, or models..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 text-sm outline-none transition-all bg-white/50 focus:bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="relative text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            </button>
                            <div className="h-8 w-[1px] bg-slate-200/50"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800">{user?.name || "Admin"}</p>
                                    <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Super Admin</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 text-red-700 border border-red-200 flex items-center justify-center font-bold shadow-sm cursor-pointer hover:ring-4 hover:ring-red-50 transition-all">
                                    {user?.name?.[0] || "A"}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">

                        {/* Welcome Section - Red Gradient */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-[2rem] p-6 md:p-10 shadow-xl shadow-red-500/20 text-white border border-white/20 group">
                            <div className="absolute top-0 right-0 -mt-20 -mr-20 opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-45 group-hover:scale-110">
                                <Shield size={400} />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                                    System Status: Optimal
                                </div>
                                <h1 className="text-2xl md:text-4xl font-black mb-3 text-white tracking-tight">Welcome back, Administrator</h1>
                                <p className="text-red-50 max-w-xl text-base md:text-lg font-medium opacity-90">
                                    You have 3 pending model reviews and 12 new user registrations today.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-4">
                                    <Link to="/admin/training" className="group relative overflow-hidden bg-white text-red-600 px-8 py-4 rounded-xl font-bold hover:bg-red-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                                        <span className="relative z-10">Train New Model</span>
                                    </Link>
                                    <button className="bg-black/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-black/30 transition-all">
                                        View System Logs
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: "Total Users", value: loading ? "..." : stats.totalUsers, change: "+12%", icon: Users, color: "red" },
                                { label: "Trained Models", value: loading ? "..." : stats.totalModels, change: "+3 New", icon: Brain, color: "orange" },
                                { label: "System Uptime", value: "99.9%", change: "Stable", icon: Activity, color: "emerald" }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white/70 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group hover:-translate-y-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                                            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
                                        </div>
                                        <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500 group-hover:rotate-12 transition-transform shadow-inner`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className={`text-${stat.color}-700 font-bold bg-${stat.color}-100 px-2 py-1 rounded-lg`}>
                                            {stat.change}
                                        </span>
                                        <span className="text-slate-400 ml-2 font-semibold text-xs">from last month</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Card 1 */}
                            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all">
                                <div className="p-8 border-b border-slate-100/50 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                        <div className="bg-red-50 p-2 rounded-lg text-red-500">
                                            <Camera className="h-5 w-5" />
                                        </div>
                                        Recent Training Activity
                                    </h3>
                                    <button className="text-sm text-red-500 font-bold hover:text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">View All</button>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-4">
                                        {loading ? (
                                            <p className="text-slate-500 text-sm font-medium">Loading activity...</p>
                                        ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
                                            stats.recentActivity.map((activity, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                    <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform shadow-sm">
                                                        <Brain size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">{activity.name}</h4>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            Created • {new Date(activity.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded-full shadow-sm">New</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                    <Activity size={24} />
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium">No recent activity found.</p>
                                            </div>
                                        )}
                                    </div>
                                    <Link to="/admin/training" className="mt-8 block w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm font-bold text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                        + Start New Training Session
                                    </Link>
                                </div>
                            </div>

                            {/* Card 2: Recent Users */}
                            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl transition-all">
                                <div className="p-8 border-b border-slate-100/50 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                        <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        Recent Users
                                    </h3>
                                    <button className="text-sm text-orange-500 font-bold hover:text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-lg transition-colors">View All</button>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-4">
                                        {loading ? (
                                            <p className="text-slate-500 text-sm font-medium">Loading users...</p>
                                        ) : stats.recentUsers && stats.recentUsers.length > 0 ? (
                                            stats.recentUsers.map((u, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                    <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-sm">
                                                        <span className="font-black text-sm">{u.username ? u.username[0].toUpperCase() : 'U'}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">{u.username || 'Unknown'}</h4>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{u.email}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full shadow-sm ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                    <Users size={24} />
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium">No users found.</p>
                                            </div>
                                        )}
                                    </div>
                                    <button className="mt-8 block w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-sm font-bold text-slate-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                                        View All Users
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
