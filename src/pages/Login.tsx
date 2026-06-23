import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan Password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Box size={28} />
          </div>
          <h1 className="auth-title">StockMate</h1>
          <p className="auth-subtitle">Kelola katalog aset pribadi Anda secara instan</p>
        </div>

        {error && (
          <div className="alert-message alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input-wrap">
              <Mail size={16} className="form-input-icon" />
              <input
                type="email"
                placeholder="nama@email.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <Lock size={16} className="form-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <LogIn size={18} />
            <span>{loading ? 'Masuk...' : 'Masuk ke Akun'}</span>
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" style={{ color: 'var(--text-secondary)' }}>Lupa Password?</Link>
          <span style={{ color: 'var(--text-tertiary)' }}>·</span>
          <Link to="/signup" className="auth-link">Daftar Akun Baru</Link>
        </div>
      </div>
    </div>
  );
}
