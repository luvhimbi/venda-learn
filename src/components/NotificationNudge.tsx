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
        <div className="notification-nudge-container animate__animated animate__fadeInUp mb-4">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden position-relative" 
                 style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                
                {/* Close Button */}
                <button 
                    onClick={handleDismiss}
                    className="position-absolute top-0 end-0 p-3 btn btn-link text-muted opacity-40 hover-opacity-100 border-0"
                    style={{ zIndex: 10 }}
                >
                    <X size={16} />
                </button>

                <div className="card-body p-3 p-md-4">
                    <div className="d-flex align-items-center gap-3 gap-md-4">
                        {/* Small Mascot */}
                        <div className="flex-shrink-0 d-none d-sm-block">
                            <Mascot width="80px" height="80px" mood="excited" />
                        </div>
                        <div className="flex-shrink-0 d-sm-none">
                            <Mascot width="60px" height="60px" mood="excited" />
                        </div>

                        {/* Content */}
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="badge bg-warning bg-opacity-20 text-warning smallest fw-bold ls-1 px-2 border-0">ELPHIE SAYS:</span>
                            </div>
                            <h6 className="fw-black text-dark mb-1 d-flex align-items-center gap-2">
                                Keep the <Flame size={16} className="text-danger shadow-sm" /> burning! 
                            </h6>
                            <p className="smallest fw-bold text-muted uppercase ls-1 mb-3">
                                Get pop-ups to protect your daily streak.
                            </p>
                            
                            <JuicyButton 
                                onClick={() => setShowPrompt(true)}
                                className="btn btn-warning btn-sm border-0 fw-black ls-1 smallest px-4 py-2 rounded-3 shadow-sm"
                            >
                                <Bell size={12} className="me-1 mb-0.5" /> ENABLE POP-UPS
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
                .hover-opacity-100:hover { opacity: 1 !important; }
                .fw-black { font-weight: 900; }
                .ls-1 { letter-spacing: 0.05em; }
                .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }
            `}</style>
        </div>
    );
};

export default NotificationNudge;
