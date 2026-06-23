import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Mail, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Harap isi alamat email Anda.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Tautan reset password telah dikirim ke email Anda. Silakan periksa folder masuk.');
        setEmail('');
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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Masukkan email Anda untuk menerima tautan pemulihan</p>
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

        <form onSubmit={handleResetRequest}>
          <div className="form-group">
            <label className="form-label">Email Pemulihan</label>
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

          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={16} />
            <span>{loading ? 'Mengirim...' : 'Kirim Tautan Reset'}</span>
          </button>
        </form>

        <div className="auth-links text-center" style={{ justifyContent: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Sudah ingat password?</span>
          <Link to="/login" className="auth-link">Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}
