import {
  Laptop, Headphones, Armchair, Shirt, Gamepad,
  Bug, Wrench, Trophy, Car, Flower, Package, HelpCircle
} from 'lucide-react';

export const CategoryIconMap: Record<string, any> = {
  Laptop,
  Headphones,
  Armchair,
  Shirt,
  Gamepad,
  Bug,
  Wrench,
  Trophy,
  Car,
  Flower,
  Package,
  HelpCircle
};

export const CategoryIconList = [
  { name: 'Laptop', label: 'Laptop / Elektronik' },
  { name: 'Headphones', label: 'Headphones / Audio' },
  { name: 'Armchair', label: 'Kursi / Furniture' },
  { name: 'Shirt', label: 'Pakaian / Fashion' },
  { name: 'Gamepad', label: 'Gamepad / Hobi' },
  { name: 'Bug', label: 'Hewan / Reptil' },
  { name: 'Wrench', label: 'Peralatan / Tools' },
  { name: 'Trophy', label: 'Piala / Olahraga' },
  { name: 'Car', label: 'Mobil / Kendaraan' },
  { name: 'Flower', label: 'Bunga / Dekorasi' },
  { name: 'Package', label: 'Box / Umum' },
];


export type AssetCondition = 'Baru' | 'Sangat Baik' | 'Baik' | 'Cukup' | 'Rusak';

export interface PersonalAssetType {
  id: string;
  name: string;
  category: string;
  price: number;
  condition: AssetCondition;
  purchaseDate?: string;
  description?: string;
  location?: string;
  imageUrl?: string;
}

export const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'Elektronik', label: 'Elektronik' },
  { id: 'Audio', label: 'Audio' },
  { id: 'Furniture & Setup', label: 'Furniture & Setup' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Hobi & Koleksi', label: 'Hobi & Koleksi' },
  { id: 'Reptile', label: 'Reptile' },
  { id: 'Peralatan', label: 'Peralatan' },
  { id: 'Olahraga', label: 'Olahraga' },
  { id: 'Kendaraan', label: 'Kendaraan' },
  { id: 'Dekorasi', label: 'Dekorasi' },
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export const getConditionMeta = (condition: AssetCondition) => {
  switch (condition) {
    case 'Baru':
      return {
        label: 'Baru',
        color: '#10b981',
        bg: '#e6f4ea'
      };
    case 'Sangat Baik':
      return {
        label: 'Sangat Baik',
        color: '#3b82f6',
        bg: '#e8f0fe'
      };
    case 'Baik':
      return {
        label: 'Baik',
        color: '#6366f1',
        bg: '#eef2ff'
      };
    case 'Cukup':
      return {
        label: 'Cukup',
        color: '#f59e0b',
        bg: '#fffbeb'
      };
    case 'Rusak':
      return {
        label: 'Rusak',
        color: '#ef4444',
        bg: '#fef2f2'
      };
    default:
      return {
        label: condition,
        color: 'var(--text-tertiary)',
        bg: 'var(--background)'
      };
  }
};

export const getCategoryMeta = (category: string) => {
  switch (category) {
    case 'Elektronik':
      return { label: 'Elektronik', color: '#3b82f6', bg: '#eff6ff', iconName: 'Laptop' };
    case 'Audio':
      return { label: 'Audio', color: '#8b5cf6', bg: '#f5f3ff', iconName: 'Headphones' };
    case 'Furniture & Setup':
      return { label: 'Furniture & Setup', color: '#10b981', bg: '#ecfdf5', iconName: 'Armchair' };
    case 'Fashion':
      return { label: 'Fashion', color: '#ec4899', bg: '#fdf2f8', iconName: 'Shirt' };
    case 'Hobi & Koleksi':
      return { label: 'Hobi & Koleksi', color: '#f59e0b', bg: '#fffbeb', iconName: 'Gamepad' };
    case 'Reptile':
      return { label: 'Reptile', color: '#14b8a6', bg: '#f0fdfa', iconName: 'Bug' };
    case 'Peralatan':
      return { label: 'Peralatan', color: '#6b7280', bg: '#f9fafb', iconName: 'Wrench' };
    case 'Olahraga':
      return { label: 'Olahraga', color: '#ef4444', bg: '#fef2f2', iconName: 'Trophy' };
    case 'Kendaraan':
      return { label: 'Kendaraan', color: '#f97316', bg: '#fff7ed', iconName: 'Car' };
    case 'Dekorasi':
      return { label: 'Dekorasi', color: '#db2777', bg: '#fdf2f8', iconName: 'Flower' };
    default:
      return {
        label: category,
        color: 'var(--cat-other)',
        bg: 'var(--cat-other-bg)',
        iconName: 'Package'
      };
  }
};
