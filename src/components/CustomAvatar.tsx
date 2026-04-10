import React from 'react';

export interface AvatarConfig {
    skinColor: string;
    hairColor: string;
    hairStyle: 'afro' | 'fade' | 'braids' | 'makoti' | 'bald';
    eyes: 'normal' | 'happy' | 'focused' | 'wink' | 'surprised';
    mouth: 'smile' | 'neutral' | 'laugh' | 'smirk' | 'open';
    outfit: 'minwenda' | 'casual' | 'scholar' | 'traditional-tunic' | 'hoodie' | 'sports';
    bgColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
    skinColor: '#8D5524',
    hairColor: '#000000',
    hairStyle: 'bald',
    eyes: 'normal',
    mouth: 'smile',
    outfit: 'minwenda',
    bgColor: '#FFCDD2'
};

const CustomAvatarSVG: React.FC<{ config: AvatarConfig, size?: number | string, className?: string, style?: React.CSSProperties }> = ({ 
    config, 
    size = '100%', 
    className = '',
    style = {}
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            width={size}
            height={size}
            className={className}
            style={{ borderRadius: '50%', overflow: 'hidden', backgroundColor: config.bgColor, ...style }}
        >
            {/* BACKGROUND */}
            <rect width="200" height="200" fill={config.bgColor} />

            {/* OUTFIT */}
            <g id="outfit" transform="translate(0, 140)">
                {config.outfit === 'minwenda' && (
                    <>
                        <path d="M 50 60 L 50 0 C 80 -20 120 -20 150 0 L 150 60 Z" fill="#FACC15" />
                        <path d="M 50 20 L 150 20 L 150 40 L 50 40 Z" fill="#1D4ED8" /> {/* Venda Pattern Band */}
                        <path d="M 60 20 L 70 40 L 80 20 L 90 40 L 100 20 L 110 40 L 120 20 L 130 40 L 140 20" fill="none" stroke="#FFFFFF" strokeWidth="3" />
                    </>
                )}
                {config.outfit === 'casual' && (
                    <>
                        <path d="M 40 60 L 40 10 C 60 -10 140 -10 160 10 L 160 60 Z" fill="#475569" stroke="#334155" strokeWidth="2" />
                        <path d="M 80 10 C 90 30 110 30 120 10" fill="none" stroke={config.skinColor} strokeWidth="3" />
                    </>
                )}
                {config.outfit === 'scholar' && (
                    <>
                        <path d="M 30 60 L 30 0 L 170 0 L 170 60 Z" fill="#0F172A" />
                        <path d="M 100 40 L 80 0 L 120 0 Z" fill="#FFFFFF" />
                        <path d="M 100 60 L 100 40" stroke="#EF4444" strokeWidth="12" /> {/* Tie */}
                    </>
                )}
                {config.outfit === 'traditional-tunic' && (
                    <>
                        <path d="M 40 60 L 40 0 L 160 0 L 160 60 Z" fill="#b91c1c" />
                        <path d="M 90 0 L 100 30 L 110 0 Z" fill="#FACC15" />
                        <circle cx="100" cy="40" r="4" fill="#fef08a" />
                    </>
                )}
                {config.outfit === 'hoodie' && (
                    <>
                        <path d="M 30 60 L 30 20 C 50 -10 150 -10 170 20 L 170 60 Z" fill="#64748b" />
                        <path d="M 70 0 C 80 40 120 40 130 0" fill="none" stroke="#475569" strokeWidth="8" />
                        <path d="M 80 20 L 80 50 M 120 20 L 120 50" stroke="#cbd5e1" strokeWidth="4" />
                    </>
                )}
                {config.outfit === 'sports' && (
                    <>
                        <path d="M 50 60 L 50 10 C 80 30 120 30 150 10 L 150 60 Z" fill="#1d4ed8" />
                        <path d="M 50 10 L 60 60 M 150 10 L 140 60" stroke="#f8fafc" strokeWidth="6" />
                    </>
                )}
            </g>

            {/* NECK */}
            <path d="M 85 100 L 85 150 L 115 150 L 115 100 Z" fill={config.skinColor} />

            {/* EARS */}
            <circle cx="55" cy="110" r="14" fill={config.skinColor} />
            <circle cx="145" cy="110" r="14" fill={config.skinColor} />

            {/* HEAD / FACE BASE */}
            <path d="M 60 70 C 60 20 140 20 140 70 C 140 120 120 140 100 140 C 80 140 60 120 60 70 Z" fill={config.skinColor} />

            {/* EYES */}
            <g id="eyes" transform="translate(0, -5)">
                {config.eyes === 'normal' && (
                    <>
                        <circle cx="80" cy="100" r="5" fill="#1e293b" />
                        <circle cx="120" cy="100" r="5" fill="#1e293b" />
                    </>
                )}
                {config.eyes === 'happy' && (
                    <>
                        <path d="M 72 100 C 76 95 84 95 88 100" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 112 100 C 116 95 124 95 128 100" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    </>
                )}
                {config.eyes === 'focused' && (
                    <>
                        <line x1="72" y1="95" x2="88" y2="100" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        <line x1="128" y1="95" x2="112" y2="100" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="80" cy="103" r="3" fill="#1e293b" />
                        <circle cx="120" cy="103" r="3" fill="#1e293b" />
                    </>
                )}
                {config.eyes === 'wink' && (
                    <>
                        <circle cx="80" cy="100" r="5" fill="#1e293b" />
                        <path d="M 112 100 C 116 95 124 95 128 100" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                    </>
                )}
                {config.eyes === 'surprised' && (
                    <>
                        <circle cx="80" cy="98" r="6" fill="#1e293b" />
                        <circle cx="120" cy="98" r="6" fill="#1e293b" />
                        <path d="M 70 85 Q 80 75 90 85" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 110 85 Q 120 75 130 85" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                    </>
                )}
            </g>

            {/* CHEEKS */}
            {config.eyes === 'happy' && (
                <>
                    <circle cx="70" cy="110" r="6" fill="#FF8A80" opacity="0.4" />
                    <circle cx="130" cy="110" r="6" fill="#FF8A80" opacity="0.4" />
                </>
            )}

            {/* MOUTH */}
            <g id="mouth">
                {config.mouth === 'smile' && (
                    <path d="M 85 120 C 95 128 105 128 115 120" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                )}
                {config.mouth === 'neutral' && (
                    <line x1="90" y1="122" x2="110" y2="122" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                )}
                {config.mouth === 'laugh' && (
                    <path d="M 85 120 C 85 135 115 135 115 120 Z" fill="#1e293b" />
                )}
                {config.mouth === 'smirk' && (
                    <path d="M 90 120 C 105 128 115 115 115 115" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                )}
                {config.mouth === 'open' && (
                    <ellipse cx="100" cy="125" rx="6" ry="8" fill="#1e293b" />
                )}
            </g>

            {/* HAIR */}
            <g id="hair">
                {config.hairStyle === 'afro' && (
                    <path d="M 100 20 C 150 20 160 60 145 90 C 155 70 140 40 100 40 C 60 40 45 70 55 90 C 40 60 50 20 100 20 Z M 100 10 C 160 10 170 80 140 100 C 140 100 150 110 130 110 C 130 110 100 50 100 50 C 100 50 70 110 70 110 C 50 110 60 100 60 100 C 30 80 40 10 100 10 Z" fill={config.hairColor} opacity="0.9" />
                )}
                {config.hairStyle === 'fade' && (
                    <>
                        <path d="M 55 70 C 55 30 145 30 145 70 C 145 70 150 85 140 90 C 140 90 145 65 140 65 C 130 35 70 35 60 65 C 55 65 60 90 60 90 C 50 85 55 70 55 70 Z" fill={config.hairColor} />
                        <path d="M 60 45 C 60 10 140 10 140 45 Z" fill={config.hairColor} />
                    </>
                )}
                {config.hairStyle === 'braids' && (
                    <>
                        <path d="M 60 50 C 60 10 140 10 140 50 Z" fill={config.hairColor} />
                        {/* Braids hanging down */}
                        <path d="M 50 80 L 40 130 M 60 90 L 50 140 M 150 80 L 160 130 M 140 90 L 150 140" fill="none" stroke={config.hairColor} strokeWidth="12" strokeDasharray="14 4" strokeLinecap="round" />
                    </>
                )}
                {config.hairStyle === 'makoti' && (
                    <>
                        {/* Traditional Headwrap (Doek) */}
                        <path d="M 40 80 C 20 30 180 30 160 80 C 160 80 180 50 100 10 C 20 50 40 80 40 80 Z" fill="#B91D1D" />
                        <path d="M 50 40 C 80 0 120 0 150 40" fill="none" stroke="#FACC15" strokeWidth="6" />
                        <circle cx="100" cy="30" r="15" fill="#1D4ED8" />
                        <path d="M 40 80 C 40 80 30 100 60 90" fill="#B91D1D" />
                        <path d="M 160 80 C 160 80 170 100 140 90" fill="#B91D1D" />
                    </>
                )}
            </g>
        </svg>
    );
};

export default CustomAvatarSVG;
