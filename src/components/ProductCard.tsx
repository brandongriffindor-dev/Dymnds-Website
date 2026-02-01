'use client';

import Link from "next/link";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  category: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  colors?: string[];
  comingSoon?: boolean;
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  image, 
  category,
  isNew = false,
  isBestSeller = false,
  colors = ['#000', '#fff', '#333'],
  comingSoon = true
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  if (comingSoon) {
    return (
      <div className="group cursor-pointer">
        <div 
          className="aspect-[3/4] bg-gradient-to-br from-neutral-900 to-neutral-800 mb-4 flex items-center justify-center overflow-hidden relative hover:from-neutral-800 hover:to-neutral-700 transition-all duration-500"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="text-center relative z-10">
            <img 
              src="/diamond-white.png" 
              alt="DYMNDS" 
              className={`w-12 h-12 mx-auto mb-3 transition-all duration-500 ${
                isHovered ? 'opacity-40 scale-110 rotate-12' : 'opacity-20'
              }`}
            />
            <span className="text-neutral-500 text-xs tracking-widest uppercase group-hover:text-neutral-300 transition-colors duration-300">
              Coming Soon
            </span>
          </div>
          
          {/* Shimmer effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ${
            isHovered ? 'translate-x-full' : '-translate-x-full'
          }`} />
        </div>
        
        {/* Placeholder skeleton */}
        <div className="h-4 bg-gradient-to-r from-neutral-800 to-neutral-700 w-3/4 mb-2 rounded group-hover:from-neutral-700 group-hover:to-neutral-600 transition-all duration-300" />
        <div className="h-3 bg-gradient-to-r from-neutral-800 to-neutral-700 w-1/3 rounded group-hover:from-neutral-700 group-hover:to-neutral-600 transition-all duration-300" />
      </div>
    );
  }

  return (
    <Link href={`/products/${id}`} className="group block">
      <div 
        className="aspect-[3/4] bg-neutral-900 mb-4 overflow-hidden relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        {image ? (
          <img 
            src={image} 
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src="/diamond-white.png" 
              alt="DYMNDS" 
              className="w-16 h-16 opacity-20"
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="px-3 py-1 bg-white text-black text-[10px] tracking-widest uppercase font-semibold">
              New
            </span>
          )}
          {isBestSeller && (
            <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] tracking-widest uppercase font-semibold border border-white/20">
              Best Seller
            </span>
          )}
        </div>

        {/* Quick actions on hover */}
        <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-all duration-500 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button className="w-full py-3 bg-white text-black text-xs tracking-widest uppercase font-semibold hover:bg-white/90 transition-colors">
            Quick Add
          </button>
        </div>

        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/0 transition-colors duration-300 ${
          isHovered ? 'bg-black/20' : ''
        }`} />
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-[10px] tracking-widest uppercase text-white/50">{category}</p>
        <h3 className="text-sm font-medium group-hover:opacity-70 transition-opacity">{name}</h3>
        <p className="text-sm opacity-70">${price.toFixed(2)}</p>
        
        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex gap-2 pt-1">
            {colors.map((color, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedColor(i);
                }}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  selectedColor === i ? 'border-white scale-125' : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}