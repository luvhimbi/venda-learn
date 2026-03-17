import React from 'react';
import Mascot from './Mascot';
import TrophyIcon from './TrophyIcon';

interface SharePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    image?: string;
    category: string;
    trophy?: {
        rarity: 'bronze' | 'silver' | 'gold' | 'special';
        color: string;
    } | null;
}

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ isOpen, onClose, title, image, category, trophy }) => {
    if (!isOpen) return null;

    const shareUrl = window.location.href;

    const handleNativeShare = async () => {
        const shareText = trophy 
            ? `I just earned the "${title}" trophy on Venda Learn! 🏅`
            : `I just learned about ${title} on Venda Learn!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: trophy ? 'My Achievement' : 'Venda Learn Story',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000 }}>
            {/* Backdrop */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-75"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-5 overflow-hidden shadow-2xl position-relative animate-pop-in" style={{ width: '92%', maxWidth: '340px' }}>
                
                {/* PREVIEW CARD (Spotify Style) */}
                <div id="share-card" className="position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center" style={{ aspectRatio: '1/1', backgroundColor: trophy ? '#1e293b' : '#111827' }}>
                    {/* Background Image with Overlay */}
                    {!trophy && image && (
                        <>
                            <div 
                                className="position-absolute top-0 start-0 w-100 h-100"
                                style={{ 
                                    backgroundImage: `url(${image})`, 
                                    backgroundSize: 'cover', 
                                    backgroundPosition: 'center',
                                    filter: 'brightness(0.6) saturate(1.2)' 
                                }}
                            ></div>
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        </>
                    )}

                    {/* Trophy Preview Layer */}
                    {trophy && (
                        <div className="position-relative z-1 mb-5 pb-3">
                            <TrophyIcon rarity={trophy.rarity} color={trophy.color} size={150} animate />
                        </div>
                    )}

                    {/* Content Layer */}
                    <div className="position-absolute bottom-0 start-0 w-100 p-3 text-start z-1">
                        <span className="smallest fw-bold ls-2 text-warning uppercase d-block mb-1">{category}</span>
                        <h1 className="text-white fw-bold mb-2 ls-tight" style={{ fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{title}</h1>
                        
                        <div className="d-flex align-items-center gap-2 pt-2 border-top border-white border-opacity-25">
                            <div className="p-1 bg-white rounded-3 shadow-lg">
                                <Mascot mood="happy" width="28px" height="28px" />
                            </div>
                            <div>
                                <p className="text-white mb-0 fw-bold ls-1" style={{ fontSize: '8px' }}>VENDA LEARN</p>
                                <p className="text-white text-opacity-75 mb-0" style={{ fontSize: '8px' }}>Learning my heritage</p>
                            </div>
                        </div>
                    </div>

                    {/* Munwenda Accent */}
                    <div className="position-absolute top-0 start-0 w-100" style={{ height: '4px', background: 'linear-gradient(90deg, #FACC15, #10B981, #EF4444, #3B82F6, #111827)' }}></div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-white">
                    <button 
                        onClick={handleNativeShare}
                        className="btn btn-primary w-100 rounded-pill py-2 fw-bold ls-1 uppercase mb-1 shadow-sm"
                        style={{ fontSize: '11px' }}
                    >
                        <i className="bi bi-share-fill me-2"></i> Share Now
                    </button>
                    <button 
                        onClick={onClose}
                        className="btn btn-link text-muted w-100 text-decoration-none smallest fw-bold ls-1 uppercase"
                    >
                        Maybe later
                    </button>
                </div>
            </div>

            <style>{`
                .animate-pop-in {
                    animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .shadow-2xl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
};

export default SharePreviewModal;
