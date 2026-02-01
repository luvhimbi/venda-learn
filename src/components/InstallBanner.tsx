import React, { useState, useEffect } from 'react';

const InstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        });

        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            console.log('VendaLearn was installed');
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="p-4 rounded-4 border mb-4 d-flex align-items-center justify-content-between"
             style={{ backgroundColor: '#FFFBEB', borderColor: '#FACC15' }}>
            <div>
                <h6 className="fw-bold mb-1 text-dark">INSTALL VENDALEARN</h6>
                <p className="smallest text-muted mb-0 uppercase ls-1">Access lessons directly from your home screen</p>
            </div>
            <button
                onClick={handleInstallClick}
                className="btn game-btn-primary px-4 py-2 fw-bold smallest ls-1"
            >
                INSTALL
            </button>
            <style>{`
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #EAB308 !important; 
                }
            `}</style>
        </div>
    );
};

export default InstallBanner;