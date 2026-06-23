import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="empty-state-card animate-spring">
      <div className="empty-icon-wrap">
        <Search size={40} />
      </div>
      <h3 className="empty-title">Tidak ditemukan</h3>
      <p className="empty-desc">
        Barang dengan kata kunci "{query}" tidak ada<br />dalam koleksi aset Anda.
      </p>
    </div>
  );
}
