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
                const file = new File([blob], `LanguagePlatform_Streak_${userData.username}.png`, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'My Language Learning Streak',
                            text: `I am on a ${userData.streak || 0} day streak on this language platform! Join me!`,
                            url: inviteLink,
                            files: [file]
                        });
                        onClose();
                    } catch (err) {
                        console.error('Share failed, falling back to text share', err);
                        if (navigator.share) {
                            await navigator.share({ title: 'My Language Learning Streak', text: `I am on a ${userData.streak || 0} day streak on this language platform! Join me!`, url: inviteLink });
                        }
                    }
                } else if (navigator.share) {
                    await navigator.share({ title: 'My Language Learning Streak', text: `I am on a ${userData.streak || 0} day streak on this language platform! Join me!`, url: inviteLink });
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
        link.download = `LanguagePlatform_Streak_${userData.username}.png`;
        link.click();
        URL.revokeObjectURL(imageObjectURL);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="modal-overlay d-flex align-items-center justify-content-center p-3" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="brutalist-card bg-white p-3 p-md-4 shadow-action position-relative w-100" style={{ maxWidth: '340px' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="btn-game-white rounded-circle position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center transition-all border border-dark border-2" style={{ width: 32, height: 32 }}>
                    <X size={16} strokeWidth={3} />
                </button>

                <div className="text-center mb-3">
                    <h5 className="fw-black text-dark uppercase ls-tight mb-1" style={{ fontSize: '1.25rem' }}>Flex Your Streak</h5>
                    <p className="smallest fw-bold text-muted uppercase ls-1 mb-0">Share your persistence!</p>
                </div>

                {/* THE CARD TO BE SNAPSHOTTED */}
                <div
                    ref={cardRef}
                    className="share-card-container position-relative overflow-hidden border border-dark border-3 rounded-3 mb-3 shadow-sm"
                    style={{ background: '#000', color: 'white', padding: '20px 14px' }}
                >
                    {/* Background Accents (Brutalist style) */}
                    <div className="position-absolute" style={{ top: -20, right: -20, width: 100, height: 100, border: '15px solid rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

                    {/* Download Icon (Top-Left) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleManualDownload(); }}
                        className="position-absolute top-0 start-0 m-2 btn-game-white rounded-circle d-flex align-items-center justify-content-center z-2 p-0 border border-dark border-2"
                        style={{ width: '28px', height: '28px' }}
                        title="Download"
                        disabled={isDownloading}
                    >
                        <i className={`bi bi-download text-dark ${isDownloading ? 'opacity-50' : ''}`} style={{ fontSize: '12px' }}></i>
                    </button>

                    <div className="position-relative z-1 d-flex flex-column align-items-center text-center">
                        {/* Logo */}
                        <div className="bg-white p-1.5 px-3 border border-dark border-2 rounded-2 mb-3 shadow-none">
                            <img src="/images/Logo.png" alt="Logo" height="18" className="object-fit-contain" />
                        </div>

                        {/* Fire Icon */}
                        <div className="mb-1">
                            <Flame size={48} className="text-warning" fill="#facc15" strokeWidth={2.5} />
                        </div>

                        <h1 className="fw-black mb-0 text-white ls-tight" style={{ fontSize: '3rem' }}>
                            {userData.streak || 0}
                        </h1>
                        <h4 className="fw-black text-warning uppercase ls-2 mb-3" style={{ fontSize: '0.9rem' }}>DAY STREAK</h4>

                        <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 border border-white border-opacity-20 p-2 rounded-3 w-100 justify-content-between mb-3">
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-white rounded-circle p-0.5 border border-dark border-1" style={{ width: 36, height: 36 }}>
                                    <AvatarDisplay avatarId={userData.avatarId || 'adventurer'} seed={userData.username} size={30} />
                                </div>
                                <div className="text-start">
                                    <p className="mb-0 fw-black smallest uppercase ls-1 text-white">{userData.username?.split(' ')[0]}</p>
                                    <p className="mb-0 text-white-50" style={{ fontSize: '8px' }}>SCHOLAR</p>
                                </div>
                            </div>
                            <div className="text-end">
                                <p className="mb-0 fw-black text-warning smallest ls-1">
                                    {userData.points || 0} XP
                                </p>
                            </div>
                        </div>

                        {/* QR Area */}
                        <div className="bg-white p-1.5 border border-dark border-2 rounded-2 text-center">
                            <QRCodeSVG value={inviteLink} size={44} level="M" />
                            <p className="mb-0 text-dark fw-black" style={{ fontSize: '6.5px', marginTop: '4px', letterSpacing: '0.5px' }}>SCAN TO JOIN</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                    <button
                        onClick={handleShareImage}
                        disabled={isDownloading}
                        className="btn btn-game btn-game-primary w-100 py-2.5 shadow-action-sm"
                    >
                        {isDownloading ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            <><Share2 size={16} /> SHARE TO SOCIALS</>
                        )}
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className={`btn btn-game ${isCopied ? 'bg-success text-white' : 'btn-game-white'} w-100 py-2.5 shadow-action-sm`}
                    >
                        {isCopied ? <><Check size={16} /> COPIED!</> : <><Copy size={16} /> COPY INVITE LINK</>}
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
