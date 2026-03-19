import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2, Flame } from 'lucide-react';
import { AvatarDisplay } from './AvatarPicker';

interface ShareStreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
    inviteLink: string;
}

const ShareStreakModal: React.FC<ShareStreakModalProps> = ({ isOpen, onClose, userData, inviteLink }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen || !userData) return null;

    const handleShareImage = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, 
                useCORS: true,
                backgroundColor: null,
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob generation failed');
                const file = new File([blob], `VendaLearn_Streak_${userData.username}.png`, { type: 'image/png' });
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'My VendaLearn Streak',
                            text: `I am on a ${userData.streak || 0} day streak on VendaLearn! Join me!`,
                            url: inviteLink,
                            files: [file]
                        });
                        onClose();
                    } catch (err) {
                        console.error('Share failed, falling back to text share', err);
                        if (navigator.share) {
                            await navigator.share({ title: 'My VendaLearn Streak', text: `I am on a ${userData.streak || 0} day streak on VendaLearn! Join me!`, url: inviteLink });
                        }
                    }
                } else if (navigator.share) {
                    await navigator.share({ title: 'My VendaLearn Streak', text: `I am on a ${userData.streak || 0} day streak on VendaLearn! Join me!`, url: inviteLink });
                } else {
                    downloadBlob(blob);
                }
                setIsDownloading(false);
            }, 'image/png');
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('Failed to generate image. Please try again.');
            setIsDownloading(false);
        }
    };

    const handleManualDownload = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, 
                useCORS: true,
                backgroundColor: null,
            });
            canvas.toBlob((blob) => {
                if (blob) downloadBlob(blob);
                setIsDownloading(false);
            }, 'image/png');
        } catch (e) {
            console.error('Download failed', e);
            setIsDownloading(false);
        }
    }

    const downloadBlob = (blob: Blob) => {
        const imageObjectURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = imageObjectURL;
        link.download = `VendaLearn_Streak_${userData.username}.png`;
        link.click();
        URL.revokeObjectURL(imageObjectURL);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="modal-overlay d-flex align-items-center justify-content-center" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content-wrapper rounded-4 bg-white p-4 shadow-lg position-relative" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="btn-close-modal border-0 bg-light text-muted rounded-circle position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center transition-all" style={{ width: 32, height: 32 }}>
                    <X size={18} />
                </button>

                <div className="text-center mb-4">
                    <h5 className="fw-bold text-dark ls-tight mb-1">Flex Your Streak</h5>
                    <p className="small text-muted mb-0">Share your persistence with the world!</p>
                </div>

                {/* THE CARD TO BE SNAPSHOTTED */}
                <div 
                    ref={cardRef} 
                    className="share-card-container position-relative overflow-hidden rounded-4 shadow-sm mb-4"
                    style={{ background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)', color: 'white', padding: '24px 16px' }}
                >
                    {/* Background Accents */}
                    <div className="position-absolute rounded-circle" style={{ width: 250, height: 250, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%)', top: '-80px', right: '-50px' }}></div>
                    <div className="position-absolute rounded-circle" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 70%)', bottom: '-100px', left: '-100px' }}></div>

                    {/* Download Icon (Top-Left) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleManualDownload(); }}
                        className="position-absolute top-0 start-0 m-3 btn btn-white bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center z-2 p-0"
                        style={{ width: '32px', height: '32px', border: 'none' }}
                        title="Download Image"
                        disabled={isDownloading}
                    >
                        <i className={`bi bi-download text-danger ${isDownloading ? 'opacity-50' : ''}`} style={{ fontSize: '14px' }}></i>
                    </button>

                    <div className="position-relative z-1 d-flex flex-column align-items-center text-center">
                        {/* Logo / Header */}
                        <div className="d-flex align-items-center justify-content-center mb-3">
                            <div className="bg-white p-2 rounded-3 shadow-sm d-inline-block">
                                <img src="/images/VendaLearnLogo.png" alt="VendaLearn" height="24" className="object-fit-contain" />
                            </div>
                        </div>

                        {/* Fire Icon */}
                        <div className="mb-1">
                            <Flame size={56} className="text-warning" fill="#facc15" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.5))' }} />
                        </div>
                        
                        <h1 className="fw-bold mb-0 text-white" style={{ fontSize: '3.5rem', lineHeight: '1', letterSpacing: '-2px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {userData.streak || 0}
                        </h1>
                        <h4 className="fw-bold text-white-50 text-uppercase ls-2 mb-3" style={{ letterSpacing: '4px', fontSize: '1rem' }}>DAY STREAK</h4>

                        <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 shadow-sm p-2 rounded-4 w-100 justify-content-between mb-3 border border-white border-opacity-10 backdrop-blur-sm">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white rounded-circle p-1 shadow-sm" style={{ width: 44, height: 44 }}>
                                    <AvatarDisplay avatarId={userData.avatarId || 'adventurer'} seed={userData.username} size={36} />
                                </div>
                                <div className="text-start">
                                    <p className="mb-0 fw-bold">{userData.username?.split(' ')[0]}</p>
                                    <p className="smallest text-white-50 mb-0 ls-1 text-uppercase">Scholar</p>
                                </div>
                            </div>
                            <div className="text-end pe-1">
                                <p className="mb-0 fw-bold text-warning d-flex align-items-center gap-1 justify-content-end">
                                    {userData.points || 0} <span className="smallest text-white-50">XP</span>
                                </p>
                            </div>
                        </div>

                        {/* Badges / QR Area */}
                        <div className="d-flex align-items-center justify-content-center w-100 mt-1">
                            <div className="bg-white p-2 text-center shadow" style={{ borderRadius: '12px' }}>
                                <QRCodeSVG value={inviteLink} size={52} level="M" includeMargin={false} />
                                <p className="mb-0 text-dark fw-bold" style={{ fontSize: '7.5px', marginTop: '6px', letterSpacing: '1px' }}>SCAN TO JOIN</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                    <button 
                        onClick={handleShareImage} 
                        disabled={isDownloading}
                        className="btn w-100 py-3 rounded-3 fw-bold ls-1 d-flex align-items-center justify-content-center gap-2 transition-all hover-lift shadow-sm"
                        style={{ backgroundColor: '#FACC15', border: 'none', color: '#111827' }}
                    >
                        {isDownloading ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            <><Share2 size={18} /> SHARE TO SOCIALS</>
                        )}
                    </button>
                    
                    <button 
                        onClick={handleCopyLink} 
                        className={`btn ${isCopied ? 'btn-success' : 'btn-outline-dark'} w-100 py-3 rounded-3 fw-bold ls-1 d-flex align-items-center justify-content-center gap-2 transition-all`}
                    >
                        {isCopied ? <><Check size={18} /> COPIED!</> : <><Copy size={18} /> COPY INVITE LINK</>}
                    </button>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.2s ease-out;
                }
                .modal-content-wrapper {
                    animation: modalReveal 0.3s cubic-bezier(0.19, 1, 0.22, 1);
                }
                .backdrop-blur-sm {
                    backdrop-filter: blur(8px);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalReveal {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .btn-close-modal:hover {
                    background: #e2e8f0 !important;
                    color: #0f172a !important;
                }
                .hover-lift:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            `}</style>
        </div>
    );
};

export default ShareStreakModal;
