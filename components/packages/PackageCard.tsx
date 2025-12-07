import React from 'react';
import { MapPin, Clock, Star, ArrowRight, ShieldCheck } from 'lucide-react';

export interface PackageProps {
    id: string;
    title: string;
    image: string;
    duration: string;
    locations: string[];
    price: number;
    rating: number;
    reviews: number;
    tags: string[];
    onBook: (id: string) => void;
}

export const PackageCard: React.FC<PackageProps> = ({
    id, title, image, duration, locations, price, rating, reviews, tags, onBook
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {rating} ({reviews})
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <div className="flex gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-md px-2 py-0.5 rounded border border-white/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2 group-hover:text-mmt-red transition-colors">
                    {title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <Clock size={14} className="text-mmt-red" />
                        {duration}
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-mmt-red" />
                        {locations.length} Stops
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                    {locations.slice(0, 3).map((loc, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100 font-medium">
                            {loc}
                        </span>
                    ))}
                    {locations.length > 3 && (
                        <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-md border border-gray-100 font-medium">
                            +{locations.length - 3}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div>
                        {/* <p className="text-xs text-gray-400 font-medium line-through">₹{(price * 1.2).toLocaleString()}</p>
                        <p className="text-xl font-black text-gray-800">₹{price.toLocaleString()}</p> */}
                    </div>
                    <button
                        onClick={() => onBook(id)}
                        className="bg-gradient-to-r from-mmt-red to-mmt-darkRed text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-100 hover:shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-1"
                    >
                        Book Now <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
