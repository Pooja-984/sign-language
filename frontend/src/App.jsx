import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';

import Tutorials from './components/Tutorials';
import Training from './components/Training';
import Footer from './components/Footer';
import Home from './pages/Home';
import Convert from './pages/Convert';
import LearnSign from './pages/LearnSign';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminTraining from './pages/AdminTraining';
import AdminSkills from './pages/AdminSkills';
import TestSkills from './pages/TestAllSkills';

import { GestureContextProvider } from './context/GestureContext';

// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== 'admin') {
    // Redirect to Admin Login if not authorized
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Protected Route Component for User (Redirects Admin to Dashboard)
const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Component to Redirect Admin from Public Routes (Home, etc.)
const RedirectAdmin = ({ children }) => {
  const role = localStorage.getItem('role');

  if (role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Global Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {!isAdminRoute && <Navbar />}

      {/* Remove padding-top for admin routes to allow full screen control */}
      <main className={`flex-grow ${isAdminRoute ? '' : 'pt-16'} relative z-0`}>
        <Routes>
          <Route path="/" element={<RedirectAdmin><Home /></RedirectAdmin>} />

          <Route path="/tutorials" element={<ProtectedUserRoute><Tutorials /></ProtectedUserRoute>} />
          <Route path="/training" element={<ProtectedUserRoute><Training /></ProtectedUserRoute>} />
          <Route path="/sign-kit/convert" element={<ProtectedUserRoute><Convert /></ProtectedUserRoute>} />
          <Route path="/sign-kit/learn-sign" element={<ProtectedUserRoute><LearnSign /></ProtectedUserRoute>} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Login - Publicly Accessible */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/training"
            element={
              <ProtectedAdminRoute>
                <AdminTraining />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <ProtectedAdminRoute>
                <AdminSkills />
              </ProtectedAdminRoute>
            }
          />

          <Route path="/skills/test" element={<ProtectedUserRoute><TestSkills /></ProtectedUserRoute>} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <GestureContextProvider>
      <Router>
        <AppContent />
      </Router>
    </GestureContextProvider>
  );
}

export default App;
