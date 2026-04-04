import React, { useState, useEffect } from 'react';
import { Bell, Shield, X, Flame } from 'lucide-react';
import JuicyButton from './JuicyButton';
import { requestNotificationPermission } from '../services/reminderService';
import Swal from 'sweetalert2';

interface NotificationPromptProps {
    onClose: () => void;
    onStatusChange?: (granted: boolean) => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onClose, onStatusChange }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleEnable = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            Swal.fire({
                title: 'You\'re All Set!',
                text: 'We\'ll send you helpful reminders to keep your streak alive!',
                icon: 'success',
                confirmButtonColor: '#FACC15',
                customClass: { popup: 'rounded-4' }
            });
            if (onStatusChange) onStatusChange(true);
            handleClose();
        } else {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You can enable notifications later in your browser settings if you change your mind.',
                icon: 'info',
                confirmButtonColor: '#111827'
            });
            if (onStatusChange) onStatusChange(false);
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 400); // Wait for animation
    };

    return (
        <div 
            className={`notification-prompt-overlay d-flex align-items-center justify-content-center px-3 ${isVisible ? 'active' : ''}`}
            onClick={handleClose}
        >
            <div 
                className={`notification-prompt-card bg-white rounded-5 shadow-2xl p-5 text-center position-relative overflow-hidden ${isVisible ? 'active' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '440px', border: '3px solid #F1F5F9' }}
            >
                {/* Decorative Elements */}
                <div className="position-absolute top-0 start-0 w-100 h-2 bg-warning opacity-10"></div>
                <div className="position-absolute top-0 end-0 p-3">
                    <button 
                        onClick={handleClose}
                        className="btn btn-link p-2 text-muted hover-up rounded-circle transition-all border-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-4 d-inline-flex p-4 rounded-circle bg-warning bg-opacity-10 text-warning animate-bounce-subtle">
                    <Bell size={48} strokeWidth={2.5} />
                </div>

                <h2 className="fw-black text-dark mb-3 ls-tight" style={{ fontSize: '1.8rem' }}>
                    Stay Connected!
                </h2>
                
                <p className="text-muted mb-5 px-md-3" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                    Don't let your <span className="fw-bold text-danger"><Flame size={18} className="d-inline mb-1" /> streak</span> freeze! Get notified when it's time for your daily lesson.
                </p>

                <div className="d-flex flex-column gap-3">
                    <JuicyButton 
                        onClick={handleEnable}
                        className="w-100 py-3 rounded-pill bg-warning border-0 text-dark fw-black ls-1 shadow-lg"
                    >
                        ENABLE POP-UPS
                    </JuicyButton>
                    
                    <button 
                        onClick={handleClose}
                        className="btn btn-link text-muted fw-bold smallest text-uppercase ls-2 text-decoration-none hover-up"
                    >
                        Maybe Later
                    </button>
                </div>

                <div className="mt-5 pt-4 border-top">
                    <div className="d-flex align-items-center justify-content-center gap-2 text-muted smallest fw-bold ls-1 uppercase opacity-60">
                        <Shield size={14} />
                        <span>Private & Secure via Firebase</span>
                    </div>
                </div>
            </div>

            <style>{`
                .notification-prompt-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(15, 23, 42, 0.0);
                    backdrop-filter: blur(0px);
                    z-index: 9999;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    pointer-events: none;
                }
                
                .notification-prompt-overlay.active {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    pointer-events: auto;
                }
                
                .notification-prompt-card {
                    transform: translateY(100px) scale(0.9);
                    opacity: 0;
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .notification-prompt-card.active {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s infinite ease-in-out;
                }
                
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                .ls-tight { letter-spacing: -0.02em; }
                .ls-1 { letter-spacing: 0.05em; }
                .ls-2 { letter-spacing: 0.1em; }
                .fw-black { font-weight: 900; }
                
                .hover-up:hover {
                    transform: translateY(-2px);
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default NotificationPrompt;
