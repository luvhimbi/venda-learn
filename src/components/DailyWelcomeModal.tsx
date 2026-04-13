import React, { useState, useEffect } from 'react';
import Mascot from './Mascot';

interface DailyWelcomeModalProps {
    username: string;
    streak: number;
    lastLesson?: {
        id: string;
        microLessonId: string;
        title: string;
        courseTitle: string;
        savedIndex: number;
        savedType: string;
    } | null;
    onClose: () => void;
}

const DailyWelcomeModal: React.FC<DailyWelcomeModalProps> = ({ username, streak, lastLesson, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const welcomeKey = 'chommie_last_welcome';
    const legacyWelcomeKey = 'vendalearn_last_welcome';

    useEffect(() => {
        // Only run once per day
        const lastWelcomeStr = localStorage.getItem(welcomeKey) ?? localStorage.getItem(legacyWelcomeKey);
        const todayStr = new Date().toISOString().split('T')[0];

        if (lastWelcomeStr !== todayStr) {
            setShouldRender(true);
            requestAnimationFrame(() => setIsVisible(true));
            localStorage.setItem(welcomeKey, todayStr);
        } else {
            onClose(); // Instantly close if already seen today
        }
    }, [legacyWelcomeKey, onClose, welcomeKey]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            onClose();
        }, 400); // Wait for exit animation
    };

    if (!shouldRender) return null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { title: "Good Morning", sub: "Welcome back" };
        if (hour >= 12 && hour < 17) return { title: "Good Afternoon", sub: "Welcome back" };
        if (hour >= 17 && hour <= 23) return { title: "Good Evening", sub: "Welcome back" };
        return { title: "Hello", sub: "Welcome back" };
    };

    const getMotivation = () => {
        if (streak >= 7) return `Your ${streak}-day flame is blazing!`;
        if (streak > 0) return `You're on a ${streak}-day streak!`;
        return `Start your language journey today!`;
    };

    const greeting = getGreeting();

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1060 }}>
            {/* Backdrop */}
            <div 
                className="position-absolute top-0 start-0 w-100 h-100 bg-black"
                style={{ opacity: isVisible ? 0.6 : 0, transition: 'opacity 0.4s ease' }}
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div 
                className={`bg-white rounded-5 p-4 p-md-5 mx-3 position-relative d-flex flex-column align-items-center text-center shadow-lg welcome-modal ${isVisible ? 'welcome-enter' : 'welcome-exit'}`}
                style={{ maxWidth: '440px', width: '100%', borderTop: '6px solid #FACC15' }}
            >
                <div className="mb-4 position-relative">
                    <div className="position-absolute top-50 start-50 translate-middle rounded-circle bg-warning opacity-25" style={{ width: '120px', height: '120px', filter: 'blur(20px)' }}></div>
                    <Mascot mood="happy" width="130px" height="130px" />
                </div>
                
                <h4 className="fw-bold text-dark mb-1 ls-tight">{greeting.title}, {username}!</h4>
                <p className="text-muted smallest fw-bold ls-2 uppercase mb-4">{getMotivation()}</p>

                {/* ACTION CARD */}
                {lastLesson ? (
                    <div className="w-100 p-3 rounded-4 mb-4 text-start shadow-sm" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <span className="fw-bold ls-1 text-warning uppercase d-block mb-1" style={{ fontSize: '9px' }}>Pick up where you left off:</span>
                        <h6 className="fw-bold text-dark mb-1">{lastLesson.title}</h6>
                        <p className="smallest text-muted fw-bold uppercase ls-1 mb-3">{lastLesson.courseTitle}</p>
                        
                        <a 
                            href={`/game/${lastLesson.id}/${lastLesson.microLessonId}?start=${lastLesson.savedIndex}&type=${lastLesson.savedType?.toUpperCase()}`}
                            className="btn w-100 rounded-pill py-2 fw-bold smallest ls-1 uppercase transition-all shadow-sm"
                            style={{ backgroundColor: '#111827', color: '#FACC15' }}
                        >
                            <i className="bi bi-play-fill me-1"></i> Resume Lesson
                        </a>
                    </div>
                ) : (
                    <div className="w-100 p-4 rounded-4 mb-4 text-center border-dashed" style={{ border: '1px dashed #CBD5E1', backgroundColor: '#F8FAFC' }}>
                        <p className="smallest text-muted fw-bold uppercase ls-1 mb-3">Ready for your first lesson?</p>
                        <a 
                            href="/courses"
                            className="btn btn-warning w-100 rounded-pill py-2 fw-bold smallest ls-1 uppercase transition-all shadow-sm"
                        >
                            Explore Lessons
                        </a>
                    </div>
                )}

                <button 
                    onClick={handleClose}
                    className="btn btn-link text-muted smallest fw-bold ls-1 uppercase text-decoration-none opacity-75"
                >
                    Maybe later
                </button>
            </div>

            <style>{`
                .welcome-modal {
                    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .welcome-enter {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                .welcome-exit {
                    opacity: 0;
                    transform: scale(0.9) translateY(20px);
                }
                .border-dashed {
                    border-style: dashed !important;
                }
            `}</style>
        </div>
    );
};

export default DailyWelcomeModal;
