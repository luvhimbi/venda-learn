import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '../../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const GuestNudge: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user?.isAnonymous) {
                setIsAnonymous(true);
                // Check if user has dismissed it in this session
                const dismissed = sessionStorage.getItem('dismissed_guest_nudge');
                if (!dismissed) {
                    setIsVisible(true);
                }
            } else {
                setIsAnonymous(false);
                setIsVisible(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('dismissed_guest_nudge', 'true');
    };

    if (!isVisible || !isAnonymous) return null;

    return (
        <div className="fixed-bottom p-3 d-flex justify-content-center animate__animated animate__slideInUp" style={{ zIndex: 2000 }}>
            <div className="bg-theme-surface text-theme-main rounded-4 shadow-action-sm p-3 d-flex align-items-center gap-3 border-theme-main border-3 border"
                style={{ maxWidth: '540px', width: '95%', borderStyle: 'solid' }}>
                <div className="bg-warning text-dark rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center border border-dark border-2"
                    style={{ width: '44px', height: '44px' }}>
                    <Sparkles size={22} strokeWidth={3} />
                </div>

                <div className="flex-grow-1">
                    <h6 className="fw-black mb-1 small ls-1 uppercase">DON'T LOSE PROGRESS!</h6>
                    <p className="smallest mb-0 opacity-75 ls-tight fw-bold">You're in Guest Mode. Sign up now to save your XP and progress permanently.</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Link to="/register" className="btn-game btn-game-warning btn-sm fw-black rounded-3 px-3 py-2 smallest d-flex align-items-center gap-1 uppercase">
                        SAVE NOW <ArrowRight size={12} strokeWidth={3} />
                    </Link>
                    <button onClick={handleDismiss} className="btn btn-link text-theme-main p-1 opacity-50 hover-scale border-0">
                        <X size={22} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -0.2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
                .fw-black { font-weight: 900; }
                .uppercase { text-transform: uppercase; }
                .shadow-action-sm { box-shadow: 6px 6px 0px var(--color-border); }
                .hover-scale:hover { 
                    transform: scale(1.1);
                    opacity: 1 !important; 
                }
            `}</style>
        </div>
    );
};

export default GuestNudge;






