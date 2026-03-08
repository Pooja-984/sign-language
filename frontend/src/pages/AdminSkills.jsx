import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Brain, Users, Settings, LogOut, Shield,
    Trash2, Edit2, Search, Plus, ExternalLink, Image as ImageIcon, ChevronRight, Bell, Menu, X
} from 'lucide-react';
import { baseURL } from '../Config/config';

const AdminSkills = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [user, setUser] = useState({ role: 'admin', name: "Administrator" });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sidebar Items
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Brain, label: 'Model Training', path: '/admin/training' },
        { icon: Users, label: 'Skill Management', path: '/admin/skills' },
    ];

    useEffect(() => {
        fetchSkills();
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/admin/login');
        }
    }, [navigate]);

    const fetchSkills = async () => {
        try {
            const res = await fetch(`${baseURL}/skills`);
            const data = await res.json();
            setSkills(data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this skill set? This cannot be undone.")) return;

        try {
            const res = await fetch(`${baseURL}/skills/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSkills(skills.filter(s => s._id !== id));
            } else {
                alert("Failed to delete skill.");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting skill.");
        }
    };

    const handleEdit = async (skill) => {
        const newName = prompt("Enter new name for this skill set:", skill.name);
        if (!newName || newName === skill.name) return;

        try {
            const res = await fetch(`${baseURL}/skills/${skill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const updatedSkill = await res.json();
                setSkills(skills.map(s => s._id === skill._id ? updatedSkill : s));
            } else {
                alert("Failed to update name.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating skill.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-slate-50 relative">
            {/* Animated Background Blobs */}
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden h-full bg-transparent z-10">
                {/* Header - Enhanced Glassmorphism */}
                <header className="h-20 bg-transparent flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
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
                                    placeholder="Search skills, users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-screen-2xl mx-auto w-full pb-12">

                        {/* Actions Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Skill Library</h2>
                                <span className="text-slate-400 text-xs md:text-sm font-medium">{skills.length} skills total</span>
                            </div>
                            <Link to="/admin/training" className="group relative overflow-hidden bg-white text-red-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Train New Skill
                            </Link>
                        </div>

                        {/* Grid */}
                        {isLoading ? (
                            <div className="text-center py-20 text-slate-400 font-medium">Loading skills...</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredSkills.map((skill) => (
                                    <div key={skill._id} className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group hover:-translate-y-1">
                                        <div className="h-48 bg-slate-100 relative overflow-hidden group-hover:bg-slate-50 transition-colors">
                                            {skill.thumbnail ? (
                                                <img src={skill.thumbnail} alt={skill.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                                    <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
                                                    <span className="text-xs font-medium uppercase tracking-widest opacity-70">No Thumbnail</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <button onClick={() => handleEdit(skill)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-red-500 shadow-sm hover:shadow-md transition-all" title="Edit Name">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-slate-800 text-lg truncate flex-1 group-hover:text-red-600 transition-colors" title={skill.name}>{skill.name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-medium">
                                                <span className="bg-white/50 px-2 py-1 rounded-md border border-slate-200">{skill.references.length} gestures</span>
                                                <span>•</span>
                                                <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            <div className="flex gap-2 pt-4 border-t border-slate-100/50">
                                                <button
                                                    onClick={() => handleDelete(skill._id)}
                                                    className="flex-1 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </button>
                                                <div className="w-[1px] bg-slate-100"></div>
                                                <a
                                                    href="/skills/test"
                                                    target="_blank"
                                                    className="flex-1 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    Test <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoading && filteredSkills.length === 0 && (
                            <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl border border-dashed border-slate-200">
                                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Brain className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-bold text-2xl mb-2">No Skills Found</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">It looks like the library is empty. Start by training your first gesture recognition model.</p>
                                <Link to="/admin/training" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg hover:shadow-red-500/30 hover:-translate-y-1">
                                    <Plus className="h-5 w-5" /> Create First Skill
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSkills;
