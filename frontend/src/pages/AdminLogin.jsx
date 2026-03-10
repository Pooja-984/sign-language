import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

import { baseURL } from '../Config/config';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${baseURL}/auth/login`, formData);

            if (res.data.user.role !== 'admin') {
                setError('Access Denied: You do not have admin privileges.');
                setLoading(false);
                return;
            }

            console.log('Admin Login Success:', res.data);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-sans">
            {/* Removed Animated Background Blobs */}

            <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-white/50 relative z-10 transition-all hover:shadow-[0_8px_30px_rgb(239,68,68,0.1)]">
                <div className="bg-gradient-to-br from-red-600 to-red-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400 opacity-20 rounded-full -ml-8 -mb-8 blur-lg"></div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-1">Admin Portal</h2>
                        <p className="text-red-100 text-sm font-medium tracking-wide">Restricted Access System</p>
                    </div>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl animate-pulse shadow-sm flex items-center gap-2">
                            <Lock className="h-4 w-4" /> {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Admin Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white/50 focus:bg-white outline-none"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all bg-white/50 focus:bg-white outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center py-4 px-4 rounded-xl text-white font-bold text-lg shadow-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-all duration-300 group-hover:bg-gradient-to-br"></div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent transition-opacity duration-500"></div>

                            <span className="relative flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" /> Verifying...
                                    </>
                                ) : (
                                    <>
                                        Access Dashboard <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1 group">
                            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Return to User Login
                        </Link>
                    </div>
                </div>
            </div>

            {/* Version Footer */}
            <div className="absolute bottom-6 text-slate-400 text-xs font-bold tracking-widest uppercase opacity-60">
                SignTrans Admin v1.2.0
            </div>
        </div>
    );
};

export default AdminLogin;
