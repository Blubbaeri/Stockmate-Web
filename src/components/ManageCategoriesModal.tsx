import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit3, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CategoryIconMap, CategoryIconList } from '../data/inventory';
import './ManageCategoriesModal.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ManageCategoriesModalProps {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}

const COLOR_PRESETS = [
  { name: 'Biru', value: '#3b82f6' },
  { name: 'Ungu', value: '#8b5cf6' },
  { name: 'Hijau', value: '#10b981' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Kuning', value: '#f59e0b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Abu-abu', value: '#6b7280' },
  { name: 'Merah', value: '#ef4444' },
  { name: 'Oranye', value: '#f97316' },
];

export default function ManageCategoriesModal({
  userId,
  onClose,
  onChanged,
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Package');
  const [color, setColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const { data, error: err } = await supabase
        .from('sm_categories')
        .select('id, name, icon, color')
        .eq('user_id', userId)
        .order('name');
      if (err) throw err;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    const payload = {
      name: name.trim(),
      icon: icon || 'Package',
      color: color,
      user_id: userId,
    };

    try {
      if (editingId) {
        const { error: err } = await supabase
          .from('sm_categories')
          .update(payload)
          .eq('id', editingId);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('sm_categories').insert(payload);
        if (err) throw err;
      }

      handleCancel();
      await fetchCategories();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon || 'Package');
    setColor(cat.color);
    setShowIconDropdown(false);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Yakin ingin menghapus kategori ini? Barang dengan kategori ini akan diset tanpa kategori.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('sm_categories')
        .delete()
        .eq('id', id);
      if (err) throw err;
      await fetchCategories();
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kategori.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setIcon('Package');
    setColor('#3b82f6');
    setError('');
    setShowIconDropdown(false);
    setView('list');
  };

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setIcon('Package');
    setColor('#3b82f6');
    setError('');
    setShowIconDropdown(false);
    setView('form');
  };

  const renderIconElement = (iconName: string, size = 16, colorStr?: string) => {
    const IconComponent = CategoryIconMap[iconName] || CategoryIconMap['Package'];
    return <IconComponent size={size} color={colorStr} style={{ verticalAlign: 'middle' }} />;
  };

  return createPortal(
    <div className="manage-modal-overlay" onClick={onClose}>
      <div className="manage-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="manage-modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="manage-modal-header">
          <h2 className="manage-modal-title">
            {view === 'form' ? 'Form Tambah/Edit Kategori' : 'Kelola Kategori'}
          </h2>
          <p className="manage-modal-subtitle">
            {view === 'form'
              ? 'Tentukan nama, icon modern, dan warna untuk kategori barang Anda.'
              : 'Atur kategori untuk pengelompokan katalog aset pribadi Anda.'}
          </p>
        </div>

        {error && (
          <div className="asset-modal-error" style={{ margin: '12px 24px 0 24px' }}>
            {error}
          </div>
        )}

        <div className="manage-modal-body">
          {view === 'list' ? (
            <>
              {/* Add category button at top */}
              <button
                className="manage-btn"
                onClick={openAddForm}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
              >
                <Plus size={16} /> Tambah Kategori
              </button>

              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  margin: '8px 0 16px 0',
                }}
              />

              {/* Categories list */}
              <div className="manage-list">
                {categories.length === 0 ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-tertiary)',
                      textAlign: 'center',
                      margin: '20px 0',
                    }}
                  >
                    Belum ada kategori kustom.
                  </p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="manage-item">
                      <div className="manage-item-info">
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {renderIconElement(cat.icon, 18, cat.color)}
                        </span>
                        <span className="manage-item-name" style={{ marginLeft: 8 }}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="manage-item-actions">
                        <button
                          className="manage-action-btn"
                          onClick={() => handleEdit(cat)}
                          title="Edit Kategori"
                          disabled={loading}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="manage-action-btn delete"
                          onClick={() => handleDelete(cat.id)}
                          title="Hapus Kategori"
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  margin: '16px 0 8px 0',
                }}
              />

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
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Nama Kategori */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Nama Kategori
                </label>
                <input
                  type="text"
                  className="manage-input"
                  placeholder="Contoh: Elektronik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Icon Dropdown Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Icon Kategori
                </label>
                
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {renderIconElement(icon, 16, color)}
                    <span>{CategoryIconList.find(c => c.name === icon)?.label || 'Pilih Icon'}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {showIconDropdown ? '▲' : '▼'}
                  </span>
                </button>

                {/* Dropdown Options List */}
                {showIconDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '64px',
                    left: 0,
                    right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    zIndex: 2000,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '4px 0'
                  }}>
                    {CategoryIconList.map((item) => {
                      const isSelected = icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setIcon(item.name);
                            setShowIconDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: isSelected ? `${color}15` : 'transparent',
                            color: isSelected ? color : 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '13px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--background)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {renderIconElement(item.name, 16, isSelected ? color : 'var(--text-secondary)')}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Warna Preset Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Warna Kategori
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 8, 
                  padding: 10, 
                  border: '1px solid var(--border)', 
                  borderRadius: 8,
                  background: 'var(--background)' 
                }}>
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = color === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setColor(preset.value)}
                        disabled={loading}
                        title={preset.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          borderRadius: '50%',
                          border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                          backgroundColor: preset.value,
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.15)' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
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
                <button
                  type="submit"
                  className="manage-btn"
                  disabled={loading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
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
