import React, { useState, useEffect } from 'react';
import Mascot from './Mascot';
import JuicyButton from './JuicyButton';
import { Bell, Flame, X } from 'lucide-react';
import NotificationPrompt from './NotificationPrompt';

const NotificationNudge: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Only show if not granted and not already dismissed in this session
        const isGranted = 'Notification' in window && Notification.permission === 'granted';
        const sessionDismissed = sessionStorage.getItem('nudge_dismissed');
        
        if (!isGranted && !sessionDismissed && !dismissed) {
            // Slight delay for smooth appearance
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [dismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('nudge_dismissed', 'true');
        setTimeout(() => setDismissed(true), 500);
    };

    if (!isVisible || dismissed) return null;

    return (
        <div className="notification-nudge-container animate__animated animate__fadeInUp mb-4 position-relative" style={{ zIndex: 10 }}>
            <div className="brutalist-card bg-theme-surface border-theme-main border-4 shadow-action-lg overflow-hidden position-relative p-0" 
                 style={{ borderStyle: 'solid' }}>
                
                {/* Close Button */}
                <button 
                    onClick={handleDismiss}
                    className="position-absolute top-0 end-0 p-3 btn btn-link text-theme-main opacity-40 hover-scale border-0"
                    style={{ zIndex: 10 }}
                >
                    <X size={20} strokeWidth={3} />
                </button>

                <div className="card-body p-3 p-md-4">
                    <div className="d-flex align-items-center gap-3 gap-md-4">
                        {/* Small Mascot */}
                        <div className="flex-shrink-0 d-none d-sm-block">
                            <Mascot width="100px" height="100px" mood="excited" className="brutalist-card bg-white p-1 border-2" />
                        </div>
                        <div className="flex-shrink-0 d-sm-none">
                            <Mascot width="70px" height="70px" mood="excited" className="brutalist-card bg-white p-1 border-2" />
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="badge bg-warning text-dark smallest fw-black ls-1 px-3 py-1 border border-dark border-2 uppercase">CHOMMIE SAYS:</span>
                            </div>
                            <h5 className="fw-black text-theme-main mb-1 d-flex align-items-center gap-2 uppercase ls-tight">
                                Keep the <Flame size={20} className="text-danger" strokeWidth={3} /> burning! 
                            </h5>
                            <p className="smallest fw-bold text-theme-muted uppercase ls-1 mb-3">
                                Get pop-ups to protect your daily streak.
                            </p>
                            
                            <JuicyButton 
                                onClick={() => setShowPrompt(true)}
                                className="btn-game btn-game-warning btn-sm border-0 fw-black ls-1 smallest px-4 py-2 rounded-3 shadow-action-sm uppercase"
                            >
                                <Bell size={14} strokeWidth={3} className="me-1 mb-0.5" /> ENABLE POP-UPS
                            </JuicyButton>
                        </div>
                    </div>
                </div>
            </div>

            {showPrompt && (
                <NotificationPrompt 
                    onClose={() => setShowPrompt(false)}
                    onStatusChange={(granted) => {
                        if (granted) handleDismiss();
                    }}
                />
            )}

            <style>{`
                .notification-nudge-container {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .hover-scale:hover { 
                    transform: scale(1.1);
                    opacity: 1 !important; 
                }
                .fw-black { font-weight: 900; }
                .ls-1 { letter-spacing: 0.05em; }
                .ls-tight { letter-spacing: -1px; }
                .shadow-action-lg { box-shadow: 12px 12px 0px var(--color-border); }
                .shadow-action-sm { box-shadow: 4px 4px 0px var(--color-border); }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default NotificationNudge;
