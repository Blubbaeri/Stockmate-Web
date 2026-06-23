import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
}

export default function Header({ 
  title, 
  subtitle, 
  searchQuery = '', 
  onSearchChange, 
  showSearch = false 
}: HeaderProps) {
  return (
    <div className="web-header">
      <div className="header-top">
        <div className="header-title-wrap">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        
        {showSearch && onSearchChange && (
          <div className="header-search-wrap">
            <Search size={16} className="header-search-icon" />
            <input
              type="text"
              placeholder="Cari barang..."
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
