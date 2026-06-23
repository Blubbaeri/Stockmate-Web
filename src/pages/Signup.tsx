import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Harap isi semua kolom input.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi, lalu masuk.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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
          <p className="auth-subtitle">Daftarkan akun untuk mengelola katalog aset pribadi Anda</p>
        </div>

        {error && (
          <div className="alert-message alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-message alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSignup}>
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
                placeholder="Minimal 6 karakter"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <div className="form-input-wrap">
              <Lock size={16} className="form-input-icon" />
              <input
                type="password"
                placeholder="Ulangi password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <UserPlus size={18} />
            <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
          </button>
        </form>

        <div className="auth-links text-center" style={{ justifyContent: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sudah punya akun?</span>
          <Link to="/login" className="auth-link">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
