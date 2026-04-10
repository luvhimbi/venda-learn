import React from 'react';
import { AvatarDisplay } from './AvatarPicker';
import TrophyIcon from './TrophyIcon';

interface SharePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    image?: string;
    category: string;
    trophy?: { rarity: any; color: any } | null;
    userData?: any;
}

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ isOpen, onClose, title, image, category, trophy, userData }) => {
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
                backgroundColor: null
            });

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `LanguagePlatform_${title.replace(/\s+/g, '_')}.png`;
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
                backgroundColor: null
            });

            // 2. Prepare sharing data
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = blob ? new File([blob], `LanguagePlatform_${title.replace(/\s+/g, '_')}.png`, { type: 'image/png' }) : null;
            
            const shareText = `I just learned about ${title} on this language platform!`;

            // 3. Attempt to share with file if supported
            if (navigator.canShare && file && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Language Story',
                    text: shareText,
                });
            } else if (navigator.share) {
                // Fallback to text sharing
                await navigator.share({
                    title: 'Language Story',
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
                    await navigator.share({ title: 'Language Learning Platform', text: `I just learned about ${title} on this language platform!`, url: shareUrl });
                } catch (e) {
                    console.error('Text fallback failed:', e);
                }
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 2000 }}>
            {/* Backdrop */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-75 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="brutalist-card bg-white overflow-hidden shadow-action position-relative animate-pop-in w-100" style={{ maxWidth: '340px' }}>
                
                {/* PREVIEW CARD */}
                <div 
                    id="share-card" 
                    className="position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center border-bottom border-dark border-4" 
                    style={{ background: '#000', color: 'white', padding: '20px 14px' }}
                >
                    {/* Background Accents (Brutalist style) */}
                    <div className="position-absolute" style={{ top: -20, right: -20, width: 80, height: 80, border: '12px solid rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

                    {/* SMALL DOWNLOAD ICON (Top-Left) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="position-absolute top-0 start-0 m-2 btn-game-white rounded-circle d-flex align-items-center justify-content-center z-2 p-0 border border-dark border-2"
                        style={{ width: '28px', height: '28px' }}
                        title="Download"
                    >
                        <i className="bi bi-download text-dark" style={{ fontSize: '12px' }}></i>
                    </button>

                    <div className="position-relative z-1 d-flex flex-column align-items-center text-center w-100 h-100">
                        {/* Branded Logo */}
                        <div className="bg-white p-1.5 px-3 border border-dark border-2 rounded-2 mb-3 shadow-none">
                            <img src="/images/Logo.png" alt="Logo" height="18" className="object-fit-contain" />
                        </div>

                        {/* Visual Asset (Trophy or Image) */}
                        <div className="flex-grow-1 d-flex align-items-center justify-content-center w-100 mb-3 px-2">
                            {trophy ? (
                                <TrophyIcon 
                                    rarity={trophy.rarity} 
                                    size={100} 
                                    color={trophy.color}
                                    animate={true}
                                />
                            ) : image ? (
                                <div className="rounded-3 overflow-hidden shadow-sm w-100 position-relative border border-dark border-2" style={{ minHeight: '140px' }}>
                                    <div 
                                        className="position-absolute top-0 start-0 w-100 h-100"
                                        style={{ 
                                            backgroundImage: `url(${image})`, 
                                            backgroundSize: 'cover', 
                                            backgroundPosition: 'center',
                                        }}
                                    ></div>
                                </div>
                            ) : null}
                        </div>

                        {/* Category Strip */}
                        <div className="d-flex align-items-center gap-2 mb-2 bg-dark rounded-pill p-1 shadow-none border border-white border-opacity-20 pe-3">
                            <div className="flex-shrink-0" style={{ width: '30px', height: '18px', position: 'relative', borderRadius: '9px', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '33%', backgroundColor: '#00703C' }} />
                                <div style={{ position: 'absolute', top: '33%', left: 0, width: '100%', height: '34%', backgroundColor: '#FFB81C' }} />
                                <div style={{ position: 'absolute', top: '67%', left: 0, width: '100%', height: '33%', backgroundColor: '#593C1F' }} />
                            </div>
                            <span className="smallest-print fw-black ls-2 text-warning uppercase">{category}</span>
                        </div>

                        {/* Title & Branding block */}
                        <h1 className="text-white fw-black mb-0 ls-tight px-2" style={{ fontSize: '1.25rem' }}>{title}</h1>
                        
                        {/* Dynamically Include Profile info if available */}
                        {userData && (
                            <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 p-2 rounded-3 mt-3 w-100 justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="bg-white rounded-circle p-0.5 border border-dark border-1" style={{ width: 36, height: 36 }}>
                                        <AvatarDisplay avatarId={userData.avatarId || 'adventurer'} seed={userData.username} size={30} />
                                    </div>
                                    <div className="text-start">
                                        <p className="mb-0 fw-black smallest uppercase ls-1 text-white">{userData.username?.split(' ')[0]}</p>
                                        <p className="mb-0 text-white-50" style={{ fontSize: '8px' }}>LEARNER</p>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <p className="mb-0 fw-black text-warning smallest ls-1">
                                        {userData.points || 0} XP
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-3 bg-white">
                    <div className="d-flex flex-column gap-2">
                        <button 
                            onClick={handleNativeShare}
                            className={`btn btn-game btn-game-primary w-100 py-2.5 shadow-action-sm ${isSharing ? 'opacity-50' : ''}`}
                            disabled={isSharing}
                        >
                            {isSharing ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span> PREPARING...</>
                            ) : (
                                <><i className="bi bi-share-fill me-2"></i> SHARE NOW</>
                            )}
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="btn btn-link text-muted w-100 text-decoration-none smallest-print fw-black ls-2 uppercase mt-1"
                        >
                            MAYBE LATER
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
