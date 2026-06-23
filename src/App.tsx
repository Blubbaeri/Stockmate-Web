import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import './App.css';

// Layout shell
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Core Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Explore from './pages/Explore';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if session has expired (1 hour limit)
    const expiry = localStorage.getItem('session_expiry');
    if (expiry && Date.now() > Number(expiry)) {
      supabase.auth.signOut();
      localStorage.removeItem('session_expiry');
      setSession(null);
      setCheckingAuth(false);
      return;
    }

    // Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (!localStorage.getItem('session_expiry')) {
          localStorage.setItem('session_expiry', String(Date.now() + 60 * 60 * 1000));
        }
      } else {
        localStorage.removeItem('session_expiry');
      }
      setSession(session);
      setCheckingAuth(false);
    });

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (event === 'SIGNED_IN') {
          localStorage.setItem('session_expiry', String(Date.now() + 60 * 60 * 1000));
        } else {
          const expiryTime = localStorage.getItem('session_expiry');
          if (expiryTime && Date.now() > Number(expiryTime)) {
            supabase.auth.signOut();
            localStorage.removeItem('session_expiry');
            setSession(null);
            return;
          }
        }
      } else {
        localStorage.removeItem('session_expiry');
      }
      setSession(session);
      setCheckingAuth(false);
    });

    // Periodically check if session is expired (every 10 seconds)
    const interval = setInterval(() => {
      const expiryTime = localStorage.getItem('session_expiry');
      if (expiryTime && Date.now() > Number(expiryTime)) {
        supabase.auth.signOut();
        localStorage.removeItem('session_expiry');
        setSession(null);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <span className="loading-text">Menghubungkan ke StockMate...</span>
      </div>
    );
  }

  const user = session?.user;

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (Only accessible if NOT logged in) */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/forgot-password" 
          element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />

        {/* Protected routes (Only accessible if logged in) */}
        <Route 
          path="/" 
          element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="explore" element={<Explore />} />
        </Route>

        {/* Catch-all redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
