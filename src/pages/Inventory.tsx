// ─────────────────────────────────────────────
//  StockMate Web — Personal Asset Catalog
// ─────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Plus, Trash2, Edit3, Save, Package, Calendar, Image as ImageIcon, Sparkles, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createPortal } from 'react-dom';
import { 
  formatCurrency, 
  getConditionMeta, 
  getCategoryMeta, 
  PersonalAssetType, 
  AssetCondition,
  CategoryIconMap
} from '../data/inventory';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import EmptyState from '../components/EmptyState';
import AddEditAssetModal from '../components/AddEditAssetModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import ManageLocationsModal from '../components/ManageLocationsModal';

// ─── Types (from Supabase schema mapping) ──────────────────

interface DbCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface DbLocation {
  id: string;
  name: string;
}

interface DbItem {
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
  // Joined
  category?: DbCategory | null;
  location?: DbLocation | null;
}

// ─── Main Component ────────────────────────────────────────

const getImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `/uploads/${url}`;
};

const renderCategoryIcon = (iconName: string | null | undefined, size = 16, color?: string) => {
  const IconComponent = CategoryIconMap[iconName || 'Package'] || CategoryIconMap['Package'];
  return <IconComponent size={size} color={color} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data from Supabase
  const [items, setItems] = useState<DbItem[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [locations, setLocations] = useState<DbLocation[]>([]);

  // Modals
  const [selectedItem, setSelectedItem] = useState<DbItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DbItem | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showManageLocations, setShowManageLocations] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filtering/searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  // ── Fetch Data ───────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [catsRes, locsRes, itemsRes] = await Promise.all([
        supabase.from('sm_categories').select('id, name, icon, color').eq('user_id', user.id).order('name'),
        supabase.from('sm_locations').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('sm_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      const allCats = catsRes.data || [];
      const allLocs = locsRes.data || [];
      const allItems = itemsRes.data || [];

      // Auto-update condition from 'Baru' to 'Sangat Baik' if purchase date is > 3 months ago
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const itemsToUpdate = allItems.filter(item => 
        item.condition === 'Baru' && 
        item.purchase_date && 
        new Date(item.purchase_date) < threeMonthsAgo
      );

      if (itemsToUpdate.length > 0) {
        try {
          await Promise.all(itemsToUpdate.map(item => 
            supabase
              .from('sm_items')
              .update({ condition: 'Sangat Baik' })
              .eq('id', item.id)
          ));
          // Update locally
          allItems.forEach(item => {
            if (item.condition === 'Baru' && item.purchase_date && new Date(item.purchase_date) < threeMonthsAgo) {
              item.condition = 'Sangat Baik';
            }
          });
        } catch (err) {
          console.error('Error auto-updating item conditions:', err);
        }
      }

      setCategories(allCats);
      setLocations(allLocs);

      // Join
      const catMap = new Map(allCats.map(c => [c.id, c]));
      const locMap = new Map(allLocs.map(l => [l.id, l]));

      const joined: DbItem[] = allItems.map(item => ({
        ...item,
        category: item.category_id ? catMap.get(item.category_id) || null : null,
        location: item.location_id ? locMap.get(item.location_id) || null : null,
      }));

      setItems(joined);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categoryChips = useMemo(() => {
    const chips: any[] = [{ id: 'all', label: `Semua (${items.length})`, icon: null }];
    categories.forEach(cat => {
      const count = items.filter(i => i.category_id === cat.id).length;
      chips.push({ id: cat.id, label: `${cat.name} (${count})`, icon: renderCategoryIcon(cat.icon, 14, cat.color) });
    });
    if (items.some(i => !i.category_id)) {
      const noneCount = items.filter(i => !i.category_id).length;
      chips.push({ id: 'none', label: `Tanpa Kategori (${noneCount})`, icon: renderCategoryIcon('Package', 14) });
    }
    return chips;
  }, [categories, items]);

  // ── Filtering ────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || (item.description || '').toLowerCase().includes(q)
        || (item.category?.name || '').toLowerCase().includes(q);

      let matchCategory = true;
      if (activeCategory === 'none') {
        matchCategory = !item.category_id;
      } else if (activeCategory !== 'all') {
        matchCategory = item.category_id === activeCategory;
      }

      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, activeCategory]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  // ── Asset Stats ──────────────────────────────────────────

  const stats = useMemo(() => {
    const total = items.length;
    // Total Unique Categories present in items
    const usedCategories = new Set(items.map(i => i.category_id).filter(Boolean));
    const totalCategories = usedCategories.size;

    // Total Value (sum of purchase_price * quantity, or just purchase_price)
    const totalValue = items.reduce((sum, i) => sum + ((Number(i.purchase_price) || 0) * (i.quantity || 1)), 0);

    // Find item with purchase_date closest to today
    let latestAsset = '-';
    const itemsWithDate = items.filter((i) => i.purchase_date);
    if (itemsWithDate.length > 0) {
      const today = new Date().getTime();
      let closestItem = itemsWithDate[0];
      let minDiff = Math.abs(new Date(closestItem.purchase_date!).getTime() - today);

      for (let i = 1; i < itemsWithDate.length; i++) {
        const itemDate = new Date(itemsWithDate[i].purchase_date!).getTime();
        const diff = Math.abs(itemDate - today);
        if (diff < minDiff) {
          minDiff = diff;
          closestItem = itemsWithDate[i];
        }
      }
      latestAsset = closestItem.name;
    } else if (items.length > 0) {
      latestAsset = items[0].name;
    }

    return { total, totalCategories, totalValue, latestAsset };
  }, [items]);

  // ── Delete ───────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus aset ini dari katalog Anda?')) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('sm_items').delete().eq('id', id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Gagal menghapus aset.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <span className="loading-text">Memuat katalog aset pribadi...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Header */}
      <Header
        title="Koleksi Saya"
        subtitle={`${items.length} barang tercatat`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={true}
      />

      {/* Summary Cards */}
      <div className="summary-cards-row">
        <div className="summary-card animate-spring">
          <div className="summary-icon-wrap" style={{ backgroundColor: 'var(--accent-light)' }}>
            <Package size={18} color="var(--accent)" />
          </div>
          <div className="summary-value" style={{ color: 'var(--accent)' }}>{stats.total}</div>
          <div className="summary-label">Total Barang</div>
        </div>

        <div className="summary-card animate-spring">
          <div className="summary-icon-wrap" style={{ backgroundColor: '#f5f3ff' }}>
            <Sparkles size={18} color="#8b5cf6" />
          </div>
          <div className="summary-value" style={{ color: '#8b5cf6' }}>{stats.totalCategories}</div>
          <div className="summary-label">Total Kategori</div>
        </div>

        <div className="summary-card animate-spring">
          <div className="summary-icon-wrap" style={{ backgroundColor: 'var(--in-stock-bg)' }}>
            <span style={{ fontWeight: 800, color: 'var(--in-stock)' }}>Rp</span>
          </div>
          <div className="summary-value" style={{ color: 'var(--in-stock)', fontSize: 16 }}>{formatCurrency(stats.totalValue)}</div>
          <div className="summary-label">Total Nilai Aset</div>
        </div>

        <div className="summary-card animate-spring">
          <div className="summary-icon-wrap" style={{ backgroundColor: '#fff7ed' }}>
            <Calendar size={18} color="#f97316" />
          </div>
          <div className="summary-value" style={{ color: '#f97316', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 8px' }}>
            {stats.latestAsset}
          </div>
          <div className="summary-label">Barang Terbaru</div>
        </div>
      </div>

      {/* Filter / Actions row */}
      <div className="filter-actions-row">
        <div style={{ flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <CategoryFilter categories={categoryChips} selected={activeCategory} onSelect={setActiveCategory} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0, position: 'relative', alignItems: 'center' }}>
          {/* Dropdown Gear Trigger */}
          <button
            className="btn-primary"
            style={{ width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', marginTop: 0 }}
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
          >
            <Settings size={18} />
          </button>

          {showSettingsDropdown && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              background: 'var(--surface, #fff)',
              border: '1px solid var(--border, #e5e5ea)',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '170px',
              padding: '6px 0',
            }}>
              <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border)' }}>
                <Settings size={12} /> Pengaturan Data
              </div>
              <button
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => { setShowManageCategories(true); setShowSettingsDropdown(false); }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background, #f2f2f7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Kelola Kategori
              </button>
              <button
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => { setShowManageLocations(true); setShowSettingsDropdown(false); }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--background, #f2f2f7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Kelola Lokasi
              </button>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: 'auto', marginTop: 0, padding: '8px 16px', height: 38, whiteSpace: 'nowrap' }}
            onClick={() => { setEditingItem(null); setShowAddModal(true); }}
          >
            <Plus size={16} />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="section-header" style={{ marginBottom: 16 }}>
        <h3 className="section-title" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-secondary)' }}>
          {activeCategory === 'all' ? 'Semua Barang' : 'Hasil Filter'}
        </h3>
        <span className="section-count">{filteredItems.length} item</span>
      </div>

      {filteredItems.length === 0 ? (
        searchQuery ? (
          <EmptyState query={searchQuery} />
        ) : (
          <div className="empty-state-card animate-spring">
            <div className="empty-icon-wrap">
              <Package size={40} />
            </div>
            <h3 className="empty-title">Koleksi Kosong</h3>
            <p className="empty-desc">
              Mulai masukkan barang berharga atau barang pribadi Anda dengan tombol <strong>"+ Tambah Barang"</strong>.
            </p>
          </div>
        )
      ) : (
        <div>
          <div className="inventory-list">
            {paginatedItems.map((item) => {
              const condMeta = getConditionMeta(item.condition as AssetCondition);
              const catMeta = getCategoryMeta(item.category?.name || '');
              return (
                <div 
                  key={item.id} 
                  className="inventory-item-card animate-fade"
                  style={{ opacity: deleting === item.id ? 0.5 : 1, cursor: 'pointer', display: 'flex', gap: 12 }}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Thumbnail */}
                  <div 
                    className="item-icon-container"
                    style={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 'var(--radius-md)', 
                      overflow: 'hidden', 
                      flexShrink: 0,
                      backgroundColor: item.image_url ? 'transparent' : catMeta.bg,
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    {item.image_url ? (
                      <img src={getImageUrl(item.image_url)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      renderCategoryIcon(item.category?.icon, 24, item.category?.color)
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                          {item.name}
                        </h4>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button 
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--background)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                            aria-label="Edit barang"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--out-of-stock-bg)',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              color: 'var(--out-of-stock)',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => handleDelete(item.id)}
                            aria-label="Hapus barang"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.category?.name || 'Lainnya'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span className="item-badge" style={{ backgroundColor: condMeta.bg, color: condMeta.color, fontSize: 10, padding: '2px 6px' }}>
                        {condMeta.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.purchase_price ? formatCurrency(Number(item.purchase_price)) : 'Rp0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 16, 
              marginTop: 24, 
              padding: '12px 0' 
            }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  border: '1px solid var(--border)', 
                  borderRadius: '50%', 
                  background: currentPage === 1 ? 'var(--background)' : 'var(--surface-secondary)', 
                  color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span style={{ 
                fontSize: 13, 
                color: 'var(--text-secondary)', 
                fontWeight: 600,
                background: 'var(--surface-secondary)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border)'
              }}>
                {currentPage} / {totalPages}
              </span>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  border: '1px solid var(--border)', 
                  borderRadius: '50%', 
                  background: currentPage === totalPages ? 'var(--background)' : 'var(--surface-secondary)', 
                  color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
                aria-label="Halaman selanjutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal (Personal Asset) ────────────────── */}
      {selectedItem && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
            <button className="modal-close-btn" style={{ zIndex: 10, background: 'rgba(255,255,255,0.8)', borderRadius: '50%' }} onClick={() => setSelectedItem(null)}>
              &times;
            </button>

             {/* Big Image/Banner */}
            <div style={{ width: '100%', height: 240, backgroundColor: 'var(--background)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-color)' }}>
              {selectedItem.image_url ? (
                <img src={getImageUrl(selectedItem.image_url)} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {renderCategoryIcon(selectedItem.category?.icon, 72, selectedItem.category?.color || 'var(--text-tertiary)')}
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>Tidak ada foto</p>
                </div>
              )}
            </div>

            <div style={{ padding: 24 }}>
              {/* Header inside details */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedItem.name}</h2>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className="item-badge" style={{ backgroundColor: (selectedItem.category?.color || '#6366f1') + '18', color: selectedItem.category?.color || '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {renderCategoryIcon(selectedItem.category?.icon, 12, selectedItem.category?.color || '#6366f1')} {selectedItem.category?.name || 'Lainnya'}
                  </span>
                  <span className="item-badge" style={{ backgroundColor: getConditionMeta(selectedItem.condition as AssetCondition).bg, color: getConditionMeta(selectedItem.condition as AssetCondition).color }}>
                    {getConditionMeta(selectedItem.condition as AssetCondition).label}
                  </span>
                </div>
              </div>

              {/* Grid Information */}
              <div className="modal-info-grid" style={{ marginBottom: 20 }}>
                <div className="info-grid-item">
                  <span className="info-grid-label">Harga Beli</span>
                  <span className="info-grid-value" style={{ fontWeight: 700 }}>
                    {selectedItem.purchase_price ? formatCurrency(Number(selectedItem.purchase_price)) : '-'}
                  </span>
                </div>
                <div className="info-grid-item">
                  <span className="info-grid-label">Lokasi Penyimpanan</span>
                  <span className="info-grid-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="var(--text-tertiary)" />
                    {selectedItem.location?.name || 'Belum ditentukan'}
                  </span>
                </div>
                <div className="info-grid-item">
                  <span className="info-grid-label">Tanggal Pembelian</span>
                  <span className="info-grid-value">
                    {selectedItem.purchase_date ? new Date(selectedItem.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className="info-grid-item">
                  <span className="info-grid-label">Terdaftar</span>
                  <span className="info-grid-value">
                    {new Date(selectedItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {(selectedItem.description || selectedItem.notes) && (
                <div className="modal-desc-wrap" style={{ marginBottom: 24 }}>
                  <span className="modal-desc-label">Catatan</span>
                  <p className="modal-desc-text" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.description || selectedItem.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, background: 'var(--accent-light)', color: 'var(--accent)', boxShadow: 'none', marginTop: 0 }}
                  onClick={() => { setEditingItem(selectedItem); setShowAddModal(true); setSelectedItem(null); }}
                >
                  <Edit3 size={16} /> Edit Barang
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, background: 'var(--out-of-stock-bg)', color: 'var(--out-of-stock)', boxShadow: 'none', marginTop: 0 }}
                  onClick={() => { handleDelete(selectedItem.id); }}
                >
                  <Trash2 size={16} /> Hapus Barang
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Add / Edit Modal (Personal Asset) ───────────── */}
      {showAddModal && (
        <AddEditAssetModal
          item={editingItem}
          categories={categories}
          locations={locations}
          userId={userId!}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
          onSaved={() => { setShowAddModal(false); setEditingItem(null); fetchData(); }}
        />
      )}

      {/* ── Manage Categories Modal ──────────────────────── */}
      {showManageCategories && (
        <ManageCategoriesModal
          userId={userId!}
          onClose={() => setShowManageCategories(false)}
          onChanged={fetchData}
        />
      )}

      {/* ── Manage Locations Modal ───────────────────────── */}
      {showManageLocations && (
        <ManageLocationsModal
          userId={userId!}
          onClose={() => setShowManageLocations(false)}
          onChanged={fetchData}
        />
      )}
    </div>
  );
}


// ── Add/Edit Asset Modal Sub-Component ─────────────────────
// Imported from '../components/AddEditAssetModal'

