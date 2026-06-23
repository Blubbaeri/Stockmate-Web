import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit3, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ManageCategoriesModal.css'; // Re-use styling

interface Location {
  id: string;
  name: string;
}

interface ManageLocationsModalProps {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function ManageLocationsModal({
  userId,
  onClose,
  onChanged,
}: ManageLocationsModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  // Form states
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLocations = async () => {
    try {
      const { data, error: err } = await supabase
        .from('sm_locations')
        .select('id, name')
        .eq('user_id', userId)
        .order('name');
      if (err) throw err;
      setLocations(data || []);
    } catch (err: any) {
      console.error('Fetch locations error:', err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    const payload = {
      name: name.trim(),
      user_id: userId,
    };

    try {
      if (editingId) {
        const { error: err } = await supabase
          .from('sm_locations')
          .update(payload)
          .eq('id', editingId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('sm_locations').insert(payload);
        if (err) throw err;
      }

      handleCancel();
      await fetchLocations();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan lokasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setName(loc.name);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus lokasi ini? Barang di lokasi ini akan diset tanpa lokasi.')) {
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.from('sm_locations').delete().eq('id', id);
      if (err) throw err;
      await fetchLocations();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus lokasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setError('');
    setView('list');
  };

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setError('');
    setView('form');
  };

  return createPortal(
    <div className="manage-modal-overlay" onClick={onClose}>
      <div className="manage-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="manage-modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="manage-modal-header">
          <h2 className="manage-modal-title">
            {view === 'form' ? 'Form Tambah/Edit Lokasi' : 'Kelola Lokasi'}
          </h2>
          <p className="manage-modal-subtitle">
            {view === 'form'
              ? 'Tentukan nama lokasi penyimpanan baru untuk aset Anda.'
              : 'Atur lokasi penyimpanan aset pribadi Anda.'}
          </p>
        </div>

        {error && <div className="asset-modal-error" style={{ margin: '12px 24px 0 24px' }}>{error}</div>}

        <div className="manage-modal-body">
          {view === 'list' ? (
            <>
              {/* Add location button at top */}
              <button
                className="manage-btn"
                onClick={openAddForm}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
              >
                <Plus size={16} /> Tambah Lokasi
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0 16px 0' }} />

              {/* Locations list */}
              <div className="manage-list">
                {locations.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', margin: '20px 0' }}>
                    Belum ada lokasi penyimpanan kustom.
                  </p>
                ) : (
                  locations.map((loc) => (
                    <div key={loc.id} className="manage-item">
                      <div className="manage-item-info">
                        <span className="manage-item-name">{loc.name}</span>
                      </div>
                      <div className="manage-item-actions">
                        <button
                          className="manage-action-btn"
                          onClick={() => handleEdit(loc)}
                          title="Edit Lokasi"
                          disabled={loading}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="manage-action-btn delete"
                          onClick={() => handleDelete(loc.id)}
                          title="Hapus Lokasi"
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0 8px 0' }} />

              {/* Close button at bottom */}
              <button
                className="manage-btn manage-btn-cancel"
                onClick={onClose}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Tutup
              </button>
            </>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nama Lokasi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Nama Lokasi</label>
                <input
                  type="text"
                  className="manage-input"
                  placeholder="Contoh: Kamar Utama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="manage-btn manage-btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Batal
                </button>
                <button type="submit" className="manage-btn" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  <Save size={14} /> Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
