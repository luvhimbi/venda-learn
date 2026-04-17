import React from 'react';

/**
 * MascotAuthHeader - An animated elephant mascot that "writes down" what the user types.
 * @param isTyping - Boolean that triggers the writing scribble animation.
 */
interface MascotAuthHeaderProps {
    isTyping?: boolean;
    width?: string;
    height?: string;
}

const MascotAuthHeader: React.FC<MascotAuthHeaderProps> = ({ isTyping = false, width = "160px", height = "160px" }) => {
    return (
        <div className="text-center mb-4 d-flex justify-content-center">
            <div style={{ width, height, position: 'relative' }}>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
                    <defs>
                        <radialGradient id="elephantHeadGrad" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#E2E8F0" />
                            <stop offset="100%" stopColor="#94A3B8" />
                        </radialGradient>
                    </defs>

                    <style>{`
                        @keyframes scribble {
                            0% { transform: translate(0, 0) rotate(0deg); }
                            25% { transform: translate(-3px, 2px) rotate(-2deg); }
                            50% { transform: translate(2px, 0) rotate(2deg); }
                            75% { transform: translate(-2px, -2px) rotate(-1deg); }
                            100% { transform: translate(0, 2px) rotate(1deg); }
                        }
                        
                        @keyframes blink {
                            0%, 96%, 98%, 100% { transform: scaleY(1); }
                            97%, 99% { transform: scaleY(0.1); }
                        }
                        
                        .scribble-anim {
                            animation: ${isTyping ? 'scribble 0.3s infinite ease-in-out' : 'none'};
                            transform-origin: 100px 140px;
                        }
                        
                        .eye-blink {
                            transform-origin: 50% 50%;
                            animation: blink 5s infinite;
                        }
                    `}</style>

                    {/* EARS */}
                    <path d="M60 55 C 20 40, 10 120, 50 145" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
                    <path d="M140 55 C 180 40, 190 120, 150 145" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />

                    {/* HEAD */}
                    <circle cx="100" cy="85" r="45" fill="url(#elephantHeadGrad)" stroke="#64748B" strokeWidth="2" />

                    {/* EYES */}
                    <g className="eye-blink">
                        <circle cx="85" cy="80" r="4" fill="#1E293B" />
                        <circle cx="115" cy="80" r="4" fill="#1E293B" />
                    </g>

                    {/* TUSKS */}
                    <path d="M85 105 Q 75 135, 65 125" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
                    <path d="M115 105 Q 125 135, 135 125" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />

                    {/* PAPER/CLIPBOARD (Stationary) */}
                    <g transform="translate(60, 150)">
                        <rect x="0" y="0" width="80" height="50" rx="4" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
                        <line x1="15" y1="15" x2="65" y2="15" stroke="#CBD5E1" strokeWidth="2" />
                        <line x1="15" y1="25" x2="65" y2="25" stroke="#CBD5E1" strokeWidth="2" />
                        <line x1="15" y1="35" x2="45" y2="35" stroke="#CBD5E1" strokeWidth="2" />
                    </g>

                    {/* TRUNK & PENCIL (Animated if typing) */}
                    <g className="scribble-anim">
                        {/* TRUNK */}
                        <path 
                            d="M100 95 C 100 130, 95 160, 120 160 C 130 160, 135 155, 135 145" 
                            fill="none" 
                            stroke="url(#elephantHeadGrad)" 
                            strokeWidth="14" 
                            strokeLinecap="round" 
                        />
                        
                        {/* PENCIL (Held by trunk end at 135, 145) */}
                        <g transform="translate(135, 145) rotate(-45)">
                            <path d="M-5 -25 L 5 -25 L 5 15 L 0 25 L -5 15 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
                            {/* Eraser */}
                            <path d="M-5 -25 L 5 -25 L 5 -30 L -5 -30 Z" fill="#F87171" stroke="#DC2626" strokeWidth="1.5" />
                            {/* Pencil Tip */}
                            <path d="M-5 15 L 5 15 L 0 25 Z" fill="#FCD34D" />
                            <circle cx="0" cy="24" r="1.5" fill="#1E293B" />
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default MascotAuthHeader;






