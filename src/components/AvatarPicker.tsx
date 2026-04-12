import React from 'react';
import CustomAvatarSVG from './CustomAvatar';
import type { AvatarConfig } from './CustomAvatar';

// Venda Minwenda Pattern colors
export const DICEBEAR_STYLES = [
    {
        id: 'avataaars',
        label: 'Tshivenda',
        name: 'Dakalo',
        themeColor: '#FACC15'
    },
    {
        id: 'adventurer',
        label: 'isiZulu',
        name: 'Sipho',
        themeColor: '#1D4ED8'
    },
    {
        id: 'lorelei',
        label: 'isiXhosa',
        name: 'Buhle',
        themeColor: '#15803D'
    },
    {
        id: 'open-peeps',
        label: 'Sesotho',
        name: 'Karabo',
        themeColor: '#B91D1D'
    },
    {
        id: 'personas',
        label: 'Setswana',
        name: 'Odirile',
        themeColor: '#EA580C'
    },
    {
        id: 'miniavs',
        label: 'Xitsonga',
        name: 'Tsakani',
        themeColor: '#4F46E5'
    },
    {
        id: 'big-smile',
        label: 'Afrikaans',
        name: 'Johan',
        themeColor: '#059669'
    },
    {
        id: 'micah',
        label: 'English',
        name: 'Oliver',
        themeColor: '#7C3AED'
    },
    {
        id: 'bottts',
        label: 'isiNdebele',
        name: 'Thando',
        themeColor: '#71717A'
    },
    {
        id: 'croodles',
        label: 'Tshivenda',
        name: 'Zwivhuya',
        themeColor: '#EAB308'
    },
    {
        id: 'notionists',
        label: 'Sepedi',
        name: 'Tshepo',
        themeColor: '#EC4899'
    },
    {
        id: 'pixel-art',
        label: 'Siswati',
        name: 'Gugu',
        themeColor: '#14B8A6'
    },
    {
        id: 'identicon',
        label: 'isiXhosa',
        name: 'Lwethu',
        themeColor: '#8B5CF6'
    },
    {
        id: 'fun-emoji',
        label: 'isiZulu',
        name: 'Zanele',
        themeColor: '#F43F5E'
    },
    {
        id: 'adventurer-neutral',
        label: 'Sesotho',
        name: 'Lethabo',
        themeColor: '#06B6D4'
    }
];

interface AvatarPickerProps {
    selectedStyle: string;
    seed: string;
    onSelect: (style: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedStyle, seed, onSelect }) => {
    const selectedStyleData = DICEBEAR_STYLES.find(s => s.id === selectedStyle);

    return (
        <div className="avatar-picker-container shadow-sm">
            <div className="avatar-picker-grid mb-5">
                {DICEBEAR_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const clothingColor = style.themeColor.replace('#', '');
                    const avatarUrl = `https://api.dicebear.com/9.x/${style.id}/svg?seed=${seed}&backgroundColor=f1f5f9&clothingColor=${clothingColor}&topColor=${clothingColor}`;

                    return (
                        <button
                            key={style.id}
                            type="button"
                            className={`avatar-choice-btn ${isSelected ? 'selected shadow-action-sm' : ''}`}
                            onClick={() => onSelect(style.id)}
                            style={{ borderColor: isSelected ? style.themeColor : 'transparent' }}
                        >
                            <div className="avatar-preview-wrapper position-relative" style={{ border: `3px solid ${isSelected ? style.themeColor : 'var(--color-border)'}` }}>
                                <img
                                    src={avatarUrl}
                                    alt={style.label}
                                    className="avatar-img"
                                    loading="lazy"
                                />
                                {/* MINWENDA ACCENT STRIPE */}
                                <div className="minwenda-accent" style={{ background: style.themeColor }}></div>
                            </div>
                            <span className="style-label">{style.name}</span>
                            {isSelected && <div className="selection-indicator bg-theme-main border-theme-card animate__animated animate__zoomIn"></div>}
                        </button>
                    );
                })}
            </div>

            {selectedStyleData && (
                <div className="selected-avatar-card brutalist-card p-4 p-md-5 animate__animated animate__fadeIn shadow-action-light">
                    <div className="minwenda-pattern-header"></div>
                    <div className="card-content d-flex flex-column flex-md-row align-items-center gap-4 gap-md-5">
                        <div className="avatar-large flex-shrink-0 position-relative shadow-action-sm">
                             <img 
                                src={`https://api.dicebear.com/9.x/${selectedStyleData.id}/svg?seed=${seed}&backgroundColor=FACC15&clothingColor=${selectedStyleData.themeColor.replace('#', '')}&topColor=${selectedStyleData.themeColor.replace('#', '')}`} 
                                className="border-4 border-theme-main h-100 w-100" 
                                style={{ objectFit: 'cover', borderRadius: '16px' }}
                                alt="preview" 
                             />
                        </div>
                        <div className="text-theme-main text-center text-md-start">
                            <h2 className="fw-black mb-1 ls-tight uppercase" style={{ fontSize: '1.75rem' }}>{selectedStyleData.name}</h2>
                            <p className="small fw-black text-uppercase ls-2 mb-0" style={{ color: selectedStyleData.themeColor }}>{selectedStyleData.label}</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .avatar-picker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
                    gap: 10px;
                    padding: 12px;
                    background: var(--color-bg-surface);
                    border: 3px solid var(--color-border);
                    border-radius: 20px;
                }
                .avatar-choice-btn {
                    position: relative;
                    border: 3px solid transparent;
                    background: var(--color-bg-card);
                    border-radius: 12px;
                    padding: 10px 5px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .avatar-choice-btn:hover {
                    transform: translateY(-4px);
                    border-color: var(--color-border);
                }
                .avatar-choice-btn.selected {
                    border-color: var(--color-border);
                    border-width: 4px;
                    transform: scale(1.05);
                    z-index: 2;
                }
                .avatar-preview-wrapper {
                    width: 70px;
                    height: 70px;
                    flex-shrink: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: var(--color-bg-card);
                    transition: all 0.2s ease;
                }
                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .minwenda-accent {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    height: 6px;
                    opacity: 0.9;
                }
                .style-label {
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--color-text);
                }
                .selected-avatar-card {
                    position: relative;
                    background: var(--color-bg-card);
                    overflow: hidden;
                }
                .minwenda-pattern-header {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 100%;
                    height: 8px;
                    z-index: 10;
                    background: repeating-linear-gradient(
                        to right,
                        #FACC15 0%, #FACC15 20%,
                        #1D4ED8 20%, #1D4ED8 40%,
                        #15803D 40%, #15803D 60%,
                        #B91D1D 60%, #B91D1D 80%,
                        #EA580C 80%, #EA580C 100%
                    );
                }
                .avatar-large {
                    width: 100px;
                    height: 100px;
                    flex-shrink: 0;
                    border-radius: 16px;
                }
                .avatar-large img {
                    width: 100%;
                    height: 100%;
                    aspect-ratio: 1/1;
                    object-fit: cover;
                }
                .selection-indicator {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    border: 3px solid var(--color-bg-card);
                    border-radius: 50%;
                    box-shadow: 0 4px 0 var(--color-border);
                }
            `}</style>
        </div>
    );
};

export default AvatarPicker;

export const AvatarDisplay: React.FC<{
    avatarId?: string;
    seed?: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties
}> = ({ avatarId, seed = "default", size = 36, className = "", style }) => {

    const isJson = typeof avatarId === 'string' && avatarId.startsWith('{');

    if (isJson) {
        let config: AvatarConfig;
        try {
            config = JSON.parse(avatarId);
        } catch {
            return null; // Fallback handled gracefully
        }
        
        return (
            <div
                className={`d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden shadow-action-sm ${className}`}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    border: `3px solid var(--color-border)`,
                    backgroundColor: config.bgColor,
                    borderRadius: '16px',
                    ...style
                }}
            >
                <CustomAvatarSVG config={config} size="100%" />
            </div>
        );
    }

    // Default DiceBear Fallback
    const styleData = DICEBEAR_STYLES.find(s => s.id === avatarId) || DICEBEAR_STYLES[0];
    const clothingColor = styleData.themeColor.replace('#', '');
    const avatarUrl = `https://api.dicebear.com/9.x/${styleData.id}/svg?seed=${seed}&backgroundColor=f1f5f9&clothingColor=${clothingColor}&topColor=${clothingColor}`;

    return (
        <div
            className={`d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden shadow-action-sm ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: `3px solid var(--color-border)`,
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '16px',
                ...style
            }}
        >
            <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
            />
        </div>
    );
};
