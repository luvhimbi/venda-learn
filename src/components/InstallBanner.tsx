import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';

const InstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        const ios = /Macintosh|Mac OS X|iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        if (ios && !checkStandalone) {
            setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible || isStandalone) return null;

    return (
        <div className="install-banner p-3 mb-4 rounded-4 border-3 d-flex align-items-center justify-content-between animate-fade-in bg-theme-surface border-theme-main shadow-action-sm">
            <div className="d-flex align-items-center gap-3">
                <div className="bg-warning rounded-3 border border-dark border-2 p-2 d-flex align-items-center justify-content-center shadow-action-sm" style={{ width: '48px', height: '48px' }}>
                    <Smartphone size={24} className="text-dark" strokeWidth={2.5} />
                </div>
                <div className="text-start">
                    <h6 className="fw-black mb-0 text-theme-main ls-tight" style={{ fontSize: '15px' }}>INSTALL CHOMMIE</h6>
                    <p className="small fw-bold text-theme-muted mb-0 opacity-75" style={{ fontSize: '11px' }}>
                        {isIOS
                            ? 'Tap "Share" then "Add to Home Screen"'
                            : 'Learn languages faster from your home screen'}
                    </p>
                </div>
            </div>

            <div className="d-flex align-items-center gap-2">
                {!isIOS ? (
                    <button
                        onClick={handleInstallClick}
                        className="btn btn-game btn-game-primary px-3 py-2 smallest fw-black ls-1"
                    >
                        <Download size={14} className="me-1" strokeWidth={3} /> INSTALL
                    </button>
                ) : (
                    <div className="p-2 bg-theme-base border border-theme-main rounded-circle d-flex align-items-center justify-content-center text-theme-main">
                        <Share size={18} strokeWidth={2.5} />
                    </div>
                )}
                <button
                    onClick={() => setIsVisible(false)}
                    className="btn btn-link text-theme-muted p-1 hover-scale"
                    style={{ textDecoration: 'none' }}
                >
                    <X size={20} strokeWidth={3} />
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.1); }
            `}</style>
        </div>
    );
};

export default InstallBanner;