import React, { useState } from 'react';
import { PackageCard, PackageProps } from './PackageCard';
import { Header } from '../common/Header';
import { Filter, SlidersHorizontal } from 'lucide-react';

// Mock Data
const PACKAGES: PackageProps[] = [
    {
        id: 'pkg_1',
        title: 'Magical Ladakh Expedition',
        image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=2070&auto=format&fit=crop',
        duration: '6 Days / 5 Nights',
        locations: ['Leh', 'Nubra Valley', 'Pangong Lake', 'Khardung La'],
        price: 18999,
        rating: 4.8,
        reviews: 124,
        tags: ['Bestseller', 'Adventure'],
        onBook: () => { }
    },
    {
        id: 'pkg_2',
        title: 'Pangong Lake Special',
        image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=2070&auto=format&fit=crop',
        duration: '3 Days / 2 Nights',
        locations: ['Leh', 'Pangong Tso', 'Chang La'],
        price: 8499,
        rating: 4.9,
        reviews: 89,
        tags: ['Scenic', 'Relaxing'],
        onBook: () => { }
    },
    {
        id: 'pkg_3',
        title: 'Nubra Valley Camping',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop',
        duration: '4 Days / 3 Nights',
        locations: ['Leh', 'Hunder', 'Diskit', 'Turtuk'],
        price: 12499,
        rating: 4.7,
        reviews: 56,
        tags: ['Camping', 'Offbeat'],
        onBook: () => { }
    },
    {
        id: 'pkg_4',
        title: 'Zanskar Valley Adventure',
        image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=2070&auto=format&fit=crop',
        duration: '7 Days / 6 Nights',
        locations: ['Kargil', 'Padum', 'Phugtal', 'Drang Drung'],
        price: 24999,
        rating: 4.9,
        reviews: 32,
        tags: ['Trekking', 'Remote'],
        onBook: () => { }
    }
];

interface PackageListProps {
    onBack: () => void;
    onBook: (pkg: PackageProps) => void;
}

export const PackageList: React.FC<PackageListProps> = ({ onBack, onBook }) => {
    const [filter, setFilter] = useState('All');

    const filteredPackages = filter === 'All'
        ? PACKAGES
        : PACKAGES.filter(p => p.tags.includes(filter));

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            <Header
                title="Holiday Packages"
                subtitle="Curated experiences for you"
                showBack
                onBack={onBack}
            />

            {/* Filter Tabs */}
            <div className="bg-white px-4 py-3 shadow-sm mb-4 sticky top-[72px] z-30">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {['All', 'Bestseller', 'Adventure', 'Scenic', 'Camping'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Package Grid */}
            <div className="px-4 space-y-6">
                {filteredPackages.map(pkg => (
                    <PackageCard
                        key={pkg.id}
                        {...pkg}
                        onBook={() => onBook(pkg)}
                    />
                ))}
            </div>
        </div>
    );
};
