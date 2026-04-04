import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { AvatarDisplay } from './AvatarPicker';
import TrophyIcon from './TrophyIcon';
import { ALL_TROPHIES } from '../services/achievementService';

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
    inviteLink: string;
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, userData, inviteLink }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen || !userData) return null;

    const handleShareImage = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: null,
            });
            
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob generation failed');
                const file = new File([blob], `LanguagePlatform_Profile_${userData.username}.png`, { type: 'image/png' });
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'My Language Learning Profile',
                            text: 'Check out my progress on this language platform!',
                            url: inviteLink,
                            files: [file]
                        });
                        onClose();
                    } catch (err) {
                        console.error('Share failed, falling back to text share', err);
                        // Fallback to text share
                        if (navigator.share) {
                            await navigator.share({ title: 'My Language Learning Profile', text: 'Check out my progress on this language platform!', url: inviteLink });
                        }
                    }
                } else if (navigator.share) {
                    // Fallback to text share
                    await navigator.share({ title: 'My Language Learning Profile', text: 'Check out my progress on this language platform!', url: inviteLink });
                } else {
                    // Fallback completely to download only if share API isn't present
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
        link.download = `LanguagePlatform_Profile_${userData.username}.png`;
        link.click();
        URL.revokeObjectURL(imageObjectURL);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Get top 3 trophies
    const topTrophies = [...ALL_TROPHIES]
        .filter(t => (userData.trophies || []).includes(t.id))
        .slice(0, 3);

    return (
        <div className="modal-overlay d-flex align-items-center justify-content-center" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content-wrapper rounded-4 bg-white p-4 shadow-lg position-relative" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="btn-close-modal border-0 bg-light text-muted rounded-circle position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center transition-all" style={{ width: 32, height: 32 }}>
                    <X size={18} />
                </button>

                <div className="text-center mb-4">
                    <h5 className="fw-bold text-dark ls-tight mb-1">Share Your Journey</h5>
                    <p className="small text-muted mb-0">Download or share your profile card.</p>
                </div>

                {/* THE CARD TO BE SNAPSHOTTED */}
                <div 
                    ref={cardRef} 
                    className="share-card-container position-relative overflow-hidden rounded-4 shadow-sm mb-4"
                    style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '24px 16px' }}
                >
                    {/* Background Accents */}
                    <div className="position-absolute rounded-circle" style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%)', top: '-50px', right: '-50px' }}></div>
                    <div className="position-absolute rounded-circle" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 70%)', bottom: '-100px', left: '-100px' }}></div>

                    {/* Download Icon (Top-Left) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleManualDownload(); }}
                        className="position-absolute top-0 start-0 m-3 btn btn-white bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center z-2 p-0"
                        style={{ width: '32px', height: '32px', border: 'none' }}
                        title="Download Image"
                        disabled={isDownloading}
                    >
                        <i className={`bi bi-download text-dark ${isDownloading ? 'opacity-50' : ''}`} style={{ fontSize: '14px' }}></i>
                    </button>

                    <div className="position-relative z-1 d-flex flex-column align-items-center text-center">
                        {/* Logo / Header */}
                        <div className="d-flex align-items-center justify-content-center mb-4">
                            <div className="bg-white p-2 rounded-3 shadow-sm d-inline-block">
                                <img src="/images/Logo.png" alt="Language Platform" height="32" className="object-fit-contain" />
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="bg-white rounded-circle p-1 mb-3" style={{ width: 80, height: 80 }}>
                            <AvatarDisplay avatarId={userData.avatarId || 'adventurer'} seed={userData.username} size={72} />
                        </div>

                        {/* User Info */}
                        <h3 className="fw-bold mb-1">{userData.username?.split(' ')[0]}</h3>
                        <div className="d-inline-flex bg-warning bg-opacity-25 text-warning px-3 py-1 rounded-pill smallest fw-bold ls-1 mb-4">
                            LEVEL {userData.level || 1} SCHOLAR
                        </div>

                        {/* Stats Row */}
                        <div className="d-flex justify-content-center gap-4 mb-4 pb-3 border-bottom border-secondary border-opacity-50 w-100">
                            <div>
                                <h4 className="fw-bold text-white mb-0">{userData.points || 0}</h4>
                                <p className="smallest text-white-50 text-uppercase ls-1 mb-0">Total XP</p>
                            </div>
                            <div>
                                <h4 className="fw-bold text-danger mb-0 d-flex align-items-center justify-content-center gap-1">
                                    <i className="bi bi-fire"></i> {userData.streak || 0}
                                </h4>
                                <p className="smallest text-white-50 text-uppercase ls-1 mb-0">Day Streak</p>
                            </div>
                        </div>

                        {/* Badges / QR Area */}
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex flex-column align-items-start">
                                <p className="smallest text-white-50 text-uppercase ls-1 mb-2">Top Trophies</p>
                                <div className="d-flex gap-2">
                                    {topTrophies.length > 0 ? topTrophies.map(t => (
                                        <div key={t.id} className="bg-white bg-opacity-10 p-2 rounded-3">
                                            <TrophyIcon rarity={t.rarity as any} size={28} color={t.color} animate={false} />
                                        </div>
                                    )) : (
                                        <p className="smallest text-muted italic mb-0">Just started learning!</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white p-2 rounded-3 text-center">
                                <QRCodeSVG value={inviteLink} size={60} level="M" includeMargin={false} />
                                <p className="mb-0 text-dark fw-bold" style={{ fontSize: '7px', marginTop: '4px' }}>SCAN TO JOIN</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                    <button 
                        onClick={handleShareImage} 
                        disabled={isDownloading}
                        className="btn w-100 py-3 rounded-3 fw-bold ls-1 d-flex align-items-center justify-content-center gap-2 transition-all hover-lift"
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
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalReveal {
                    from { opacity: 0; transform: scale(0.95) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .btn-close-modal:hover {
                    background: #e2e8f0 !important;
                    color: #0f172a !important;
                }
            `}</style>
        </div>
    );
};

export default ShareProfileModal;
