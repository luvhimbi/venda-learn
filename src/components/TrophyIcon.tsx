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

const TrophyIcon: React.FC<TrophyIconProps> = ({ rarity, size = 64, animate = true, color }) => {
    
    // Base colors - simplified, less gradient-heavy
    const colors = {
        bronze: { main: '#CD7F32', light: '#DDA15E', dark: '#8C5A2E' },
        silver: { main: '#94A3B8', light: '#CBD5E1', dark: '#475569' },
        gold: { main: '#FACC15', light: '#FDE047', dark: '#CA8A04' },
        special: { main: '#8B5CF6', light: '#A78BFA', dark: '#5B21B6' },
        locked: { main: '#E2E8F0', light: '#F1F5F9', dark: '#CBD5E1' }
    };

    const c = colors[rarity] || colors.locked;
    const finalColor = color || c.main;

    return (
        <div 
            className={`trophy-container ${animate ? 'trophy-animate' : ''} ${rarity === 'locked' ? 'trophy-locked' : ''}`}
            style={{ width: size, height: size }}
        >
            <svg 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-100 h-100"
            >
                {/* Simplified Cup Body */}
                <path 
                    d="M30 25C30 25 30 55 50 55C70 55 70 25 70 25" 
                    fill={finalColor} 
                    stroke={c.dark} 
                    strokeWidth="2"
                />
                
                {/* Simplified Handles */}
                <path d="M30 30H25V40H30" stroke={c.dark} strokeWidth="2" strokeLinecap="round" />
                <path d="M70 30H75V40H70" stroke={c.dark} strokeWidth="2" strokeLinecap="round" />
                
                {/* Simplified Stem & Base */}
                <path d="M45 55V65H55V55" fill={finalColor} stroke={c.dark} strokeWidth="2" />
                <path d="M35 65H65L68 72H32L35 65Z" fill={finalColor} stroke={c.dark} strokeWidth="2" />

                {/* Subtle Highlight - Single path instead of complex gradients */}
                {rarity !== 'locked' && (
                    <path d="M35 30C35 30 35 45 50 45" stroke="white" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
                )}
            </svg>

            <style>{`
                .trophy-container {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .trophy-animate svg {
                    animation: trophy-float 3s infinite ease-in-out;
                }

                .trophy-locked {
                    filter: grayscale(1);
                    opacity: 0.3;
                }

                @keyframes trophy-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
            `}</style>
        </div>
    );
};

export default TrophyIcon;
