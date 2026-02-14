import React, { useState, useEffect } from 'react';
import Mascot from './Mascot';
import { tourSteps } from '../config/tourSteps';

interface TourGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ isOpen, onClose, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);

    const currentStep = tourSteps[currentStepIndex];

    useEffect(() => {
        if (!isOpen) return;

        // Force scroll to top on center steps
        if (currentStep.target === 'body') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const updatePosition = () => {
            if (currentStep.target === 'body') {
                setPosition(null);
                return;
            }

            // Find the visible element (handles desktop vs mobile nav)
            const elements = document.querySelectorAll(currentStep.target);
            const element = Array.from(elements).find(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    (rect.width > 0 || rect.height > 0);
            }) as HTMLElement;

            if (element) {
                const rect = element.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });

                // Scroll the element into view. 
                // nearest scrollable parent (e.g. Sidebar) will handle internal scrolling.
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                console.warn(`Tour target not found or hidden: ${currentStep.target}`);
                setPosition(null);
            }
        };

        // Delay to allow DOM/layout to settle
        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
        };
    }, [currentStepIndex, isOpen, currentStep]);

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (currentStepIndex < tourSteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        onClose();
    };

    if (!isOpen || window.innerWidth < 768) return null;

    // Viewport-safe coordinates
    const getCoords = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw < 768;

        if (!position) return {
            top: isMobile ? '50%' : '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        };

        let top = position.top;
        let left = position.left;

        if (isMobile) {
            // On mobile, just center horizontally
            left = 0; // Will be overridden by '50%' in return if we decide, or keep it as pixels.
            // Actually, returning a string is better for transform

            if (position.top > vh * 0.45) {
                top = position.top - (isMobile ? 320 : 380); // Appear above
            } else {
                top = position.top + position.height + 24; // Appear below
            }

            // For mobile, we explicitly want it centered on screen
            return {
                top: `${Math.max(20, Math.min(top, vh - 400))}px`,
                left: '50%',
                transform: 'translateX(-50%)'
            };
        } else {
            // Original Desktop Positioning Logic
            if (currentStep.position === 'bottom') {
                top = position.top + position.height + 20;
                left = position.left + position.width / 2 - 160;
            } else if (currentStep.position === 'top') {
                top = position.top - 320;
                left = position.left + position.width / 2 - 160;
            } else if (currentStep.position === 'right') {
                top = position.top + position.height / 2 - 150;
                left = position.left + position.width + 20;
            } else if (currentStep.position === 'left') {
                top = position.top + position.height / 2 - 150;
                left = position.left - 340;
            }
        }

        // Clamp to viewport (Desktop only now)
        const bubbleWidth = 320;
        const bubbleHeight = 450;

        if (top + bubbleHeight > vh) top = vh - bubbleHeight - 20;
        if (top < 20) top = 20;

        if (left + bubbleWidth > vw) {
            left = vw - bubbleWidth - 20;
        }
        if (left < 20) {
            left = 20;
        }

        return { top: `${top}px`, left: `${left}px`, transform: 'none' };
    };

    const coords = getCoords();

    return (
        <div className="fixed-top w-100 h-100" style={{ zIndex: 1070 }}>
            {/* Dark Backdrop (No blur to fix "blurry steps" issue) */}
            <div
                className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-75"
                style={{ transition: 'all 0.5s' }}
                onClick={() => handleSkip()}
            ></div>

            {/* Content Container */}
            <div
                className="position-absolute d-flex flex-column align-items-center transition-all animate__animated animate__fadeInUp"
                style={{
                    zIndex: 1080,
                    top: coords.top,
                    left: coords.left,
                    transform: coords.transform,
                    width: 'calc(100vw - 40px)',
                    maxWidth: '340px',
                    pointerEvents: 'auto'
                }}
            >
                {/* Speech Bubble */}
                <div
                    className="bg-white p-4 rounded-4 shadow-lg mb-3 position-relative animate__animated animate__bounceIn w-100"
                    style={{ border: '2px solid #FACC15', boxShadow: '0 15px 35px rgba(0,0,0,0.3)' }}
                >
                    <p className="mb-4 fw-bold text-slate ls-tight" style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                        {currentStep.content}
                    </p>

                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                        <span className="text-muted smallest fw-bold uppercase ls-1">Step {currentStepIndex + 1}/{tourSteps.length}</span>
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="btn btn-link text-muted text-decoration-none fw-bold smallest uppercase p-0"
                                onClick={(e) => handleSkip(e)}
                            >
                                Skip
                            </button>
                            <button
                                className="btn btn-warning rounded-pill px-4 py-2 fw-bold shadow-sm pulse-orange"
                                style={{ minWidth: '100px' }}
                                onClick={(e) => handleNext(e)}
                            >
                                {currentStepIndex === tourSteps.length - 1 ? 'Finish!' : 'Next →'}
                            </button>
                        </div>
                    </div>

                    {/* Triangle pointer */}
                    <div className="position-absolute bg-white"
                        style={{
                            width: '20px', height: '20px',
                            bottom: '-10px', left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            borderBottom: '2px solid #FACC15',
                            borderRight: '2px solid #FACC15',
                            zIndex: 1
                        }}></div>
                </div>

                {/* Mascot */}
                <div className="filter-drop-shadow animate__animated animate__pulse animate__infinite">
                    <Mascot
                        mood={currentStep.mood || 'happy'}
                        width={window.innerWidth < 768 ? "100px" : "140px"}
                        height={window.innerWidth < 768 ? "100px" : "140px"}
                    />
                </div>
            </div>

            {/* Highlight Box */}
            {position && (
                <div
                    className="position-absolute border border-warning border-3 rounded-3 transition-all"
                    style={{
                        top: position.top - 8,
                        left: position.left - 8,
                        width: position.width + 16,
                        height: position.height + 16,
                        zIndex: 1071,
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
                        transition: 'all 0.3s ease-out'
                    }}
                ></div>
            )}

            <style>{`
                .pulse-orange {
                    animation: pulse-orange 2s infinite;
                }
                @keyframes pulse-orange {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
                }
                .filter-drop-shadow { filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3)); }
            `}</style>
        </div>
    );
};

export default TourGuide;
