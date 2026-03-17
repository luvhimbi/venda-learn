import React, { useState, useEffect } from 'react';

export type MascotMood = 'happy' | 'sad' | 'excited';

interface MascotProps {
    width?: string;
    height?: string;
    style?: React.CSSProperties;
    mood?: MascotMood;
    className?: string;
}

const Mascot: React.FC<MascotProps> = ({ width = "150px", height = "150px", style = {}, mood = 'happy', className = "" }) => {
    const [isWaving, setIsWaving] = useState(false);

    // Auto-wave if excited
    useEffect(() => {
        if (mood === 'excited') setIsWaving(true);
        else setIsWaving(false);
    }, [mood]);

    return (
        <div
            className={`mascot-container cursor-pointer ${className}`}
            style={{ width, height, position: 'relative', ...style }}
            onMouseEnter={() => mood !== 'sad' && setIsWaving(true)}
            onMouseLeave={() => mood !== 'excited' && setIsWaving(false)}
            onClick={() => mood !== 'sad' && setIsWaving(!isWaving)}
        >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={`w-100 h-100 filter-drop-shadow ${mood === 'excited' ? 'animate-bounce' : ''}`}>
                <defs>
                    <radialGradient id="headGradient" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#E2E8F0" />
                        <stop offset="100%" stopColor="#94A3B8" />
                    </radialGradient>
                    <linearGradient id="earGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#CBD5E1" />
                        <stop offset="100%" stopColor="#94A3B8" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <style>
                    {`
                        @keyframes waveTrunk {
                            0% { transform: rotate(0deg); }
                            25% { transform: rotate(-15deg); }
                            50% { transform: rotate(0deg); }
                            75% { transform: rotate(5deg); }
                            100% { transform: rotate(0deg); }
                        }
                        @keyframes blink {
                            0%, 90%, 100% { transform: scaleY(1); }
                            95% { transform: scaleY(0.1); }
                        }
                        @keyframes earFlap {
                            0% { transform: rotate(0deg); }
                            50% { transform: rotate(5deg); }
                            100% { transform: rotate(0deg); }
                        }
                        @keyframes tearDrop {
                            0% { opacity: 0; transform: translateY(0); }
                            20% { opacity: 1; }
                            80% { opacity: 1; transform: translateY(40px); }
                            100% { opacity: 0; transform: translateY(50px); }
                        }
                        @keyframes bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                        
                        .trunk { transform-origin: 100px 110px; transition: transform 0.5s ease; }
                        .mascot-container:hover .trunk.happy, .waving .trunk.happy { animation: waveTrunk 1.5s infinite ease-in-out; }
                        .mascot-container:hover .trunk.excited, .waving .trunk.excited { animation: waveTrunk 0.5s infinite ease-in-out; }
                        
                        .ear-left { transform-origin: 60px 80px; transition: transform 0.5s; }
                        .ear-right { transform-origin: 140px 80px; transition: transform 0.5s; }
                        
                        .happy .ear-left { animation: earFlap 3s infinite ease-in-out; }
                        .happy .ear-right { animation: earFlap 3s infinite ease-in-out reverse; }
                        .excited .ear-left { animation: earFlap 0.5s infinite ease-in-out; }
                        .excited .ear-right { animation: earFlap 0.5s infinite ease-in-out reverse; }
                        
                        .sad .ear-left { transform: rotate(-15deg); }
                        .sad .ear-right { transform: rotate(15deg); }
                        .sad .trunk { transform: rotate(20deg)translateY(10px); }
                        
                        .eye { transform-origin: center; animation: blink 4s infinite; }
                        .sad .eye { transform: scaleY(0.8) rotate(10deg); } 
                        
                        .tear { animation: tearDrop 2s infinite ease-in; }
                        .animate-bounce { animation: bounce 1s infinite ease-in-out; }
                    `}
                </style>

                <g className={mood}>
                    {/* BODY SHADOW */}
                    <ellipse cx="100" cy="180" rx="60" ry="12" fill="#000" opacity="0.1" />

                    {/* BODY - Larger for mature look */}
                    <circle cx="100" cy="135" r="65" fill="url(#headGradient)" stroke="#64748B" strokeWidth="1" />

                    {/* EARS - More prominent */}
                    <g className="ear-left">
                        <path d="M40 60 C 0 40, -10 100, 30 140 C 40 150, 50 130, 60 100" fill="url(#earGradient)" stroke="#64748B" strokeWidth="1.5" />
                        <path d="M35 80 C 15 90, 20 115, 40 130" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.4" />
                    </g>
                    <g className="ear-right">
                        <path d="M160 60 C 200 40, 210 100, 170 140 C 160 150, 150 130, 140 100" fill="url(#earGradient)" stroke="#64748B" strokeWidth="1.5" />
                        <path d="M165 80 C 185 90, 180 115, 160 130" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.4" />
                    </g>

                    {/* HEAD - Slightly higher and refined */}
                    <circle cx="100" cy="95" r="48" fill="url(#headGradient)" stroke="#64748B" strokeWidth="1.5" />
                    <ellipse cx="100" cy="75" rx="35" ry="20" fill="#fff" opacity="0.15" />

                    {/* CONFETTI FOR EXCITED */}
                    {mood === 'excited' && (
                        <>
                            <circle cx="40" cy="40" r="5" fill="#FACC15" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <circle cx="160" cy="40" r="5" fill="#EF4444" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <circle cx="10" cy="90" r="4" fill="#3B82F6" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <circle cx="190" cy="90" r="4" fill="#10B981" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </>
                    )}

                    {/* EYES */}
                    <g className="eye" transform="translate(-16, -5)">
                        <circle cx="85" cy={mood === 'sad' ? 92 : 90} r="6" fill="#1E293B" />
                        <circle cx="87" cy={mood === 'sad' ? 90 : 88} r="2.5" fill="white" />
                        <circle cx="83" cy="92" r="1.5" fill="white" opacity="0.5" />
                    </g>
                    <g className="eye" transform="translate(16, -5)">
                        <circle cx="115" cy={mood === 'sad' ? 92 : 90} r="6" fill="#1E293B" />
                        <circle cx="117" cy={mood === 'sad' ? 90 : 88} r="2.5" fill="white" />
                        <circle cx="113" cy="92" r="1.5" fill="white" opacity="0.5" />
                    </g>

                    {/* GLASSES (Mentor/Adult look) */}
                    <g className="glasses" opacity="0.95" transform="translate(0, -5)">
                        <circle cx="85" cy="90" r="18" fill="rgba(255,255,255,0.05)" stroke="#334155" strokeWidth="2.5" />
                        <circle cx="115" cy="90" r="18" fill="rgba(255,255,255,0.05)" stroke="#334155" strokeWidth="2.5" />
                        <path d="M103 90 L 97 90" stroke="#334155" strokeWidth="2.5" />
                        <path d="M67 90 L 48 84" stroke="#334155" strokeWidth="2.5" />
                        <path d="M133 90 L 152 84" stroke="#334155" strokeWidth="2.5" />
                        <path d="M78 82 L 85 82" stroke="white" strokeWidth="2.5" opacity="0.4" />
                        <path d="M115 82 L 122 82" stroke="white" strokeWidth="2.5" opacity="0.4" />
                    </g>

                    {/* TEAR FOR SAD */}
                    {mood === 'sad' && (
                        <path d="M84 95 Q 84 105, 84 110 Q 79 115, 89 115 Q 89 105, 84 95" fill="#60A5FA" className="tear" />
                    )}

                    {/* TRUNK - Detailed */}
                    <g className={`trunk ${mood}`} transform="translate(0, -5)">
                        <path
                            d={mood === 'sad'
                                ? "M90 105 Q 95 145, 100 120 Q 105 135, 110 125"
                                : "M90 105 Q 100 155, 110 115 Q 120 150, 140 140"
                            }
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="14"
                            strokeLinecap="round"
                        />
                        <mask id="trunkMask">
                            <path
                                d={mood === 'sad'
                                    ? "M90 105 Q 95 145, 100 120 Q 105 135, 110 125"
                                    : "M90 105 Q 100 155, 110 115 Q 120 150, 140 140"
                                }
                                fill="none"
                                stroke="white"
                                strokeWidth="14"
                                strokeLinecap="round"
                            />
                        </mask>
                        <g mask="url(#trunkMask)">
                            <path d="M95 112 Q 100 117, 105 112" fill="none" stroke="#64748B" strokeWidth="1.5" opacity="0.5" />
                            <path d="M100 125 Q 105 130, 110 125" fill="none" stroke="#64748B" strokeWidth="1.5" opacity="0.5" />
                            <path d="M105 138 Q 110 143, 115 138" fill="none" stroke="#64748B" strokeWidth="1.5" opacity="0.5" />
                        </g>
                    </g>

                    {/* TUSKS - Significantly Larger/Longer for mature look */}
                    <path d="M80 110 Q 70 145, 55 135" fill="none" stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.1))" />
                    <path d="M120 110 Q 130 145, 145 135" fill="none" stroke="#F8FAFC" strokeWidth="7" strokeLinecap="round" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.1))" />
                </g>
            </svg>


        </div>
    );
};

export default Mascot;
