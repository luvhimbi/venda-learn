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
    const [isSharing, setIsSharing] = React.useState(false);
    if (!isOpen) return null;

    const shareUrl = window.location.href;

    const handleDownload = async () => {
        const element = document.getElementById('share-card');
        if (!element) return;

        try {
            // Load html2canvas dynamically if not already present
            if (!(window as any).html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const canvas = await (window as any).html2canvas(element, {
                useCORS: true,
                scale: 2, // Higher quality
                backgroundColor: trophy ? '#1e293b' : '#111827'
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `VendaLearn_${title.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const handleNativeShare = async () => {
        if (isSharing) return;
        const element = document.getElementById('share-card');
        if (!element) return;

        setIsSharing(true);
        try {
            // 1. Generate the canvas
            if (!(window as any).html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const canvas = await (window as any).html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: trophy ? '#1e293b' : '#111827'
            });

            // 2. Prepare sharing data
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = blob ? new File([blob], `VendaLearn_${title.replace(/\s+/g, '_')}.png`, { type: 'image/png' }) : null;
            
            const shareText = trophy 
                ? `I just earned the "${title}" trophy on Venda Learn! 🏅`
                : `I just learned about ${title} on Venda Learn!`;

            // 3. Attempt to share with file if supported
            if (navigator.canShare && file && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: trophy ? 'My Achievement' : 'Venda Learn Story',
                    text: shareText,
                });
            } else if (navigator.share) {
                // Fallback to text sharing
                await navigator.share({
                    title: trophy ? 'My Achievement' : 'Venda Learn Story',
                    text: shareText,
                    url: shareUrl,
                });
            } else {
                // Clipboard fallback
                navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard! (Download the image below to share manually)');
            }
        } catch (err) {
            console.error('Sharing failed:', err);
            // Final fallback to text sharing if process fails
            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Venda Learn', text: `I just learned about ${title} on Venda Learn!`, url: shareUrl });
                } catch (e) {
                    console.error('Text fallback failed:', e);
                }
            }
        } finally {
            setIsSharing(false);
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
                
                {/* PREVIEW CARD (Branded Style) */}
                <div id="share-card" className="position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center" style={{ aspectRatio: '1/1', backgroundColor: trophy ? '#1e293b' : '#111827' }}>
                    {/* Branded Logo Overlay (Top-Right) - Wrapped for Visibility */}
                    <div className="position-absolute top-0 end-0 p-3 z-2">
                        <div className="bg-white p-1 rounded-2 shadow-sm d-flex align-items-center">
                            <img src="/images/VendaLearnLogo.png" alt="Logo" height="18" className="object-fit-contain" />
                        </div>
                    </div>

                    {/* SMALL DOWNLOAD ICON (Top-Left) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="position-absolute top-0 start-0 m-3 btn btn-white bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center z-2 p-0"
                        style={{ width: '32px', height: '32px', border: 'none' }}
                        title="Download Image"
                    >
                        <i className="bi bi-download text-dark" style={{ fontSize: '14px' }}></i>
                    </button>

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
                <div className="px-4 py-4 bg-white">
                    <div className="d-flex flex-column gap-2">
                        <button 
                            onClick={handleNativeShare}
                            className={`btn btn-primary w-100 rounded-pill py-3 fw-bold ls-1 uppercase shadow-lg display-6 ${isSharing ? 'opacity-50 pointer-events-none' : 'animate__animated animate__pulse animate__infinite'}`}
                            style={{ fontSize: '14px', backgroundColor: '#FACC15', border: 'none', color: '#111827' }}
                            disabled={isSharing}
                        >
                            {isSharing ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span> Preparing...</>
                            ) : (
                                <><i className="bi bi-share-fill me-2"></i> Share Now</>
                            )}
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="btn btn-link text-muted w-100 text-decoration-none smallest fw-bold ls-1 uppercase mt-2"
                        >
                            Maybe later
                        </button>
                    </div>
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
