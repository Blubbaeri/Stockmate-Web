import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AssetCondition } from '../data/inventory';
import './AddEditAssetModal.css';

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DbLocation {
  id: string;
  name: string;
}

export interface DbItem {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  category_id: string | null;
  location_id: string | null;
  quantity: number;
  condition: string;
  purchase_price: number | null;
  purchase_date: string | null;
  image_url: string | null;
  created_at: string;
  category?: DbCategory | null;
  location?: DbLocation | null;
}

const INITIAL_FORM = {
  name: '',
  description: '',
  category_id: '',
  location_id: '',
  condition: 'Baik' as AssetCondition,
  purchase_price: '',
  purchase_date: '',
  image_url: '',
};

const formatNumberWithDots = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
};

interface AddEditAssetModalProps {
  item: DbItem | null;
  categories: DbCategory[];
  locations: DbLocation[];
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddEditAssetModal({
  item,
  categories,
  locations,
  userId,
  onClose,
  onSaved,
}: AddEditAssetModalProps) {
  const isEdit = !!item;
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Crop / File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        description: item.description || item.notes || '',
        category_id: item.category_id || '',
        location_id: item.location_id || '',
        condition: (item.condition as AssetCondition) || 'Baik',
        purchase_price: item.purchase_price ? formatNumberWithDots(String(item.purchase_price)) : '',
        purchase_date: item.purchase_date || '',
        image_url: item.image_url || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    // Reset file preview states on item load
    setSelectedFile(null);
    setPreviewUrl(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [item]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop / slide navigation for crop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Generate cropped image Blob using HTML5 Canvas
  const getCroppedBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = previewUrl || '';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 840;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 840, 700);

        const aspect = img.width / img.height;
        let drawW = 840;
        let drawH = 700;
        if (aspect > (420 / 350)) {
          drawW = 840;
          drawH = 840 / aspect;
        } else {
          drawH = 700;
          drawW = 700 * aspect;
        }

        ctx.translate(420 + offset.x * 2, 350 + offset.y * 2);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas conversion failed'));
          },
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');

    let finalImageUrl = form.image_url;

    // Handle Upload to Server if new file selected
    if (selectedFile && previewUrl) {
      try {
        const blob = await getCroppedBlob();
        
        // Clean item name for safe filename
        const safeItemName = form.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');
        
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const uniqueName = `${Date.now()}-${safeItemName}.${fileExt}`;

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'x-filename': uniqueName,
            'Content-Type': 'application/octet-stream',
          },
          body: blob,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json();
          throw new Error(errJson.error || 'Upload failed');
        }

        finalImageUrl = uniqueName;
      } catch (uploadErr: any) {
        console.error('Upload failed:', uploadErr);
        setError('Gagal memproses dan mengunggah gambar.');
        setSaving(false);
        return;
      }
    }

    const cleanPrice = form.purchase_price.replace(/\./g, '');
    
    // Auto-update condition from 'Baru' to 'Sangat Baik' if purchase date is > 3 months ago
    let finalCondition = form.condition;
    if (form.condition === 'Baru' && form.purchase_date) {
      const pDate = new Date(form.purchase_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (pDate < threeMonthsAgo) {
        finalCondition = 'Sangat Baik';
      }
    }

    const payload = {
      user_id: userId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      location_id: form.location_id || null,
      quantity: 1, // catalog is usually 1 qty per asset item
      condition: finalCondition,
      purchase_price: cleanPrice ? Number(cleanPrice) : null,
      purchase_date: form.purchase_date || null,
      image_url: finalImageUrl ? finalImageUrl.trim() : null,
    };

    try {
      // Check if item name already exists
      let checkQuery = supabase
        .from('sm_items')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', form.name.trim());

      if (isEdit && item) {
        checkQuery = checkQuery.neq('id', item.id);
      }

      const { data: existingItems, error: checkError } = await checkQuery;

      if (checkError) throw checkError;

      if (existingItems && existingItems.length > 0) {
        setError('Nama barang sudah terdaftar. Silakan gunakan nama lain.');
        setSaving(false);
        return;
      }

      if (isEdit && item) {
        const { user_id, ...updatePayload } = payload;
        const { error: err } = await supabase
          .from('sm_items')
          .update(updatePayload)
          .eq('id', item.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('sm_items').insert(payload);
        if (err) throw err;
      }
      onSaved();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="asset-modal-overlay" onClick={onClose}>
      <div className="asset-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="asset-modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="asset-modal-header">
          <h2 className="asset-modal-title">
            {isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}
          </h2>
          <p className="asset-modal-subtitle">
            Catat dan dokumentasikan barang pribadi Anda.
          </p>
        </div>

        {error && <div className="asset-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="asset-modal-form">
          <div className="asset-modal-scroll">
            {/* Name */}
            <div className="asset-field">
              <label className="asset-field-label">Nama Barang *</label>
              <input
                type="text"
                className="asset-field-input"
                placeholder="Contoh: Sony WH-1000XM4"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={saving}
                required
              />
            </div>

            {/* Foto Barang Input with Crop Preview */}
            <div className="asset-field">
              <label className="asset-field-label">Foto Barang</label>
              <input
                type="file"
                accept="image/*"
                className="asset-field-input"
                onChange={handleFileChange}
                disabled={saving}
                style={{ padding: '8px' }}
              />

              {previewUrl && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 420,
                      height: 350,
                      borderRadius: 12,
                      overflow: 'hidden',
                      position: 'relative',
                      border: '2px solid var(--border)',
                      cursor: 'move',
                      backgroundColor: '#f4f4f5',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                  >
                    <img
                      src={previewUrl}
                      alt="Crop preview"
                      style={{
                        position: 'absolute',
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: 'center',
                        maxWidth: 'none',
                        maxHeight: 'none',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 20,
                        border: '2px dashed rgba(255, 255, 255, 0.7)',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                        borderRadius: 8,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Zoom:</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    Geser foto dengan mouse/sentuhan & atur zoom untuk memotong
                  </span>
                </div>
              )}

              {!previewUrl && form.image_url && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={form.image_url.startsWith('http') ? form.image_url : `/uploads/${form.image_url}`}
                    alt="Current"
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {form.image_url} (Foto Saat Ini)
                  </span>
                </div>
              )}
            </div>

            {/* Category & Location */}
            <div className="asset-field-row">
              <div className="asset-field">
                <label className="asset-field-label">Kategori</label>
                <select
                  className="asset-field-input"
                  value={form.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  disabled={saving}
                >
                  <option value="">— Pilih Kategori —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="asset-field">
                <label className="asset-field-label">Lokasi Penyimpanan</label>
                <select
                  className="asset-field-input"
                  value={form.location_id}
                  onChange={(e) => handleChange('location_id', e.target.value)}
                  disabled={saving}
                >
                  <option value="">— Pilih Lokasi —</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition & Purchase Date */}
            <div className="asset-field-row">
              <div className="asset-field">
                <label className="asset-field-label">Kondisi</label>
                <select
                  className="asset-field-input"
                  value={form.condition}
                  onChange={(e) => handleChange('condition', e.target.value)}
                  disabled={saving}
                >
                  <option value="Baru">Baru</option>
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Cukup">Cukup</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>
              <div className="asset-field">
                <label className="asset-field-label">Tanggal Pembelian</label>
                <input
                  type="date"
                  className="asset-field-input"
                  value={form.purchase_date}
                  onChange={(e) => handleChange('purchase_date', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Price */}
            <div className="asset-field">
              <label className="asset-field-label">Harga Beli (Rp)</label>
              <input
                type="text"
                className="asset-field-input"
                placeholder="Contoh: 3.500.000"
                value={form.purchase_price}
                onChange={(e) => handleChange('purchase_price', formatNumberWithDots(e.target.value))}
                disabled={saving}
              />
            </div>

            {/* Notes */}
            <div className="asset-field">
              <label className="asset-field-label">Catatan / Keterangan</label>
              <textarea
                className="asset-field-textarea"
                placeholder="Catatan tambahan seperti garansi, nomor seri, dll..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="asset-modal-footer">
            <button
              type="submit"
              className="asset-modal-submit"
              disabled={saving}
            >
              <Save size={16} />
              <span>
                {saving
                  ? 'Menyimpan...'
                  : isEdit
                  ? 'Simpan Perubahan'
                  : 'Simpan Barang'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
