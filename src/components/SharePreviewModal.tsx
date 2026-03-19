import React from 'react';
import TrophyIcon from './TrophyIcon';
import { AvatarDisplay } from './AvatarPicker';

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
                backgroundColor: null
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
                
                {/* PREVIEW CARD (Standardized Modern Style with Venda Flag) */}
                <div 
                    id="share-card" 
                    className="position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center" 
                    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '24px 16px' }}
                >
                    {/* Background Accents (Kept subtle and monochrome to avoid 'minwenda' feel) */}
                    <div className="position-absolute rounded-circle" style={{ width: 250, height: 250, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%)', top: '-80px', right: '-50px' }}></div>
                    <div className="position-absolute rounded-circle" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 70%)', bottom: '-100px', left: '-100px' }}></div>

                    {/* SMALL DOWNLOAD ICON (Top-Left) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                        className="position-absolute top-0 start-0 m-3 btn btn-white bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center z-2 p-0"
                        style={{ width: '32px', height: '32px', border: 'none' }}
                        title="Download Image"
                    >
                        <i className="bi bi-download text-dark" style={{ fontSize: '14px' }}></i>
                    </button>

                    <div className="position-relative z-1 d-flex flex-column align-items-center text-center w-100 h-100">
                        {/* Branded Logo */}
                        <div className="d-flex align-items-center justify-content-center mb-3 mt-2">
                            <div className="bg-white p-2 rounded-3 shadow-sm d-inline-block">
                                <img src="/images/VendaLearnLogo.png" alt="VendaLearn" height="28" className="object-fit-contain" />
                            </div>
                        </div>

                        {/* Visual Asset (Trophy or Image) */}
                        <div className="flex-grow-1 d-flex align-items-center justify-content-center w-100 mb-3 px-3">
                            {trophy ? (
                                <TrophyIcon rarity={trophy.rarity} color={trophy.color} size={100} animate={false} />
                            ) : image ? (
                                <div className="rounded-4 overflow-hidden shadow-lg w-100 position-relative" style={{ minHeight: '160px', border: '4px solid rgba(255,255,255,0.1)' }}>
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

                        {/* Custom Programmatic Venda Flag Strip */}
                        <div className="d-flex align-items-center gap-2 mb-2 bg-dark rounded-pill p-1 shadow-sm border border-secondary border-opacity-25 pe-3">
                            <div className="flex-shrink-0" style={{ width: '40px', height: '24px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Horizontal Stripes */}
                                <div style={{ position: 'absolute', top: 0, left: '10px', right: 0, height: '33%', backgroundColor: '#00703C' }} /> {/* Green */}
                                <div style={{ position: 'absolute', top: '33%', left: '10px', right: 0, height: '34%', backgroundColor: '#FFB81C' }} /> {/* Yellow */}
                                <div style={{ position: 'absolute', top: '67%', left: '10px', right: 0, height: '33%', backgroundColor: '#593C1F' }} /> {/* Brown */}
                                {/* Vertical Blue Hoist */}
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '100%', backgroundColor: '#00529F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Brown V embedded inside the blue strip */}
                                    <span style={{ color: '#593C1F', fontSize: '9px', fontWeight: '900', userSelect: 'none' }}>V</span>
                                </div>
                            </div>
                            <span className="smallest fw-bold ls-2 text-warning uppercase">{category}</span>
                        </div>

                        {/* Title & Branding block */}
                        <h1 className="text-white fw-bold mb-0 ls-tight px-3" style={{ fontSize: '1.75rem', lineHeight: '1.1' }}>{title}</h1>
                        
                        {/* Dynamically Include Profile info if available */}
                        {userData && (
                            <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 shadow-sm p-3 rounded-4 mt-4 w-100 justify-content-between border border-white border-opacity-10 backdrop-blur-sm">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-white rounded-circle p-1 shadow-sm" style={{ width: 44, height: 44 }}>
                                        <AvatarDisplay avatarId={userData.avatarId || 'adventurer'} seed={userData.username} size={36} />
                                    </div>
                                    <div className="text-start">
                                        <p className="mb-0 fw-bold">{userData.username?.split(' ')[0]}</p>
                                        <p className="smallest text-white-50 mb-0 ls-1 text-uppercase">Venda Learner</p>
                                    </div>
                                </div>
                                <div className="text-end pe-1">
                                    <p className="mb-0 fw-bold text-warning d-flex align-items-center gap-1 justify-content-end">
                                        {userData.points || 0} <span className="smallest text-white-50">XP</span>
                                    </p>
                                </div>
                            </div>
                        )}
                        {!userData && <p className="smallest text-white-50 mt-2 mb-0 uppercase ls-2">VendaLearn Platform</p>}
                    </div>
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
