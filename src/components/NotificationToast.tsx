import React, { useEffect, useState } from 'react';
import { X, Flame, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationToastProps {
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info' | 'streak';
    duration: number;
    onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, type, duration, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation to finish before unmounting
        setTimeout(onClose, 300);
    };

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setIsVisible(true));
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);



    const getConfig = () => {
        switch (type) {
            case 'streak':
                return {
                    icon: <Flame size={24} className="text-white" />,
                    bg: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                    border: '#DC2626',
                    iconBg: 'rgba(255, 255, 255, 0.2)'
                };
            case 'success':
                return {
                    icon: <CheckCircle size={24} className="text-white" />,
                    bg: 'linear-gradient(135deg, #10B981, #34D399)',
                    border: '#059669',
                    iconBg: 'rgba(255, 255, 255, 0.2)'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle size={24} className="text-white" />,
                    bg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    border: '#D97706',
                    iconBg: 'rgba(255, 255, 255, 0.2)'
                };
            default: // info
                return {
                    icon: <Info size={24} className="text-white" />,
                    bg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                    border: '#2563EB',
                    iconBg: 'rgba(255, 255, 255, 0.2)'
                };
        }
    };

    const config = getConfig();

    return (
        <div 
            className={`position-fixed z-3 shadow-lg rounded-4 overflow-hidden d-flex`}
            style={{
                top: '20px',
                right: '20px',
                width: '320px',
                maxWidth: 'calc(100vw - 40px)',
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: 'white',
                transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(120%)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                zIndex: 9999
            }}
        >
            <div className="p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: config.iconBg }}>
                {config.icon}
            </div>
            
            <div className="p-3 flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold mb-0 text-white" style={{ fontSize: '0.9rem' }}>{title}</h6>
                    <button 
                        onClick={handleClose}
                        className="btn btn-link p-0 text-white opacity-75 hover-opacity-100"
                        style={{ outline: 'none', boxShadow: 'none' }}
                    >
                        <X size={16} />
                    </button>
                </div>
                <p className="mb-0 text-white opacity-90" style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {message}
                </p>
            </div>

            <style>{`
                .hover-opacity-100:hover { opacity: 1 !important; transform: scale(1.1); transition: 0.2s }
            `}</style>
        </div>
    );
};

export default NotificationToast;
