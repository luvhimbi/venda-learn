import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Mascot from './Mascot';
import { tourSteps } from '../config/tourSteps';

interface TourGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ isOpen, onClose, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [rect, setRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const currentStep = tourSteps[currentStepIndex];

    // Update position more aggressively
    useEffect(() => {
        if (!isOpen) return;

        // Multi-page navigation check
        if (currentStep.path && location.pathname !== currentStep.path) {
            navigate(currentStep.path);
            return; 
        }

        // Auto-switch tabs in Profile
        if (location.pathname === '/profile' && currentStep.target.includes('gear')) {
            const gearTab = Array.from(document.querySelectorAll('button')).find(btn => btn.className.includes('tour-gear-tab'));
            if (gearTab) (gearTab as HTMLElement).click();
        }

        const updatePosition = () => {
            if (currentStep.target === 'body') {
                setRect(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Find all potential targets
            const elements = document.querySelectorAll(currentStep.target);
            
            // Filter for the visible one (e.g. Desktop vs Mobile nav)
            const element = Array.from(elements).find(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       (rect.width > 0 || rect.height > 0);
            }) as HTMLElement;

            if (element) {
                const bcr = element.getBoundingClientRect();
                setRect({
                    x: bcr.left,
                    y: bcr.top,
                    width: bcr.width,
                    height: bcr.height
                });
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setRect(null);
            }
        };

        const timer = setTimeout(updatePosition, 600); // Wait for navigation/animations
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [currentStepIndex, isOpen, currentStep, location.pathname, navigate]);

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

    if (!isOpen) return null;

    // Viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Overlay SVG Path for "Hole Punch"
    const getMaskPath = () => {
        if (!rect) return `M 0 0 h ${vw} v ${vh} h -${vw} Z`; // Full screen mask
        
        const padding = 10;
        const x = rect.x - padding;
        const y = rect.y - padding;
        const w = rect.width + padding * 2;
        const h = rect.height + padding * 2;
        const r = 12; // corner radius

        // Outer rect (clockwise) and Inner hole (counter-clockwise)
        return `M 0 0 h ${vw} v ${vh} h -${vw} Z 
                M ${x + r} ${y} 
                h ${w - r * 2} a ${r} ${r} 0 0 1 ${r} ${r} 
                v ${h - r * 2} a ${r} ${r} 0 0 1 -${r} ${r} 
                h -${w - r * 2} a ${r} ${r} 0 0 1 -${r} -${r} 
                v -${h - r * 2} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
    };

    // Bubble positioning
    const getBubbleStyles = (): React.CSSProperties => {
        if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        let top = rect.y;
        let left = rect.x;

        if (currentStep.position === 'bottom') {
            top = rect.y + rect.height + 30;
            left = rect.x + rect.width / 2 - 170;
        } else if (currentStep.position === 'top') {
            top = rect.y - 420;
            left = rect.x + rect.width / 2 - 170;
        } else if (currentStep.position === 'right') {
            top = rect.y + rect.height / 2 - 200;
            left = rect.x + rect.width + 40;
        } else if (currentStep.position === 'left') {
            top = rect.y + rect.height / 2 - 200;
            left = rect.x - 380;
        }

        // Clamp
        top = Math.max(20, Math.min(top, vh - 450));
        left = Math.max(20, Math.min(left, vw - 360));

        return { top: `${top}px`, left: `${left}px`, transform: 'none' };
    };

    return (
        <div className="fixed-top w-100 h-100" style={{ zIndex: 2000 }}>
            {/* SVG OVERLAY MASK (The Hole Punch) */}
            <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none' }}>
                <path 
                    d={getMaskPath()} 
                    fill="rgba(0, 0, 0, 0.75)" 
                    fillRule="evenodd" 
                    className="transition-all"
                    style={{ transition: 'd 0.5s ease', pointerEvents: 'auto' }}
                    onClick={() => handleSkip()}
                />
            </svg>

            {/* BUBBLE AND MASCOT */}
            <div
                className="position-absolute d-flex flex-column align-items-center animate__animated animate__fadeIn"
                style={{
                    width: '340px',
                    pointerEvents: 'auto',
                    ...getBubbleStyles(),
                    transition: 'all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                }}
            >
                {/* Speech Bubble */}
                <div
                    className="bg-white p-4 rounded-4 shadow-lg mb-3 position-relative border border-3 border-warning"
                    style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
                >
                    <h5 className="fw-bold text-dark mb-2">{currentStep.title}</h5>
                    <p className="text-muted fw-bold ls-tight mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
                        {currentStep.content}
                    </p>

                    <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                        <div className="d-flex gap-1">
                            {tourSteps.map((_, i) => (
                                <div key={i} className={`rounded-pill transition-all ${i === currentStepIndex ? 'bg-warning w-3' : 'bg-light w-1'}`} style={{ height: '6px', width: i === currentStepIndex ? '20px' : '6px' }}></div>
                            ))}
                        </div>
                        <div className="d-flex gap-2">
                             <button className="btn btn-link text-muted text-decoration-none fw-bold smallest uppercase p-0 px-2" onClick={(e) => handleSkip(e)}>Skip</button>
                             <button className="btn btn-warning rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={(e) => handleNext(e)}>
                                {currentStepIndex === tourSteps.length - 1 ? 'GO!' : 'NEXT'}
                             </button>
                        </div>
                    </div>
                </div>

                {/* Mascot */}
                <div className="animate__animated animate__bounceIn">
                    <Mascot mood={currentStep.mood || 'happy'} width="140px" height="140px" />
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -0.5px; }
                .transition-all { transition: all 0.5s ease-in-out; }
            `}</style>
        </div>
    );
};

export default TourGuide;
