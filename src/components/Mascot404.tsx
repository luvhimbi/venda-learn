import React from 'react';

/**
 * Specialized Investigative Mascot for 404 page.
 * Features the mature elephant looking through a microscope.
 */
interface Mascot404Props {
    width?: string;
    height?: string;
    className?: string;
}

const Mascot404: React.FC<Mascot404Props> = ({ width = "220px", height = "220px", className = "" }) => {
    return (
        <div 
            className={`mascot-404-container ${className}`} 
            style={{ width, height, position: 'relative' }}
        >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
                <defs>
                    <radialGradient id="headGrad404" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#E2E8F0" />
                        <stop offset="100%" stopColor="#94A3B8" />
                    </radialGradient>
                    <linearGradient id="scopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                </defs>

                <style>{`
                    @keyframes scopeLight {
                        0%, 100% { fill: rgba(59, 130, 246, 0.4); }
                        50% { fill: rgba(59, 130, 246, 0.8); }
                    }
                    @keyframes headTilt {
                        0%, 100% { transform: rotate(-2deg); }
                        50% { transform: rotate(0deg); }
                    }
                    .scope-light { animation: scopeLight 2s infinite ease-in-out; }
                    .investigator-head { transform-origin: 100px 100px; animation: headTilt 4s infinite ease-in-out; }
                `}</style>

                {/* --- THE MICROSCOPE --- */}
                <g className="microscope" transform="translate(100, 110)">
                    {/* Base */}
                    <rect x="0" y="55" width="40" height="8" rx="2" fill="#1E293B" />
                    <rect x="5" y="50" width="30" height="5" fill="#334155" />
                    
                    {/* Arm */}
                    <path d="M35 50 Q 45 40, 35 15" stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" />
                    
                    {/* Stage */}
                    <rect x="10" y="32" width="25" height="4" fill="#1E293B" />
                    
                    {/* Objective Lens */}
                    <rect x="18" y="20" width="8" height="12" fill="#475569" />
                    <rect x="16" y="28" width="12" height="4" fill="#334155" />
                    
                    {/* Body Tube */}
                    <rect x="18" y="-10" width="8" height="30" rx="1" fill="#334155" />
                    
                    {/* Eyepiece */}
                    <rect x="12" y="-18" width="20" height="8" rx="2" fill="#1E293B" />
                    
                    {/* Light Source (Glowing) */}
                    <circle cx="21" cy="45" r="4" className="scope-light" />
                </g>

                {/* --- THE ELEPHANT (Investigator) --- */}
                <g className="investigator-head">
                    {/* HEAD */}
                    <circle cx="85" cy="85" r="45" fill="url(#headGrad404)" stroke="#64748B" strokeWidth="1.5" />

                    {/* EARS */}
                    <path d="M45 55 C 10 40, 0 100, 40 135" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                    <path d="M125 55 C 150 40, 160 100, 130 135" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />

                    {/* GLASSES */}
                    <g opacity="0.95" transform="translate(0, 0)">
                        <circle cx="75" cy="85" r="16" fill="rgba(255,255,255,0.05)" stroke="#334155" strokeWidth="2.5" />
                        <circle cx="105" cy="85" r="16" fill="rgba(255,255,255,0.05)" stroke="#334155" strokeWidth="2.5" />
                        <path d="M91 85 L 89 85" stroke="#334155" strokeWidth="2" />
                    </g>

                    {/* EYES (Narrowed focus) */}
                    <g transform="translate(-10, 0)">
                        {/* Eye 1 - Looking into scope */}
                        <circle cx="85" cy="85" r="4" fill="#1E293B" />
                        
                        {/* Eye 2 - Squinted */}
                        <path d="M110 84 Q 115 84, 120 84" stroke="#1E293B" strokeWidth="2" fill="none" />
                    </g>

                    {/* TRUNK (Curled near scope) */}
                    <path 
                        d="M85 95 Q 85 140, 105 130 Q 115 125, 112 110" 
                        fill="none" 
                        stroke="#94A3B8" 
                        strokeWidth="12" 
                        strokeLinecap="round" 
                    />

                    {/* TUSKS */}
                    <path d="M75 105 Q 65 135, 55 125" fill="none" stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
                    <path d="M95 105 Q 105 135, 115 125" fill="none" stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />
                </g>
            </svg>
        </div>
    );
};

export default Mascot404;
