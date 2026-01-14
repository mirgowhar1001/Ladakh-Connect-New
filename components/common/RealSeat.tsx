import React from 'react';

// 1. Realistic Seat Component (SVG)
export const RealSeat = ({ status, seatNum, onClick }: { status: 'available' | 'selected' | 'driver' | 'booked' | 'unavailable' | 'inactive', seatNum?: number, onClick?: () => void }) => {
    const isDriver = status === 'driver';
    const isBooked = status === 'booked';
    const isSelected = status === 'selected';
    const isInactive = status === 'inactive';
    const isUnavailable = status === 'unavailable';

    // Colors - MATCHING UI LEGEND
    // Available: Beige (Matches Legend #E8DCCA)
    // Booked: Light Gray (Matches Legend bg-gray-300)
    // Selected: Green (Matches Legend bg-green-500)

    // Base Fill
    const baseColor = isDriver ? '#4a4a4a' :
        isSelected ? '#22c55e' :
            isBooked ? '#D1D5DB' :
                isUnavailable ? '#D1D5DB' :
                    '#E8DCCA'; // DEFAULT AVAILABLE = BEIGE

    // Stroke/Border
    const strokeColor = isDriver ? '#2d2d2d' :
        isSelected ? '#16a34a' :
            isBooked ? '#9CA3AF' :
                '#C7B299'; // Beige Border

    // Text Color
    const textColor = isDriver ? 'text-gray-500' :
        isSelected ? 'text-white' :
            isBooked ? 'text-gray-500' :
                'text-[#8B735B]'; // Dark Beige Text

    return (
        <div
            onClick={!isDriver && !isBooked && !isUnavailable ? onClick : undefined}
            className={`relative w-10 h-12 flex flex-col items-center justify-center transition-transform duration-200 
        ${!isDriver && !isBooked && !isInactive && !isUnavailable ? 'cursor-pointer active:scale-95' : ''} 
        ${isSelected ? 'scale-105' : ''}
        ${isUnavailable ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${isBooked ? 'cursor-not-allowed' : ''}
        ${isInactive ? 'opacity-100 cursor-pointer hover:opacity-80' : ''} 
      `}
        >
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
                <defs>
                    <linearGradient id="leatherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#2C2C2C', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#1A1A1A', stopOpacity: 1 }} />
                    </linearGradient>
                    <filter id="insetShadow">
                        <feOffset dx="0" dy="2" />
                        <feGaussianBlur stdDeviation="2" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="black" floodOpacity="0.2" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                </defs>

                {/* Headrest */}
                <path d="M20 15 Q20 5 50 5 Q80 5 80 15 L80 25 Q80 32 50 32 Q20 32 20 25 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />

                {/* Main Body */}
                <path d="M10 40 Q10 30 20 30 L80 30 Q90 30 90 40 L95 100 Q95 110 85 110 L15 110 Q5 110 5 100 Z" fill={baseColor} stroke={strokeColor} strokeWidth="1.5" />

                {/* Center Stitching/Pattern */}
                {!isDriver && !isBooked && !isSelected && !isInactive && (
                    <>
                        <path d="M30 30 L30 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                        <path d="M70 30 L70 110" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                        <path d="M10 70 Q50 80 90 70" stroke={strokeColor} strokeWidth="1" opacity="0.3" fill="none" />
                    </>
                )}

                {/* Armrests Hint */}
                {!isDriver && (
                    <>
                        <path d="M5 50 L2 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
                        <path d="M95 50 L98 80" stroke={strokeColor} strokeWidth="2" opacity="0.4" fill="none" />
                    </>
                )}

                {/* Steering Wheel for Driver */}
                {isDriver && (
                    <circle cx="50" cy="70" r="25" fill="none" stroke="#999" strokeWidth="4" />
                )}
                {isDriver && (
                    <path d="M50 70 L28 85 M50 70 L72 85 M50 70 L50 45" stroke="#999" strokeWidth="4" />
                )}

            </svg>

            {/* Seat Number Overlay */}
            {!isDriver && (
                <span className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-sm ${textColor}`}>
                    {isBooked ? <span className="text-[10px] uppercase">Booked</span> : seatNum}
                </span>
            )}
        </div>
    );
};
