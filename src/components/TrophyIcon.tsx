import React from 'react';

/**
 * Premium, animated SVG Trophy Icons for VendaLearn.
 * Includes Bronze, Silver, Gold, and Special variants.
 */

type TrophyRarity = 'bronze' | 'silver' | 'gold' | 'special' | 'locked';

interface TrophyIconProps {
    rarity: TrophyRarity;
    size?: number;
    animate?: boolean;
    color?: string;
}

const TrophyIcon: React.FC<TrophyIconProps> = ({ rarity, size = 80, animate = true, color }) => {
    
    const colors = {
        bronze: { main: '#CD7F32', light: '#DDA15E', dark: '#8C5A2E', accent: '#B45309' },
        silver: { main: '#94A3B8', light: '#CBD5E1', dark: '#475569', accent: '#64748B' },
        gold: { main: '#FACC15', light: '#FDE047', dark: '#CA8A04', accent: '#EAB308' },
        special: { main: '#8B5CF6', light: '#A78BFA', dark: '#5B21B6', accent: '#7C3AED' },
        locked: { main: '#E2E8F0', light: '#F1F5F9', dark: '#94A3B8', accent: '#CBD5E1' }
    };

    const c = colors[rarity] || colors.locked;
    const finalColor = color || c.main;

    return (
        <div 
            className={`trophy-wrapper ${animate ? 'trophy-float' : ''} ${rarity === 'locked' ? 'trophy-locked' : ''}`}
            style={{ width: size, height: size * 1.2 }}
        >
            <svg 
                viewBox="0 0 100 120" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-100 h-100"
            >
                <defs>
                    {/* Minwenda Stripe Pattern */}
                    <pattern id="minwendaPattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="5" height="10" fill="#EF4444" /> {/* Red */}
                        <rect x="5" y="0" width="5" height="10" fill="#FACC15" /> {/* Yellow */}
                        <rect x="10" y="0" width="5" height="10" fill="#10B981" /> {/* Green */}
                        <rect x="15" y="0" width="5" height="10" fill="#3B82F6" /> {/* Blue */}
                    </pattern>

                    <filter id="trophyGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* --- GOLD WREATH --- */}
                {rarity === 'gold' && (
                    <g opacity="0.8">
                        <path d="M25 60 Q 15 60, 15 30 Q 15 10, 35 15" stroke="#FDE047" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                        <path d="M75 60 Q 85 60, 85 30 Q 85 10, 65 15" stroke="#FDE047" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                    </g>
                )}

                {/* --- CUP BODY --- */}
                <path 
                    d="M30 20 C 30 20, 30 65, 50 65 C 70 65, 70 20, 70 20 Z" 
                    fill={finalColor} 
                    stroke={c.dark} 
                    strokeWidth="1.5"
                />

                {/* Minwenda Detail on Cup */}
                {rarity !== 'locked' && (
                    <rect x="31" y="25" width="38" height="8" fill="url(#minwendaPattern)" opacity="0.9" />
                )}
                
                {/* Handles */}
                <path d="M30 25 Q 15 25, 15 40 Q 15 50, 30 45" stroke={c.dark} strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M70 25 Q 85 25, 85 40 Q 85 50, 70 45" stroke={c.dark} strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* --- DRUM BASE (THUNGWA) --- */}
                <g transform="translate(0, 10)">
                    {/* Upper drum part */}
                    <path d="M42 55 L 45 75 H 55 L 58 55" fill={c.accent} stroke={c.dark} strokeWidth="1.5" />
                    
                    {/* The Drum itself */}
                    <ellipse cx="50" cy="85" rx="15" ry="18" fill={finalColor} stroke={c.dark} strokeWidth="1.5" />
                    <ellipse cx="50" cy="72" rx="15" ry="5" fill="#F8FAFC" stroke={c.dark} strokeWidth="1.5" /> {/* Drum head */}
                    
                    {/* Drum Strings/Pattern */}
                    <path d="M36 80 Q 50 105, 64 80" stroke={c.dark} strokeWidth="1" opacity="0.3" />
                    <path d="M40 95 L 60 95" stroke={c.dark} strokeWidth="1" opacity="0.2" />

                    {/* Minwenda on Drum */}
                    {rarity !== 'locked' && (
                        <rect x="42" y="90" width="16" height="4" fill="url(#minwendaPattern)" opacity="0.7" />
                    )}
                </g>

                {/* Shine/Reflection */}
                {rarity !== 'locked' && (
                    <path d="M62 25 Q 68 40, 62 55" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                )}
            </svg>

            <style>{`
                .trophy-wrapper {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .trophy-float svg {
                    animation: trophy-float-anim 4s infinite ease-in-out;
                }

                .trophy-locked {
                    filter: grayscale(1) contrast(0.8);
                    opacity: 0.4;
                }

                @keyframes trophy-float-anim {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(1deg); }
                }
            `}</style>
        </div>
    );
};

export default TrophyIcon;
