import React, { useEffect, useState } from 'react';

const InstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 1. Check if already installed/standalone
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        // 2. Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // 3. Handle Android/Chrome Install Prompt
        const handler = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // 4. If iOS and not standalone, show instructions
        if (ios && !checkStandalone) {
            setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setIsVisible(false);
        } else {
            console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
    };

    // Don't show anything if already installed or logic dictates hidden
    if (!isVisible || isStandalone) return null;

    return (
        <div className="install-banner p-3 mb-4 rounded-4 border d-flex align-items-center justify-content-between shadow-sm animate-fade-in"
             style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
            <div className="d-flex align-items-center gap-3">
                <div className="bg-warning rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '44px', height: '44px' }}>
                    <span className="fw-bold text-dark fs-5">V</span>
                </div>
                <div className="text-start">
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>Install VendaLearn</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
                        {isIOS
                            ? 'Tap the "Share" icon then "Add to Home Screen"'
                            : 'Access lessons directly from your home screen'}
                    </p>
                </div>
            </div>

            <div className="d-flex align-items-center gap-2">
                {!isIOS ? (
                    <button
                        onClick={handleInstallClick}
                        className="btn btn-dark btn-sm rounded-3 px-3 fw-bold smallest uppercase ls-1"
                    >
                        Install
                    </button>
                ) : (
                    <div className="text-dark">
                        <i className="bi bi-box-arrow-up fs-5"></i>
                    </div>
                )}
                <button
                    onClick={() => setIsVisible(false)}
                    className="btn btn-link text-muted p-1"
                    style={{ textDecoration: 'none' }}
                >
                    <i className="bi bi-x-lg" style={{ fontSize: '12px' }}></i>
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InstallBanner;