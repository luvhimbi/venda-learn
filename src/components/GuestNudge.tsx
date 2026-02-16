import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '../services/firebaseConfig';
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
            <div className="bg-dark text-white rounded-4 shadow-lg p-3 d-flex align-items-center gap-3 border border-warning border-opacity-25"
                style={{ maxWidth: '500px', width: '95%' }}>
                <div className="bg-warning text-dark rounded-circle p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px' }}>
                    <Sparkles size={20} />
                </div>

                <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1 small ls-1">DON'T LOSE PROGRESS!</h6>
                    <p className="smallest mb-0 opacity-75 ls-tight">You're in Guest Mode. Sign up now to save your LP and progress permanently.</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Link to="/register" className="btn btn-warning btn-sm fw-bold rounded-pill px-3 py-1 smallest d-flex align-items-center gap-1">
                        SAVE NOW <ArrowRight size={12} />
                    </Link>
                    <button onClick={handleDismiss} className="btn btn-link text-white p-1 opacity-50 hover-opacity-100">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -0.2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
                .hover-opacity-100:hover { opacity: 1 !important; }
            `}</style>
        </div>
    );
};

export default GuestNudge;
