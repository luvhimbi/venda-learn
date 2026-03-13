import React from 'react';

// Recommended DiceBear styles with Venda cultural context
export const DICEBEAR_STYLES = [
    {
        id: 'adventurer',
        label: 'Adventurer',
        vendaName: 'Ronewa',
        story: 'A curious learner who loves exploring new vocabularies and cultural traditions.'
    },
    {
        id: 'avataaars',
        label: 'Person',
        vendaName: 'Dakalo',
        story: 'Spreading happiness and positivity through every word learned in Tshivenda.'
    },
    {
        id: 'bottts',
        label: 'Robot',
        vendaName: 'Emmanuel',
        story: 'Mastering the technical side of language with precision and futuristic energy.'
    },
    {
        id: 'pixel-art',
        label: 'Pixel Art',
        vendaName: 'Tshifhiwa',
        story: 'A creative soul preserving the vibrant patterns of heritage through digital art.'
    },
    {
        id: 'lorelei',
        label: 'Character',
        vendaName: 'Rofhiwa',
        story: 'Finding peace and rhythm in the poetic sounds of our ancient language.'
    },
    {
        id: 'notionists',
        label: 'NotionStyle',
        vendaName: 'Mukona',
        story: 'A dedicated scribe documenting stories to bridge the gap between generations.'
    },
    {
        id: 'miniavs',
        label: 'Mini',
        vendaName: 'Zwivhuya',
        story: 'Representing the bright future of language learners with curiosity and joy.'
    },
    {
        id: 'big-smile',
        label: 'Smile',
        vendaName: 'Khodani',
        story: 'Always encouraging fellow learners with a bright smile and helpful tips.'
    },
    {
        id: 'micah',
        label: 'Sketch',
        vendaName: 'Thabelo',
        story: 'Artistic and thoughtful, capturing the essence of Venda life in every lesson.'
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
                    const avatarUrl = `https://api.dicebear.com/9.x/${style.id}/svg?seed=${seed}`;

                    return (
                        <button
                            key={style.id}
                            type="button"
                            className={`avatar-choice-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelect(style.id)}
                            title={style.label}
                        >
                            <div className="avatar-preview-wrapper">
                                <img
                                    src={avatarUrl}
                                    alt={style.label}
                                    className="avatar-img shadow-sm"
                                    loading="lazy"
                                />
                            </div>
                            <span className="style-label">{style.vendaName}</span>
                            {isSelected && <div className="selection-indicator"></div>}
                        </button>
                    );
                })}
            </div>

            {selectedStyleData && (
                <div className="selected-avatar-story p-3 rounded-4 animate__animated animate__fadeIn" style={{ background: '#EEF2FF', borderLeft: '4px solid #4F46E5' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-bold text-indigo" style={{ color: '#4338CA' }}>{selectedStyleData.vendaName}</span>
                        <span className="smallest text-muted text-uppercase ls-1">({selectedStyleData.label})</span>
                    </div>
                    <p className="small text-dark mb-0 italic" style={{ fontStyle: 'italic' }}>
                        "{selectedStyleData.story}"
                    </p>
                </div>
            )}

            <style>{`
                .avatar-picker-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                    gap: 12px;
                    padding: 10px;
                    background: #f8fafc;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                }
                .avatar-choice-btn {
                    position: relative;
                    border: 2px solid transparent;
                    background: white;
                    border-radius: 12px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .avatar-choice-btn:hover {
                    transform: scale(1.05);
                    border-color: #cbd5e1;
                }
                .avatar-choice-btn.selected {
                    border-color: #FACC15;
                    background: #fffef3;
                    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.2);
                }
                .avatar-preview-wrapper {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .style-label {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #64748b;
                }
                .avatar-choice-btn.selected .style-label {
                    color: #111827;
                }
                .selection-indicator {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 14px;
                    height: 14px;
                    background: #FACC15;
                    border: 2px solid white;
                    border-radius: 50%;
                }
                .text-indigo { color: #4338CA; }
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
    // avatarId is the style (e.g. 'adventurer'), seed is the individual variant (e.g. uid or username)
    const styleName = avatarId || 'adventurer';
    const avatarUrl = `https://api.dicebear.com/9.x/${styleName}/svg?seed=${seed}`;

    return (
        <div
            className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 overflow-hidden bg-light ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                border: `1px solid #e2e8f0`,
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
