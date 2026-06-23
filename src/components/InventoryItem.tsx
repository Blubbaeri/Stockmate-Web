import React from 'react';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, getConditionMeta, getCategoryMeta, PersonalAssetType, CategoryIconMap } from '../data/inventory';

interface InventoryItemProps {
  item: PersonalAssetType;
  onPress: () => void;
}

export default function InventoryItem({ item, onPress }: InventoryItemProps) {
  const condMeta = getConditionMeta(item.condition);
  const catMeta = getCategoryMeta(item.category);

  return (
    <div className="inventory-item-card animate-fade" onClick={onPress}>
      {/* Thumbnail Area */}
      <div 
        className="item-icon-container" 
        style={{ 
          backgroundColor: item.imageUrl ? 'transparent' : catMeta.bg,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // fallback if image fails to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              const IconComponent = CategoryIconMap[catMeta.iconName || 'Package'] || CategoryIconMap['Package'];
              return <IconComponent size={24} color={catMeta.color} />;
            })()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="item-content" style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div className="item-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="item-name" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </h3>
          <ChevronRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0, marginLeft: 8 }} />
        </div>

        {/* Category & Purchase Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{catMeta.label}</span>
          {item.purchaseDate && (
            <>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>•</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {new Date(item.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })}
              </span>
            </>
          )}
        </div>

        {/* Badges + Price */}
        <div className="item-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="item-badges" style={{ display: 'flex', gap: 6 }}>
            <span className="item-badge" style={{ backgroundColor: condMeta.bg, color: condMeta.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="item-badge-dot" style={{ backgroundColor: condMeta.color }} />
              {condMeta.label}
            </span>
          </div>
          <div className="item-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {item.price ? formatCurrency(item.price) : 'Rp0'}
          </div>
        </div>
      </div>
    </div>
  );
}
