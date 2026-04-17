import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface CharacterProps {
    className?: string;
    style?: React.CSSProperties;
}

// COLORS (Premium Palette - No Purple Gradients)
const COLORS = {
    SKIN: '#8D5524',
    SKIN_LIGHT: '#C68642',
    SKIN_DARK: '#5E3C1A',
    VENDA_RED: '#E11D48',
    VENDA_YELLOW: '#FACC15',
    VENDA_BLUE: '#2563EB',
    VENDA_GREEN: '#16A34A',
    ZULU_LEOPARD: '#D97706',
    XHOSA_WHITE: '#F8FAFC',
    XHOSA_OCHRE: '#C2410C',
    SOTHO_BLUE: '#1E3A8A',
    SWATI_RED: '#DC2626',
    NDEBELE_GOLD: '#CA8A04',
    TSONGA_PINK: '#DB2777', // Solid pink, no gradient
    TSWANA_INDIGO: '#312E81',
    EYE_WHITE: '#FFFFFF',
    EYE_PUPIL: '#222222',
};

// Subtle animation variants
const breatheAnim: Variants = {
    initial: { scaleY: 1, y: 0 },
    animate: {
        scaleY: [1, 1.02, 1],
        y: [0, -2, 0],
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
    }
};

const swayAnim: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: [-1, 1, -1],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }
    }
};

const blinkAnim: Variants = {
    animate: {
        scaleY: [1, 1, 0.1, 1, 1],
        transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1], ease: 'easeInOut' as const }
    }
};

const armSwingLeft: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: [-2, 2, -2],
        transformOrigin: "72px 85px",
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const }
    }
};

const armSwingRight: Variants = {
    initial: { rotate: 0 },
    animate: {
        rotate: [2, -2, 2],
        transformOrigin: "128px 85px",
        transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const }
    }
};

/**
 * Enhanced Human Figure with Face, Better Proportions, and Animations
 */
const EnhancedBody: React.FC<{ skinColor?: string; children?: React.ReactNode }> = ({ skinColor = COLORS.SKIN, children }) => (
    <motion.g variants={swayAnim} initial="initial" animate="animate" style={{ transformOrigin: "100px 240px" }}>

        {/* Legs (Static base) */}
        <path d="M80 160 L75 240" stroke={skinColor} strokeWidth="16" strokeLinecap="round" />
        <path d="M80 160 L75 240" stroke="#222" strokeWidth="1.5" fill="none" />

        <path d="M120 160 L125 240" stroke={skinColor} strokeWidth="16" strokeLinecap="round" />
        <path d="M120 160 L125 240" stroke="#222" strokeWidth="1.5" fill="none" />

        <motion.g variants={breatheAnim} initial="initial" animate="animate" style={{ transformOrigin: "100px 160px" }}>

            {/* Neck */}
            <rect x="94" y="70" width="12" height="15" fill={skinColor} stroke="#222" strokeWidth="1.5" />

            {/* Torso */}
            <path d="M68 85 Q100 78 132 85 L140 160 Q100 170 60 160 Z" fill={skinColor} stroke="#222" strokeWidth="1.5" />

            {/* Clothing layers injected here so they breathe with torso */}
            {children}

            {/* Arm Left */}
            <motion.g variants={armSwingLeft} initial="initial" animate="animate">
                <path d="M70 88 Q50 120 48 155" stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
                <path d="M70 88 Q50 120 48 155" stroke="#222" strokeWidth="1.5" fill="none" />
            </motion.g>

            {/* Arm Right */}
            <motion.g variants={armSwingRight} initial="initial" animate="animate">
                <path d="M130 88 Q150 120 152 155" stroke={skinColor} strokeWidth="15" strokeLinecap="round" />
                <path d="M130 88 Q150 120 152 155" stroke="#222" strokeWidth="1.5" fill="none" />
            </motion.g>

            {/* Head (with slight counter-sway for natural look) */}
            <motion.g animate={{ rotate: [1, -1, 1], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } }} style={{ transformOrigin: "100px 75px" }}>
                <circle cx="100" cy="45" r="28" fill={skinColor} stroke="#222" strokeWidth="1.5" />

                {/* Face Features */}
                <g className="face">
                    <motion.g variants={blinkAnim} animate="animate" style={{ transformOrigin: "100px 42px" }}>
                        {/* Eyes */}
                        <ellipse cx="90" cy="42" rx="4.5" ry="6" fill={COLORS.EYE_WHITE} />
                        <circle cx="90" cy="42" r="2.5" fill={COLORS.EYE_PUPIL} />

                        <ellipse cx="110" cy="42" rx="4.5" ry="6" fill={COLORS.EYE_WHITE} />
                        <circle cx="110" cy="42" r="2.5" fill={COLORS.EYE_PUPIL} />
                    </motion.g>

                    {/* Eyebrows */}
                    <path d="M85 32 Q90 30 95 33" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M105 33 Q110 30 115 32" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Smile */}
                    <path d="M92 56 Q100 64 108 56" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />

                    {/* Blush */}
                    <circle cx="82" cy="52" r="4" fill="#D14D4D" opacity="0.25" />
                    <circle cx="118" cy="52" r="4" fill="#D14D4D" opacity="0.25" />
                </g>
            </motion.g>

        </motion.g>
    </motion.g>
);

// --- VENDA ---
const VendaCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Nnwenda Wrap */}
            <path d="M60 85 L140 85 L155 170 L45 170 Z" fill={COLORS.VENDA_YELLOW} stroke="#222" strokeWidth="1.5" />
            {/* Detailed Stripe Patterns */}
            <rect x="57" y="95" width="86" height="5" fill={COLORS.VENDA_RED} />
            <rect x="54" y="112" width="92" height="5" fill={COLORS.VENDA_BLUE} />
            <rect x="50" y="129" width="100" height="5" fill={COLORS.VENDA_GREEN} />
            <rect x="47" y="146" width="106" height="5" fill={COLORS.VENDA_RED} />

            {/* Detailed Beads */}
            <g className="beads">
                <ellipse cx="100" cy="78" rx="20" ry="8" fill="none" stroke={COLORS.VENDA_RED} strokeWidth="4" strokeDasharray="2,3" />
                <ellipse cx="100" cy="82" rx="25" ry="10" fill="none" stroke={COLORS.VENDA_BLUE} strokeWidth="4" strokeDasharray="3,3" />
                <ellipse cx="100" cy="87" rx="30" ry="12" fill="none" stroke={COLORS.VENDA_YELLOW} strokeWidth="5" strokeDasharray="3,3" />
            </g>

            {/* Musisi (Bottom skirt pleats) */}
            <path d="M45 170 Q100 185 155 170 L165 230 Q100 245 35 230 Z" fill={COLORS.VENDA_BLUE} stroke="#222" strokeWidth="1.5" />
            {[...Array(9)].map((_, i) => (
                <path key={i} d={`M${50 + i * 12.5} 175 Q${50 + i * 12.5} 200 ${40 + i * 15} 230`} stroke="#FFF" strokeWidth="0.8" opacity="0.4" fill="none" />
            ))}
        </EnhancedBody>
    </svg>
);

// --- ZULU ---
const ZuluCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody skinColor={COLORS.SKIN_DARK}>
            {/* Isicholo (Hat) - Attached to head context mentally, but placed in torso for simplicity of Z-index, wait, hat should be on head. */}
            <g transform="translate(0, -65)"> {/* Adjusting position relative to breathing torso */}
                <path d="M60 10 L140 10 L165 40 L35 40 Z" fill={COLORS.VENDA_RED} stroke="#222" strokeWidth="1.5" />
                <path d="M65 20 L135 20" stroke="#FFF" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M63 30 L137 30" stroke="#FFF" strokeWidth="1.5" strokeDasharray="3,3" />
            </g>

            {/* Isidwaba (Leopard skirt) */}
            <path d="M60 140 L140 140 L155 220 L45 220 Z" fill={COLORS.ZULU_LEOPARD} stroke="#222" strokeWidth="1.5" />
            {/* Leopard Pattern */}
            {[...Array(14)].map((_, i) => (
                <g key={i}>
                    <circle cx={65 + (i % 4) * 22 + (i % 2) * 10} cy={155 + Math.floor(i / 4) * 20} r="3" fill="#321" opacity="0.9" />
                    <circle cx={68 + (i % 4) * 22 + (i % 2) * 10} cy={158 + Math.floor(i / 4) * 20} r="1.5" fill="#111" />
                </g>
            ))}

            {/* Bead Necklace */}
            <ellipse cx="100" cy="80" rx="32" ry="16" fill="none" stroke={COLORS.VENDA_YELLOW} strokeWidth="6" strokeDasharray="4,2" />
            <ellipse cx="100" cy="80" rx="32" ry="16" fill="none" stroke="#222" strokeWidth="1" />

            {/* Amambatha (Chest cover) */}
            <path d="M70 85 Q100 110 130 85" fill="none" stroke={COLORS.VENDA_GREEN} strokeWidth="6" strokeDasharray="4,2" />
            <path d="M75 90 Q100 120 125 90" fill="none" stroke={COLORS.VENDA_RED} strokeWidth="4" strokeDasharray="3,2" />

            {/* Shield */}
            <g transform="translate(155, 130)">
                <ellipse cx="0" cy="0" rx="22" ry="55" fill="#FFF" stroke="#222" strokeWidth="1.5" />
                <rect x="-3" y="-50" width="6" height="100" fill="#222" rx="3" />
                <rect x="-11" y="-15" width="22" height="6" fill="#222" />
                <rect x="-11" y="15" width="22" height="6" fill="#222" />
                <circle cx="0" cy="-30" r="3" fill="#FFF" />
                <circle cx="0" cy="30" r="3" fill="#FFF" />
            </g>
        </EnhancedBody>
    </svg>
);

// --- XHOSA ---
const XhosaCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Umbhaco (Main Wrap) */}
            <path d="M55 85 L145 85 L160 220 L40 220 Z" fill={COLORS.XHOSA_WHITE} stroke="#222" strokeWidth="1.5" />
            {/* Black Stripes */}
            <path d="M48 165 L152 165" stroke="#222" strokeWidth="3" />
            <path d="M46 175 L154 175" stroke="#222" strokeWidth="3" />
            <path d="M43 190 L157 190" stroke="#222" strokeWidth="8" />

            {/* Detailed Headscarf */}
            <g transform="translate(0, -65)">
                <path d="M55 15 Q100 -20 145 15 L150 50 L50 50 Z" fill={COLORS.XHOSA_WHITE} stroke="#222" strokeWidth="1.5" />
                <path d="M60 30 L140 30" stroke="#222" strokeWidth="2" />
                <path d="M65 40 L135 40" stroke="#222" strokeWidth="2" />
                <circle cx="100" cy="15" r="5" fill="#222" />
            </g>

            {/* Beadwork (Amacici & Necklace) */}
            <circle cx="100" cy="75" r="24" fill="none" stroke="#222" strokeWidth="8" strokeDasharray="3,3" />
            <circle cx="100" cy="75" r="24" fill="none" stroke="#FFF" strokeWidth="2" />

            {/* Arm features */}
            <rect x="42" y="120" width="16" height="5" fill="#222" transform="rotate(-15 50 122)" />
            <rect x="142" y="120" width="16" height="5" fill="#222" transform="rotate(15 150 122)" />
        </EnhancedBody>
    </svg>
);

// --- SOTHO ---
const SothoCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Mokorotlo (Hat) */}
            <g transform="translate(0, -65)">
                <path d="M100 -10 L150 38 L50 38 Z" fill="#D2B48C" stroke="#222" strokeWidth="1.5" />
                <path d="M70 15 L130 15" stroke="#222" strokeWidth="1" opacity="0.6" />
                <path d="M80 25 L120 25" stroke="#222" strokeWidth="1" opacity="0.6" />
                <path d="M96 -10 L100 -20 L104 -10 Z" fill="#222" />
                <circle cx="100" cy="-20" r="3" fill="#D2B48C" stroke="#222" strokeWidth="1" />
            </g>

            {/* Basotho Blanket */}
            <path d="M55 80 Q100 60 145 80 L160 210 L40 210 Z" fill={COLORS.SOTHO_BLUE} stroke="#222" strokeWidth="1.5" />
            {/* Blanket Motifs (Corn cob / Victoria Crown) */}
            <g opacity="0.6">
                <path d="M75 110 L125 150 M125 110 L75 150" stroke={COLORS.VENDA_YELLOW} strokeWidth="5" strokeLinecap="round" />
                <path d="M70 160 L130 200 M130 160 L70 200" stroke={COLORS.VENDA_YELLOW} strokeWidth="5" strokeLinecap="round" />
            </g>
            <path d="M50 90 L150 90" stroke="#FFF" strokeWidth="2" strokeDasharray="8,6" opacity="0.5" />
            <path d="M45 200 L155 200" stroke="#FFF" strokeWidth="2" strokeDasharray="8,6" opacity="0.5" />
        </EnhancedBody>
    </svg>
);

// --- NDEBELE ---
const NdebeleCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Idzilla (Neck & Arm rings) */}
            <g transform="translate(0, -5)">
                {[...Array(6)].map((_, i) => (
                    <rect key={i} x="84" y={68 + i * 4} width="32" height="3" fill={COLORS.NDEBELE_GOLD} stroke="#222" strokeWidth="1" rx="1" />
                ))}
            </g>

            {/* Geometric Wrap */}
            <path d="M55 95 L145 95 L165 220 L35 220 Z" fill="#FFF" stroke="#222" strokeWidth="1.5" />
            {/* Intricate Colorful Shapes */}
            <path d="M80 120 L100 90 L120 120 L100 150 Z" fill={COLORS.VENDA_BLUE} stroke="#222" strokeWidth="1.5" />
            <rect x="45" y="160" width="40" height="30" fill={COLORS.VENDA_RED} stroke="#222" strokeWidth="1.5" />
            <rect x="115" y="160" width="40" height="30" fill={COLORS.VENDA_YELLOW} stroke="#222" strokeWidth="1.5" />
            <path d="M60 200 L140 200 L130 220 L70 220 Z" fill={COLORS.VENDA_GREEN} stroke="#222" strokeWidth="1.5" />
            <circle cx="100" cy="120" r="5" fill="#FFF" />

            {/* Headbands */}
            <g transform="translate(0, -65)">
                <rect x="70" y="25" width="60" height="12" fill="#FFF" stroke="#222" strokeWidth="1.5" rx="2" />
                <rect x="75" y="28" width="15" height="6" fill={COLORS.VENDA_RED} />
                <rect x="95" y="28" width="10" height="6" fill={COLORS.VENDA_BLUE} />
                <rect x="110" y="28" width="15" height="6" fill={COLORS.VENDA_GREEN} />
            </g>

            {/* Arm / leg rings */}
            <rect x="38" y="120" width="18" height="4" fill={COLORS.NDEBELE_GOLD} stroke="#222" strokeWidth="1" transform="rotate(-15 47 122)" />
            <rect x="40" y="126" width="18" height="4" fill={COLORS.NDEBELE_GOLD} stroke="#222" strokeWidth="1" transform="rotate(-15 49 128)" />
            <rect x="144" y="120" width="18" height="4" fill={COLORS.NDEBELE_GOLD} stroke="#222" strokeWidth="1" transform="rotate(15 153 122)" />
            <rect x="142" y="126" width="18" height="4" fill={COLORS.NDEBELE_GOLD} stroke="#222" strokeWidth="1" transform="rotate(15 151 128)" />
        </EnhancedBody>
    </svg>
);

// --- TSONGA ---
const TsongaCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Xibelani (Layered Skirt with high volume) */}
            <g className="xibelani">
                <path d="M45 135 Q100 115 155 135 L195 230 Q100 260 5 230 Z" fill={COLORS.TSONGA_PINK} stroke="#222" strokeWidth="1.5" />
                {/* Flowing Pleats */}
                {[...Array(15)].map((_, i) => (
                    <path key={i} d={`M${55 + i * 6} 140 Q${40 + i * 8} 185 ${15 + i * 12} 235`} stroke="#FFF" strokeWidth="1" opacity="0.5" fill="none" />
                ))}
                {/* Horizontal trim lines */}
                <path d="M30 175 Q100 195 170 175" stroke="#FFF" strokeWidth="3" opacity="0.4" fill="none" />
                <path d="M20 205 Q100 225 180 205" stroke="#FFF" strokeWidth="3" opacity="0.4" fill="none" />
            </g>

            {/* Colorful Top */}
            <path d="M65 80 Q100 75 135 80 L140 135 Q100 120 60 135 Z" fill={COLORS.VENDA_YELLOW} stroke="#222" strokeWidth="1.5" />
            <ellipse cx="100" cy="105" rx="15" ry="15" fill="none" stroke={COLORS.TSONGA_PINK} strokeWidth="4" strokeDasharray="3,3" />
            <ellipse cx="100" cy="105" rx="20" ry="20" fill="none" stroke={COLORS.VENDA_BLUE} strokeWidth="2" strokeDasharray="2,2" />
        </EnhancedBody>
    </svg>
);

// --- TSWANA ---
const TswanaCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Shweshwe Dress */}
            <path d="M55 85 L145 85 L165 230 L35 230 Z" fill={COLORS.TSWANA_INDIGO} stroke="#222" strokeWidth="1.5" />
            {/* Intricate Geometric Shweshwe Pattern */}
            {[...Array(24)].map((_, i) => (
                <g key={i} transform={`translate(${50 + (i % 6) * 18}, ${100 + Math.floor(i / 6) * 28})`} opacity="0.7">
                    <circle cx="0" cy="0" r="3" fill="#FFF" />
                    <circle cx="0" cy="0" r="6" fill="none" stroke="#FFF" strokeWidth="0.8" />
                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#FFF" strokeWidth="0.5" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#FFF" strokeWidth="0.5" />
                </g>
            ))}

            {/* Tuku (Headscarf) */}
            <g transform="translate(0, -65)">
                <path d="M60 10 Q100 -12 140 10 L148 45 L52 45 Z" fill={COLORS.TSWANA_INDIGO} stroke="#222" strokeWidth="1.5" />
                <path d="M65 25 L135 25" stroke="#FFF" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
                <path d="M70 35 L130 35" stroke="#FFF" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
            </g>
        </EnhancedBody>
    </svg>
);

// --- SWATI ---
const SwatiCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            {/* Emahiya (Wrap) */}
            <path d="M65 80 L135 80 L155 220 L45 220 Z" fill={COLORS.SWATI_RED} stroke="#222" strokeWidth="1.5" />

            {/* Traditional Shield Motif Pattern */}
            <path d="M100 110 Q125 110 125 140 Q125 170 100 170 Q75 170 75 140 Q75 110 100 110" stroke="#FFF" strokeWidth="3" fill="none" opacity="0.6" />
            <line x1="100" y1="100" x2="100" y2="180" stroke="#FFF" strokeWidth="2" opacity="0.5" />

            {/* Over-shoulder wrap */}
            <path d="M65 80 L85 50 L115 80 Z" fill={COLORS.SWATI_RED} stroke="#222" strokeWidth="1.5" />

            {/* Feather headpiece */}
            <g transform="translate(0, -65)">
                <path d="M110 28 Q125 -5 140 -15" stroke="#222" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <ellipse cx="130" cy="-5" rx="5" ry="15" transform="rotate(40, 130, -5)" fill="#FFF" stroke="#222" strokeWidth="1" />
            </g>
        </EnhancedBody>
    </svg>
);

// --- GENERIC ---
const GenericCharacter: React.FC<CharacterProps> = ({ className, style }) => (
    <svg viewBox="0 0 200 250" className={className} style={style}>
        <EnhancedBody>
            <path d="M60 85 L140 85 L150 170 L50 170 Z" fill={COLORS.VENDA_YELLOW} stroke="#222" strokeWidth="1.5" />
            <path d="M80 85 L100 120 L120 85" fill="none" stroke="#FFF" strokeWidth="4" />
        </EnhancedBody>
    </svg>
);

interface CharacterMapperProps extends CharacterProps {
    languageId?: string;
    languageName?: string;
}

export const LanguageCharacter: React.FC<CharacterMapperProps> = ({ languageId, languageName, ...props }) => {
    const name = (languageName || languageId || '').toLowerCase();

    if (name.includes('venda')) return <VendaCharacter {...props} />;
    if (name.includes('zulu')) return <ZuluCharacter {...props} />;
    if (name.includes('xhosa')) return <XhosaCharacter {...props} />;
    if (name.includes('sotho')) return <SothoCharacter {...props} />;
    if (name.includes('ndebele')) return <NdebeleCharacter {...props} />;
    if (name.includes('tsonga') || name.includes('shangaan')) return <TsongaCharacter {...props} />;
    if (name.includes('swati') || name.includes('swazi')) return <SwatiCharacter {...props} />;
    if (name.includes('tswana')) return <TswanaCharacter {...props} />;
    if (name.includes('pedi') || name.includes('sotho sa leoa')) return <TswanaCharacter {...props} />;

    return <GenericCharacter {...props} />;
};

export default LanguageCharacter;






