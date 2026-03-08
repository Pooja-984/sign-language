import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Languages, Menu, X, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleProtectedLink = (e, path) => {
        const protectedPaths = ['/sign-kit/learn-sign', '/sign-kit/convert', '/training', '/skills/test'];
        if (!isAuthenticated && protectedPaths.includes(path)) {
            e.preventDefault();
            if (location.pathname !== '/login') {
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        // Scroll handler
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        // Auth check
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        setIsAuthenticated(!!token);
        setUserRole(role);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [location]); // Re-check on route change to update auth state if needed

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        setUserRole(null);
        window.location.href = '/login';
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Learn Sign', path: '/sign-kit/learn-sign' },
        { name: 'Avatar Sign', path: '/sign-kit/convert' },

        // User requested "Traing model in user view" -> Adding Training link for everyone suitable
        { name: 'Training', path: '/training' },
    ];

    // Admin Dashboard Link - STRICTLY Admin Only
    if (userRole === 'admin') {
        navLinks.push({ name: 'Dashboard', path: '/admin/dashboard' });
    }

    const isActive = (path) => location.pathname === path;

    return (

        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed w-full z-50 top-0 left-0 transition-all duration-500 ease-in-out ${scrolled || location.pathname !== '/'
                ? 'bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20 py-2'
                : 'bg-transparent py-4'
                }`}
        >
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group relative z-50">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                            <div className="relative p-2.5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl group-hover:scale-105 transition-transform duration-300 border border-slate-700/50 shadow-lg">
                                <Languages className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
                            SignTrans
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center">
                        <div className="flex items-center p-1 md:p-1.5 bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-full shadow-inner mr-4 lg:mr-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={(e) => handleProtectedLink(e, link.path)}
                                    className={`relative px-3 lg:px-5 py-2 text-xs lg:text-sm font-semibold rounded-full transition-all duration-300 !no-underline whitespace-nowrap ${isActive(link.path)
                                        ? 'text-white shadow-md bg-red-600 shadow-red-500/30'
                                        : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        <Link
                            to="/skills/test"
                            onClick={(e) => handleProtectedLink(e, '/skills/test')}
                            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-bold text-slate-700 hover:text-red-600 transition-colors mr-3 lg:mr-6 group !no-underline whitespace-nowrap"
                        >
                            <div className="p-1 lg:p-1.5 rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                                <Zap className="h-3 w-3 lg:h-4 lg:w-4 text-amber-500 fill-current group-hover:scale-110 transition-transform" />
                            </div>
                            Sign Check
                        </Link>

                        <div className="h-8 w-px bg-slate-200 mx-4"></div>

                        {!isAuthenticated ? (
                            <div className="flex items-center gap-2 lg:gap-4">
                                <Link to="/login" className="px-2 lg:px-4 py-2 text-slate-600 hover:text-red-600 text-xs lg:text-sm font-bold transition-colors !no-underline whitespace-nowrap">
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="group relative inline-flex items-center justify-center px-4 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-white transition-all duration-300 bg-red-600 rounded-full shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden !no-underline whitespace-nowrap"
                                >
                                    <span className="relative">Get Started</span>
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 text-red-500 hover:text-white hover:bg-red-500 text-sm font-bold rounded-full transition-all duration-300 border border-red-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
                            >
                                Sign Out
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative p-2 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className="md:hidden overflow-hidden border-t border-slate-100 bg-white/95 backdrop-blur-2xl shadow-xl"
                    >
                        <div className="p-4 space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={(e) => {
                                        handleProtectedLink(e, link.path);
                                        setIsOpen(false);
                                    }}
                                    className={`block px-5 py-4 rounded-xl text-base font-medium transition-all !no-underline ${isActive(link.path)
                                        ? 'bg-red-50 text-red-600 shadow-sm border border-red-100'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-slate-100 my-4 mx-2"></div>
                            <Link
                                to="/skills/test"
                                onClick={(e) => {
                                    handleProtectedLink(e, '/skills/test');
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 px-5 py-4 rounded-xl text-base font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-all !no-underline"
                            >
                                <Zap className="h-5 w-5 text-amber-500 fill-current" />
                                Sign Check
                            </Link>

                            <div className="pt-4 grid grid-cols-2 gap-3">
                                {!isAuthenticated ? (
                                    <>
                                        <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center px-4 py-3 text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors !no-underline">
                                            Sign In
                                        </Link>
                                        <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center justify-center px-4 py-3 text-white font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 rounded-xl transition-all !no-underline">
                                            Get Started
                                        </Link>
                                    </>
                                ) : (
                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="col-span-2 flex items-center justify-center px-4 py-3 text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                                        Sign Out
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
