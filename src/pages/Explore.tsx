import React from 'react';
import { Compass } from 'lucide-react';
import Header from '../components/Header';

export default function Explore() {
  return (
    <div className="animate-fade">
      <Header 
        title="Explore" 
        subtitle="Temukan fitur baru StockMate" 
      />
      <div className="explore-container">
        <div className="explore-icon-wrap">
          <Compass size={80} />
        </div>
        <h2 className="explore-title">Explore</h2>
        <p className="explore-desc">
          Halaman ini akan memuat fitur eksplorasi barang, inspirasi pengorganisasian barang, dan analisis aset pribadi di masa depan.
        </p>
      </div>
    </div>
  );
}
