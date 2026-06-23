import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Lock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Harap isi semua kolom password.');
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
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Password Anda berhasil diubah! Mengarahkan Anda ke Dashboard...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
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
          <h1 className="auth-title">Password Baru</h1>
          <p className="auth-subtitle">Masukkan password baru Anda untuk memulihkan akun</p>
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

        <form onSubmit={handleUpdatePassword}>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
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
            <label className="form-label">Ulangi Password Baru</label>
            <div className="form-input-wrap">
              <Lock size={16} className="form-input-icon" />
              <input
                type="password"
                placeholder="Konfirmasi password baru"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <RefreshCw size={16} />
            <span>{loading ? 'Mengubah...' : 'Ubah Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
