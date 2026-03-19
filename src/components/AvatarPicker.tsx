import React from 'react';

// Venda Minwenda Pattern colors
export const DICEBEAR_STYLES = [
    {
        id: 'avataaars',
        label: 'The Leader',
        vendaName: 'Dakalo',
        themeColor: '#FACC15',
        story: 'Sharing the joy of Venda traditions through leading and teaching others.'
    },
    {
        id: 'adventurer',
        label: 'The Voyager',
        vendaName: 'Ronewa',
        themeColor: '#1D4ED8',
        story: 'Exploring the vast plains of knowledge with the spirit of the ancestors.'
    },
    {
        id: 'lorelei',
        label: 'The Protector',
        vendaName: 'Rofhiwa',
        themeColor: '#15803D',
        story: 'Guarding the heritage and language with grace and unwavering strength.'
    },
    {
        id: 'open-peeps',
        label: 'The Artist',
        vendaName: 'Tshifhiwa',
        themeColor: '#B91D1D',
        story: 'Preserving our culture through digital patterns and visual storytelling.'
    },
    {
        id: 'personas',
        label: 'The Scholar',
        vendaName: 'Mukona',
        themeColor: '#EA580C',
        story: 'Mastering the ancient proverbs to bridge the wisdom of the past with the future.'
    },
    {
        id: 'miniavs',
        label: 'The Youth',
        vendaName: 'Zwivhuya',
        themeColor: '#4F46E5',
        story: 'The bright new generation carrying the torch of our language forward.'
    },
    {
        id: 'big-smile',
        label: 'The Host',
        vendaName: 'Khodani',
        themeColor: '#059669',
        story: 'Always welcoming others with the warm hospitality of the Venda people.'
    },
    {
        id: 'micah',
        label: 'The Dreamer',
        vendaName: 'Thabelo',
        themeColor: '#7C3AED',
        story: 'Finding inspiration in the sacred landscapes and rhythms of our home.'
    },
    {
        id: 'bottts',
        label: 'The Inventor',
        vendaName: 'Emmanuel',
        themeColor: '#71717a',
        story: 'Building tools to help the tribe thrive in the digital age.'
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
        <div className="avatar-picker-container">
            <div className="avatar-picker-grid mb-4">
                {DICEBEAR_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const clothingColor = style.themeColor.replace('#', '');
                    const avatarUrl = `https://api.dicebear.com/9.x/${style.id}/svg?seed=${seed}&backgroundColor=f8fafc&clothingColor=${clothingColor}&topColor=${clothingColor}`;

                    return (
                        <button
                            key={style.id}
                            type="button"
                            className={`avatar-choice-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(style.id)}
                        >
                            <div className="avatar-preview-wrapper position-relative" style={{ border: `3px solid ${style.themeColor}` }}>
                                <img
                                    src={avatarUrl}
                                    alt={style.label}
                                    className="avatar-img"
                                    loading="lazy"
                                />
                                {/* MINWENDA ACCENT STRIPE */}
                                <div className="minwenda-accent" style={{ background: style.themeColor }}></div>
                            </div>
                            <span className="style-label">{style.vendaName}</span>
                            {isSelected && <div className="selection-indicator" style={{ backgroundColor: style.themeColor }}></div>}
                        </button>
                    );
                })}
            </div>

            {selectedStyleData && (
                <div className="selected-avatar-card p-4 rounded-4 animate__animated animate__fadeIn">
                    <div className="minwenda-pattern-header"></div>
                    <div className="card-content d-flex align-items-center gap-4">
                        <div className="avatar-large flex-shrink-0 position-relative">
                             <img 
                                src={`https://api.dicebear.com/9.x/${selectedStyleData.id}/svg?seed=${seed}&backgroundColor=FACC15&clothingColor=${selectedStyleData.themeColor.replace('#', '')}&topColor=${selectedStyleData.themeColor.replace('#', '')}`} 
                                className="rounded-circle border-4 border-white shadow w-100 h-100" 
                                style={{ objectFit: 'cover' }}
                                alt="preview" 
                             />
                        </div>
                        <div className="text-dark">
                            <h4 className="fw-bold mb-0 ls-1" style={{ color: '#1e293b' }}>{selectedStyleData.vendaName}</h4>
                            <p className="smallest fw-bold text-uppercase ls-2 mb-2" style={{ color: selectedStyleData.themeColor }}>{selectedStyleData.label}</p>
                            <p className="small mb-0 opacity-75 italic text-secondary" style={{ borderLeft: `3px solid ${selectedStyleData.themeColor}`, paddingLeft: '12px', fontStyle: 'italic' }}>
                                "{selectedStyleData.story}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .avatar-picker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 15px;
                    padding: 15px;
                    background: #f1f5f9;
                    border-radius: 20px;
                }
                .avatar-choice-btn {
                    position: relative;
                    border: 2px solid transparent;
                    background: white;
                    border-radius: 18px;
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .avatar-choice-btn:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .avatar-choice-btn.selected {
                    border-color: currentColor;
                    transform: scale(1.05);
                }
                .avatar-preview-wrapper {
                    width: 70px;
                    height: 70px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f1f5f9;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
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
                    opacity: 0.8;
                }
                .style-label {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #475569;
                }
                .selected-avatar-card {
                    position: relative;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
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
                    width: 80px;
                    height: 80px;
                    flex-shrink: 0;
                }
                .avatar-large img {
                    width: 100%;
                    height: 100%;
                    aspect-ratio: 1/1;
                    object-fit: cover;
                }
                .selection-indicator {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 22px;
                    height: 22px;
                    border: 4px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
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
    const styleData = DICEBEAR_STYLES.find(s => s.id === avatarId) || DICEBEAR_STYLES[0];
    const clothingColor = styleData.themeColor.replace('#', '');
    const avatarUrl = `https://api.dicebear.com/9.x/${styleData.id}/svg?seed=${seed}&backgroundColor=f1f5f9&clothingColor=${clothingColor}&topColor=${clothingColor}`;

    return (
        <div
            className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 overflow-hidden shadow-sm ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: `2px solid ${styleData.themeColor}`,
                backgroundColor: 'white',
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
