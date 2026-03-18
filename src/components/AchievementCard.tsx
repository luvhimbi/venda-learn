import React from 'react';
import TrophyIcon from './TrophyIcon';

interface AchievementCardProps {
    id: string;
    title: string;
    description: string;
    color: string;
    isEarned: boolean;
    progress?: number; // 0 to 100
    rarity?: 'bronze' | 'silver' | 'gold' | 'special';
    onShare?: (id: string) => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
    id,
    title, 
    description, 
    color, 
    isEarned, 
    progress = 0,
    rarity = 'bronze',
    onShare
}) => {
    
    // Determine rarity color for the shadow/glow
    const rarityColors = {
        bronze: 'rgba(205, 127, 50, 0.1)',
        silver: 'rgba(148, 163, 184, 0.1)',
        gold: 'rgba(250, 204, 21, 0.1)',
        special: 'rgba(139, 92, 246, 0.1)'
    };

    const glowColor = isEarned ? (rarityColors[rarity] || 'rgba(0,0,0,0.05)') : 'transparent';

    return (
        <div 
            className={`achievement-card h-100 rounded-4 transition-all p-3 ${isEarned ? 'earned' : 'locked'}`}
            style={{ 
                backgroundColor: isEarned ? 'white' : '#fcfcfc',
                border: isEarned ? `1px solid ${color}40` : '1px dashed #e2e8f0',
                boxShadow: isEarned ? `0 10px 20px -5px ${glowColor}` : 'none'
            }}
        >
            <div className="d-flex flex-column align-items-center text-center">
                <div className="mb-4 position-relative">
                    <TrophyIcon 
                        rarity={rarity} 
                        size={80} 
                        color={color}
                        animate={isEarned}
                    />
                    {isEarned && (
                        <div 
                            className="position-absolute bg-success rounded-circle d-flex align-items-center justify-content-center border border-white"
                            style={{ width: 24, height: 24, bottom: 0, right: -5 }}
                        >
                            <i className="bi bi-check text-white fw-bold"></i>
                        </div>
                    )}
                    {isEarned && onShare && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onShare(id); }}
                            className="position-absolute btn btn-warning rounded-circle d-flex align-items-center justify-content-center border border-white shadow-sm share-badge transition-all"
                            style={{ width: 32, height: 32, top: -10, right: -15, zIndex: 5 }}
                            title="Share Achievement"
                        >
                            <i className="bi bi-share-fill smallest text-dark"></i>
                        </button>
                    )}
                </div>

                <h5 className={`fw-bold mb-2 ls-tight ${isEarned ? 'text-dark' : 'text-muted'}`}>{title}</h5>
                <p className="smallest fw-medium text-muted mb-4 px-2" style={{ lineHeight: '1.4' }}>{description}</p>

                {!isEarned && progress > 0 && (
                    <div className="w-100 mt-auto">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="smallest fw-bold text-muted ls-1 uppercase">Progress</span>
                            <span className="smallest fw-bold text-dark">{progress}%</span>
                        </div>
                        <div className="progress overflow-hidden" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
                            <div 
                                className="progress-bar" 
                                style={{ width: `${progress}%`, backgroundColor: color, borderRadius: '10px' }}
                            ></div>
                        </div>
                    </div>
                )}

                {!isEarned && progress === 0 && (
                    <div className="mt-auto">
                        <span className="badge bg-light text-muted border border-light-subtle rounded-pill smallest px-3 py-2 fw-bold ls-1">
                            <i className="bi bi-lock-fill me-1"></i> LOCKED
                        </span>
                    </div>
                )}
            </div>

            <style>{`
                .achievement-card {
                    cursor: default;
                }
                .achievement-card.earned:hover {
                    background-color: white !important;
                    transform: translateY(-8px);
                    box-shadow: 0 30px 60px -12px ${glowColor} !important;
                    border-color: ${color} !important;
                }
                .achievement-card.locked {
                    /* Removed grayscale as per user request to show what they are working towards */
                    border-style: solid;
                    border-color: #f1f5f9;
                }
                .achievement-card.locked:hover {
                    background-color: #fff !important;
                    border-color: #e2e8f0;
                }
                .share-badge:hover {
                    transform: scale(1.1);
                    background-color: #111827 !important;
                }
                .share-badge:hover i {
                    color: #FACC15 !important;
                }
                .smallest { font-size: 11px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-tight { letter-spacing: -0.5px; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default AchievementCard;
