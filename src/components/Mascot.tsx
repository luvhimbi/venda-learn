import React, { useState, useEffect } from 'react';

type MascotMood = 'happy' | 'sad' | 'excited';

interface MascotProps {
    width?: string;
    height?: string;
    style?: React.CSSProperties;
    mood?: MascotMood;
}

const Mascot: React.FC<MascotProps> = ({ width = "150px", height = "150px", style = {}, mood = 'happy' }) => {
    const [isWaving, setIsWaving] = useState(false);

    // Auto-wave if excited
    useEffect(() => {
        if (mood === 'excited') setIsWaving(true);
        else setIsWaving(false);
    }, [mood]);

    return (
        <div
            className="mascot-container cursor-pointer"
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
                    <ellipse cx="100" cy="170" rx="40" ry="8" fill="#000" opacity="0.1" />

                    {/* BODY */}
                    <circle cx="100" cy="130" r="50" fill="url(#headGradient)" stroke="#64748B" strokeWidth="1" />

                    {/* EARS - Detailed */}
                    <g className="ear-left">
                        <path d="M50 70 C 20 60, 10 100, 40 130 C 50 140, 60 120, 70 100" fill="url(#earGradient)" stroke="#64748B" strokeWidth="1" />
                        <path d="M45 80 C 30 90, 35 110, 50 120" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.4" /> {/* Inner ear detail */}
                    </g>
                    <g className="ear-right">
                        <path d="M150 70 C 180 60, 190 100, 160 130 C 150 140, 140 120, 130 100" fill="url(#earGradient)" stroke="#64748B" strokeWidth="1" />
                        <path d="M155 80 C 170 90, 165 110, 150 120" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.4" /> {/* Inner ear detail */}
                    </g>

                    {/* HEAD - Detailed */}
                    <circle cx="100" cy="100" r="45" fill="url(#headGradient)" stroke="#64748B" strokeWidth="1" />
                    <ellipse cx="100" cy="85" rx="30" ry="15" fill="#fff" opacity="0.2" /> {/* Highlight */}

                    {/* CONFETTI FOR EXCITED */}
                    {mood === 'excited' && (
                        <>
                            <circle cx="50" cy="50" r="4" fill="#FACC15" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <circle cx="150" cy="50" r="4" fill="#EF4444" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <circle cx="20" cy="100" r="3" fill="#3B82F6" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
                            <circle cx="180" cy="100" r="3" fill="#10B981" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </>
                    )}

                    {/* EYES - Detailed */}
                    <g className="eye" transform="translate(-15, 0)">
                        <circle cx="85" cy={mood === 'sad' ? 92 : 90} r="6" fill="#1E293B" />
                        <circle cx="87" cy={mood === 'sad' ? 90 : 88} r="2" fill="white" />
                        <circle cx="83" cy="92" r="1" fill="white" opacity="0.5" />
                    </g>
                    <g className="eye" transform="translate(15, 0)">
                        <circle cx="115" cy={mood === 'sad' ? 92 : 90} r="6" fill="#1E293B" />
                        <circle cx="117" cy={mood === 'sad' ? 90 : 88} r="2" fill="white" />
                        <circle cx="113" cy="92" r="1" fill="white" opacity="0.5" />
                    </g>

                    {/* GLASSES (SMART/ADULT LOOK) - Refined */}
                    <g className="glasses" opacity="0.95">
                        <circle cx="85" cy="90" r="16" fill="rgba(255,255,255,0.1)" stroke="#334155" strokeWidth="2" /> {/* Left Lens */}
                        <circle cx="115" cy="90" r="16" fill="rgba(255,255,255,0.1)" stroke="#334155" strokeWidth="2" /> {/* Right Lens */}
                        <path d="M101 90 L 99 90" stroke="#334155" strokeWidth="2" /> {/* Bridge */}
                        <path d="M69 90 L 55 86" stroke="#334155" strokeWidth="2" /> {/* Left Arm */}
                        <path d="M131 90 L 145 86" stroke="#334155" strokeWidth="2" /> {/* Right Arm */}
                        {/* Lens flare */}
                        <path d="M78 85 L 82 85" stroke="white" strokeWidth="2" opacity="0.6" />
                        <path d="M125 85 L 129 85" stroke="white" strokeWidth="2" opacity="0.6" />
                    </g>

                    {/* TEAR FOR SAD */}
                    {mood === 'sad' && (
                        <path d="M85 95 Q 85 105, 85 105 Q 80 110, 90 110 Q 90 100, 85 95" fill="#60A5FA" className="tear" />
                    )}

                    {/* TRUNK - Detailed */}
                    <g className={`trunk ${mood} ${isWaving ? 'waving' : ''}`}>
                        <path
                            d={mood === 'sad'
                                ? "M90 110 Q 95 140, 100 115 Q 105 130, 110 120" // Droopy trunk
                                : "M90 110 Q 100 150, 110 110 Q 110 140, 130 130" // Normal/Happy trunk
                            }
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        {/* Trunk Wrinkles */}
                        <mask id="trunkMask">
                            <path
                                d={mood === 'sad'
                                    ? "M90 110 Q 95 140, 100 115 Q 105 130, 110 120"
                                    : "M90 110 Q 100 150, 110 110 Q 110 140, 130 130"
                                }
                                fill="none"
                                stroke="white"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                        </mask>
                        <g mask="url(#trunkMask)">
                            <path d="M95 115 Q 100 120, 105 115" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.5" transform={mood === 'sad' ? "translate(0, 5)" : "translate(5, 5)"} />
                            <path d="M100 125 Q 105 130, 110 125" fill="none" stroke="#64748B" strokeWidth="1" opacity="0.5" transform={mood === 'sad' ? "translate(0, 5)" : "translate(8, 8)"} />
                        </g>
                    </g>

                    {/* TUSKS - Detailed */}
                    <path d="M85 115 Q 80 130, 75 125" fill="none" stroke="#F1F5F9" strokeWidth="4" strokeLinecap="round" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.1))" />
                    <path d="M115 115 Q 120 130, 125 125" fill="none" stroke="#F1F5F9" strokeWidth="4" strokeLinecap="round" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.1))" />
                </g>
            </svg>

            {/* SPEECH BUBBLE */}
            <div className={`position-absolute top-0 start-100 translate-middle-x bg-white p-2 rounded-3 shadow-sm border transition-all ${isWaving || mood === 'sad' ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                style={{ width: '120px', pointerEvents: 'none', transform: 'translate(10px, -20px)', zIndex: 10 }}>
                <p className="mb-0 smallest fw-bold text-center text-slate">
                    {mood === 'happy' && "Ndaa! / Aa!"}
                    {mood === 'sad' && "Ni khou tuwa? 😢"}
                    {mood === 'excited' && "Ndi zwone! 🎉"}
                </p>
            </div>
        </div>
    );
};

export default Mascot;
