import React, { useEffect, useState } from 'react';

const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowReconnected(true);
                setTimeout(() => setShowReconnected(false), 3000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    if (isOnline && !showReconnected) return null;

    return (
        <>
            {!isOnline && (
                <div className="offline-banner d-flex align-items-center justify-content-center gap-2 py-2 px-3"
                     style={{
                         backgroundColor: '#FEF3C7',
                         borderBottom: '1px solid #FDE68A',
                         position: 'sticky',
                         top: 0,
                         zIndex: 9999,
                         fontSize: '13px',
                         fontWeight: 600,
                         color: '#92400E'
                     }}>
                    <i className="bi bi-wifi-off"></i>
                    <span>You're offline — changes will sync when you reconnect</span>
                </div>
            )}

            {showReconnected && (
                <div className="reconnected-banner d-flex align-items-center justify-content-center gap-2 py-2 px-3"
                     style={{
                         backgroundColor: '#D1FAE5',
                         borderBottom: '1px solid #6EE7B7',
                         position: 'sticky',
                         top: 0,
                         zIndex: 9999,
                         fontSize: '13px',
                         fontWeight: 600,
                         color: '#065F46',
                         animation: 'fadeInDown 0.3s ease-out'
                     }}>
                    <i className="bi bi-wifi"></i>
                    <span>Back online! Syncing your changes...</span>
                </div>
            )}

            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-100%); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

export default OfflineBanner;






