import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, CheckCircle, AlertTriangle, XCircle, MapPin, Calendar, Box, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createPortal } from 'react-dom';
import { formatCurrency, getConditionMeta, CategoryIconMap } from '../data/inventory';

interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  totalLocations: number;
  conditionGood: number;
  conditionFair: number;
  conditionBroken: number;
  totalValue: number;
}

interface RecentItem {
  id: string;
  name: string;
  condition: string;
  purchase_price: number | null;
  created_at: string;
  category: { name: string; icon: string; color: string } | null;
  location: { name: string } | null;
  description?: string;
  image_url?: string | null;
  purchase_date?: string | null;
}

interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalCategories: 0,
    totalLocations: 0,
    conditionGood: 0,
    conditionFair: 0,
    conditionBroken: 0,
    totalValue: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<RecentItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const email = user.email || '';
      setUserName(email.split('@')[0]);

      // Fetch categories
      const { data: cats } = await supabase
        .from('sm_categories')
        .select('id, name, icon, color')
        .eq('user_id', user.id);

      // Fetch locations
      const { data: locs } = await supabase
        .from('sm_locations')
        .select('id, name')
        .eq('user_id', user.id);

      // Fetch items
      const { data: items } = await supabase
        .from('sm_items')
        .select('id, name, condition, purchase_price, created_at, category_id, location_id, description, notes, image_url, purchase_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const allItems = items || [];
      const allCats = cats || [];
      const allLocs = locs || [];

      // Calculate stats
      const totalValue = allItems.reduce((sum, item) => {
        return sum + (Number(item.purchase_price) || 0);
      }, 0);

      setStats({
        totalItems: allItems.length,
        totalCategories: allCats.length,
        totalLocations: allLocs.length,
        conditionGood: allItems.filter(i => ['Baru', 'Sangat Baik', 'Baik'].includes(i.condition)).length,
        conditionFair: allItems.filter(i => i.condition === 'Cukup').length,
        conditionBroken: allItems.filter(i => i.condition === 'Rusak').length,
        totalValue,
      });

      // Build category summary
      const catSummary: CategorySummary[] = allCats.map(cat => ({
        ...cat,
        count: allItems.filter(item => item.category_id === cat.id).length,
      }));
      setCategories(catSummary);

      // Build recent items (top 5)
      const catMap = new Map(allCats.map(c => [c.id, c]));
      const locMap = new Map(allLocs.map(l => [l.id, l]));

      const recent: RecentItem[] = allItems.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        condition: item.condition,
        purchase_price: item.purchase_price,
        created_at: item.created_at,
        category: item.category_id ? catMap.get(item.category_id) || null : null,
        location: item.location_id ? locMap.get(item.location_id) || null : null,
        description: item.description || item.notes || 'Tidak ada deskripsi.',
        image_url: item.image_url,
        purchase_date: item.purchase_date
      }));
      setRecentItems(recent);

    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderCategoryIcon = (iconName: string | null | undefined, size = 16, color?: string) => {
    const IconComponent = CategoryIconMap[iconName || 'Package'] || CategoryIconMap['Package'];
    return <IconComponent size={size} color={color} style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    if (hour < 20) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Baru': return '#10b981';
      case 'Sangat Baik': return '#3b82f6';
      case 'Baik': return '#6366f1';
      case 'Cukup': return '#f59e0b';
      case 'Rusak': return '#ef4444';
      default: return 'var(--text-tertiary)';
    }
  };

  const getConditionBg = (condition: string) => {
    switch (condition) {
      case 'Baru': return '#e6f4ea';
      case 'Sangat Baik': return '#e8f0fe';
      case 'Baik': return '#eef2ff';
      case 'Cukup': return '#fffbeb';
      case 'Rusak': return '#fef2f2';
      default: return 'var(--background)';
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `/uploads/${url}`;
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <span className="loading-text">Memuat dashboard Anda...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Hero Header */}
      <header className="dashboard-hero">
        <div className="hero-circle-1" />
        <div className="hero-circle-2" />

        <div className="hero-content">
          <div className="hero-top-row">
            <div>
              <div className="hero-greeting">{getGreeting()} 👋</div>
              <h2 className="hero-name">{userName || 'User'}</h2>
            </div>
            <div className="hero-avatar">
              {(userName || 'U').charAt(0)}
            </div>
          </div>

          <div className="hero-value-card">
            <div className="hero-value-row">
              <div>
                <span className="hero-value-label">Total Nilai Aset</span>
                <h1 className="hero-value-amount">{formatCurrency(stats.totalValue)}</h1>
              </div>
              <div className="hero-value-icon">
                <Wallet size={20} color="white" />
              </div>
            </div>
            <div className="hero-value-divider" />
            <div className="hero-value-meta">
              <div className="hero-value-meta-item">
                <span className="hero-value-meta-number">{stats.totalItems}</span>
                <span className="hero-value-meta-label">Aset</span>
              </div>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <div className="hero-value-meta-item">
                <span className="hero-value-meta-number">{stats.totalCategories}</span>
                <span className="hero-value-meta-label">Kategori</span>
              </div>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <div className="hero-value-meta-item">
                <span className="hero-value-meta-number">{stats.totalLocations}</span>
                <span className="hero-value-meta-label">Lokasi</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Condition Summary cards */}
      <section className="dashboard-section">
        <h3 className="section-title" style={{ marginBottom: 12 }}>Kondisi Aset</h3>
        <div className="condition-grid">
          <div className="condition-card" style={{ borderColor: 'rgba(52, 199, 89, 0.2)' }}>
            <div className="condition-icon-wrap" style={{ backgroundColor: '#e6f4ea' }}>
              <CheckCircle size={20} color="#10b981" />
            </div>
            <span className="condition-value" style={{ color: '#10b981' }}>{stats.conditionGood}</span>
            <span className="condition-label">Bagus (Baru/Baik)</span>
          </div>

          <div className="condition-card" style={{ borderColor: 'rgba(255, 149, 0, 0.2)' }}>
            <div className="condition-icon-wrap" style={{ backgroundColor: '#fffbeb' }}>
              <AlertTriangle size={20} color="#f59e0b" />
            </div>
            <span className="condition-value" style={{ color: '#f59e0b' }}>{stats.conditionFair}</span>
            <span className="condition-label">Layak (Cukup)</span>
          </div>

          <div className="condition-card" style={{ borderColor: 'rgba(255, 59, 48, 0.2)' }}>
            <div className="condition-icon-wrap" style={{ backgroundColor: '#fef2f2' }}>
              <XCircle size={20} color="#ef4444" />
            </div>
            <span className="condition-value" style={{ color: '#ef4444' }}>{stats.conditionBroken}</span>
            <span className="condition-label">Rusak</span>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Kategori Barang</h3>
            <span className="section-count">{categories.length} kategori</span>
          </div>
          <div className="category-scroll">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card">
                <div className="category-icon-wrap" style={{ backgroundColor: cat.color + '18' }}>
                  {renderCategoryIcon(cat.icon, 20, cat.color)}
                </div>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{cat.count} item</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">Aset Terbaru</h3>
          {recentItems.length > 0 && (
            <span className="section-count">{stats.totalItems} total</span>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="empty-state-card" style={{ maxWidth: '100%' }}>
            <div className="empty-icon-wrap">
              <Box size={32} />
            </div>
            <h4 className="empty-title">Belum ada aset</h4>
            <p className="empty-desc">
              Mulai catat barang-barang milikmu dengan menambahkan item baru dari menu Koleksi Saya.
            </p>
          </div>
        ) : (
          <div className="recent-list">
            {recentItems.map((item) => (
              <div key={item.id} className="recent-card" onClick={() => setSelectedItem(item)}>
                <div className="recent-left">
                  <div 
                    className="recent-item-icon-wrap" 
                    style={{ backgroundColor: (item.category?.color || 'var(--accent)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {renderCategoryIcon(item.category?.icon, 18, item.category?.color || 'var(--accent)')}
                  </div>
                  <div className="recent-info">
                    <h4 className="recent-name">{item.name}</h4>
                    <div className="recent-meta">
                      {item.category && <span>{item.category.name}</span>}
                      {item.location && (
                        <>
                          <span className="recent-meta-dot">·</span>
                          <span className="recent-location">
                            <MapPin size={10} />
                            {item.location.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="recent-right">
                  <span 
                    className="condition-badge" 
                    style={{ 
                      backgroundColor: getConditionBg(item.condition),
                      color: getConditionColor(item.condition) 
                    }}
                  >
                    <span 
                      className="condition-badge-dot" 
                      style={{ backgroundColor: getConditionColor(item.condition) }}
                    />
                    {item.condition}
                  </span>
                  <span className="recent-date">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Item Detail Modal */}
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
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedItem.name}</h2>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {selectedItem.category && (
                    <span className="item-badge" style={{ backgroundColor: (selectedItem.category.color || '#6366f1') + '18', color: selectedItem.category.color || '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {renderCategoryIcon(selectedItem.category.icon, 12, selectedItem.category.color || '#6366f1')} {selectedItem.category.name}
                    </span>
                  )}
                  <span 
                    className="item-badge" 
                    style={{ 
                      backgroundColor: getConditionBg(selectedItem.condition), 
                      color: getConditionColor(selectedItem.condition) 
                    }}
                  >
                    <span className="item-badge-dot" style={{ backgroundColor: getConditionColor(selectedItem.condition) }} />
                    {selectedItem.condition}
                  </span>
                </div>
              </div>

              <div className="modal-body">
                <div className="modal-info-grid" style={{ marginBottom: 20 }}>
                  <div className="info-grid-item">
                    <span className="info-grid-label">Harga Beli</span>
                    <span className="info-grid-value" style={{ fontWeight: 700 }}>
                      {selectedItem.purchase_price ? formatCurrency(selectedItem.purchase_price) : '-'}
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

                {selectedItem.description && (
                  <div className="modal-desc-wrap">
                    <span className="modal-desc-label">Catatan</span>
                    <p className="modal-desc-text" style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
