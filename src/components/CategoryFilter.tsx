import React from 'react';

interface CategoryOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="category-filter-chips">
      {categories.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`category-chip ${isActive ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            {cat.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{cat.icon}</span>}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
