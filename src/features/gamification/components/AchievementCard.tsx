import React from 'react';
import TrophyIcon from '../../../components/ui/TrophyIcon/TrophyIcon';

interface AchievementCardProps {
    id: string;

    color: string;
    isEarned: boolean;
    progress?: number; // 0 to 100
    rarity?: 'bronze' | 'silver' | 'gold' | 'special';
    onShare?: (id: string) => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ 
    id,
    color, 
    isEarned, 
    progress = 0,
    rarity = 'bronze',
    onShare
}) => {
    
    return (
        <div 
            className={`achievement-card h-100 brutalist-card transition-all p-3 ${isEarned ? 'earned' : 'locked'}`}
            style={{ 
                backgroundColor: isEarned ? 'var(--color-bg)' : 'var(--color-surface-soft)',
                borderWidth: '3px',
                borderColor: isEarned ? 'var(--color-border)' : 'var(--color-text-muted)',
                boxShadow: isEarned ? '6px 6px 0px var(--color-border)' : 'none',
                opacity: isEarned ? 1 : 0.6
            }}
        >
            <div className="d-flex flex-column align-items-center text-center">
                <div className="mb-3 position-relative">
                    <TrophyIcon 
                        rarity={rarity} 
                        size={70} 
                        color={color}
                        animate={isEarned}
                    />
                    {isEarned && (
                        <div 
                            className="position-absolute bg-success rounded-circle d-flex align-items-center justify-content-center border border-theme-main border-2 shadow-sm"
                            style={{ width: 22, height: 22, bottom: -2, right: -2, zIndex: 1 }}
                        >
                            <i className="bi bi-check text-white fw-bold" style={{ fontSize: '12px' }}></i>
                        </div>
                    )}
                    {isEarned && onShare && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onShare(id); }}
                            className="position-absolute btn-game-white rounded-circle d-flex align-items-center justify-content-center border border-theme-main border-2 shadow-action-sm share-badge transition-all"
                            style={{ width: 32, height: 32, top: -8, right: -12, zIndex: 5 }}
                            title="Share"
                        >
                            <i className="bi bi-share-fill text-theme-main" style={{ fontSize: '12px' }}></i>
                        </button>
                    )}
                </div>

                <h6 className="fw-black text-theme-main uppercase ls-1 mb-2" style={{ fontSize: '0.85rem' }}>{id.replace(/_/g, ' ')}</h6>

                {!isEarned && progress > 0 && (
                    <div className="w-100 mt-2 px-1">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="smallest fw-black text-theme-muted uppercase ls-1" style={{ fontSize: '8px' }}>PROGRESS</span>
                            <span className="smallest fw-black text-theme-main" style={{ fontSize: '8px' }}>{progress}%</span>
                        </div>
                        <div className="progress border border-theme-main border-1 shadow-none" style={{ height: '8px', backgroundColor: 'var(--color-surface-soft)', borderRadius: '4px' }}>
                            <div 
                                className="progress-bar" 
                                style={{ width: `${progress}%`, backgroundColor: color, borderRadius: '0px' }}
                            ></div>
                        </div>
                    </div>
                )}

                {!isEarned && progress === 0 && (
                    <div className="mt-1">
                        <span className="smallest fw-black text-muted uppercase ls-2 opacity-50">LOCKED</span>
                    </div>
                )}
            </div>

            <style>{`
                .achievement-card {
                    cursor: default;
                }
                .achievement-card.earned:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 8px 8px 0px var(--color-border) !important;
                }
                .share-badge:hover {
                    transform: scale(1.1) rotate(15deg);
                    background-color: #FACC15 !important;
                }
                .smallest { font-size: 11px; }
                .ls-1 { letter-spacing: 1px; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default AchievementCard;






