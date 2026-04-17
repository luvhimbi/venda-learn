import React, { useState, useEffect } from 'react';
import { Bell, Shield, X, Flame } from 'lucide-react';
import JuicyButton from '../../../components/ui/JuicyButton/JuicyButton';
import Swal from 'sweetalert2';
import { requestNotificationPermission } from '../services/reminderService';

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
                className={`notification-prompt-card bg-theme-surface rounded-4 shadow-action-lg p-4 p-md-5 text-center position-relative overflow-hidden ${isVisible ? 'active' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '480px', border: '4px solid var(--color-border)' }}
            >
                {/* Decorative Elements */}
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--venda-yellow) 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                
                <div className="position-absolute top-0 end-0 p-3 z-3">
                    <button 
                        onClick={handleClose}
                        className="btn btn-link p-2 text-theme-main hover-scale rounded-circle transition-all border-0"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div className="position-relative z-1 d-flex flex-column align-items-center">
                    <div className="mb-4 p-4 rounded-4 bg-warning bg-opacity-20 text-theme-main border-theme-main border-3 border animate-bounce-subtle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', borderStyle: 'solid' }}>
                        <Bell size={48} strokeWidth={3} className="text-warning" />
                    </div>

                    <h2 className="fw-black text-theme-main mb-2 ls-tight uppercase display-6">
                        Stay Connected!
                    </h2>
                    
                    <p className="text-theme-muted mb-5 px-md-3 fw-bold ls-tight" style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>
                        Don't let your <span className="fw-black text-danger"><Flame size={20} className="d-inline mb-1" /> streak</span> freeze! Get notified when it's time for your daily lesson.
                    </p>

                    <div className="d-flex flex-column gap-3 w-100 px-md-4">
                        <JuicyButton 
                            onClick={handleEnable}
                            className="btn-game btn-game-warning w-100 py-3 rounded-4 fw-black ls-1 uppercase shadow-action"
                        >
                            ENABLE POP-UPS
                        </JuicyButton>
                        
                        <button 
                            onClick={handleClose}
                            className="btn btn-link text-theme-muted fw-black smallest text-uppercase ls-2 text-decoration-none hover-scale opacity-60"
                        >
                            Maybe Later
                        </button>
                    </div>

                    <div className="mt-5 pt-4 border-top border-theme-soft w-100">
                        <div className="d-flex align-items-center justify-content-center gap-2 text-theme-muted smallest fw-black ls-1 uppercase opacity-40">
                            <Shield size={14} strokeWidth={3} />
                            <span>Private & Secure via Firebase</span>
                        </div>
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
                    background: rgba(0, 0, 0, 0.0);
                    backdrop-filter: blur(0px);
                    z-index: 9999;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    pointer-events: none;
                }
                
                .notification-prompt-overlay.active {
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
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

                .shadow-action-lg { box-shadow: 12px 12px 0px var(--color-border); }
                .shadow-action { box-shadow: 6px 6px 0px var(--color-border); }
                
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s infinite ease-in-out;
                }
                
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                .ls-tight { letter-spacing: -0.01em; }
                .ls-1 { letter-spacing: 0.05em; }
                .ls-2 { letter-spacing: 0.1em; }
                
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover {
                    transform: scale(1.05);
                    opacity: 1 !important;
                }
                
                .uppercase { text-transform: uppercase; }
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};

export default NotificationPrompt;






