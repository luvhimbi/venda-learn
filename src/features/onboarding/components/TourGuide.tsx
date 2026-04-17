import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Mascot from '../../../features/gamification/components/Mascot';
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

    useEffect(() => {
        if (!isOpen) return;

        if (currentStep.path && location.pathname !== currentStep.path) {
            navigate(currentStep.path);
            return;
        }

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

            const elements = document.querySelectorAll(currentStep.target);
            const element = Array.from(elements).find(el => {
                const bcr = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && (bcr.width > 0 || bcr.height > 0);
            }) as HTMLElement;

            if (element) {
                const bcr = element.getBoundingClientRect();
                setRect({ x: bcr.left, y: bcr.top, width: bcr.width, height: bcr.height });
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setRect(null);
            }
        };

        const timer = setTimeout(updatePosition, 600);
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

    if (!isOpen) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const getMaskPath = () => {
        if (!rect) return `M 0 0 h ${vw} v ${vh} h -${vw} Z`;
        const p = 12;
        const x = rect.x - p, y = rect.y - p, w = rect.width + p * 2, h = rect.height + p * 2, r = 16;
        return `M 0 0 h ${vw} v ${vh} h -${vw} Z M ${x + r} ${y} h ${w - r * 2} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - r * 2} a ${r} ${r} 0 0 1 -${r} ${r} h -${w - r * 2} a ${r} ${r} 0 0 1 -${r} -${r} v -${h - r * 2} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
    };

    const getBubbleStyles = (): React.CSSProperties => {
        if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        let top = rect.y, left = rect.x;
        if (currentStep.position === 'bottom') { top = rect.y + rect.height + 40; left = rect.x + rect.width / 2 - 170; }
        else if (currentStep.position === 'top') { top = rect.y - 450; left = rect.x + rect.width / 2 - 170; }
        else if (currentStep.position === 'right') { top = rect.y + rect.height / 2 - 200; left = rect.x + rect.width + 40; }
        else if (currentStep.position === 'left') { top = rect.y + rect.height / 2 - 200; left = rect.x - 380; }

        top = Math.max(20, Math.min(top, vh - 480));
        left = Math.max(20, Math.min(left, vw - 360));
        return { top: `${top}px`, left: `${left}px` };
    };

    return (
        <div className="fixed-top w-100 h-100" style={{ zIndex: 9999 }}>
            <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none' }}>
                <path d={getMaskPath()} fill="rgba(0, 0, 0, 0.82)" fillRule="evenodd" style={{ transition: 'all 0.4s ease', pointerEvents: 'auto' }} onClick={onClose} />
            </svg>

            <div className="position-absolute d-flex flex-column align-items-center" style={{ width: '340px', ...getBubbleStyles(), transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                {/* SPEECH BUBBLE */}
                <div className="chommie-bubble bg-white rounded-4 shadow-lg p-4 mb-3 position-relative border border-4 border-dark">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-warning text-dark border border-2 border-dark fw-black px-2 py-1" style={{ fontSize: '0.7rem' }}>ELPHIE SAYS:</span>
                    </div>

                    <h4 className="fw-black text-dark mb-2 ls-tight">{currentStep.title}</h4>
                    <p className="text-dark fw-bold mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>
                        {currentStep.content}
                    </p>

                    <div className="d-flex justify-content-between align-items-center pt-3">
                        <div className="d-flex gap-1">
                            {tourSteps.map((_: any, i: number) => (
                                <div key={i} className={`rounded-pill border border-1 border-dark ${i === currentStepIndex ? 'bg-warning' : 'bg-light'}`} style={{ height: '8px', width: i === currentStepIndex ? '24px' : '8px', transition: 'width 0.3s' }}></div>
                            ))}
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-link text-dark fw-black smallest text-uppercase text-decoration-none p-0 px-2 opacity-50" onClick={onClose}>Skip</button>
                            <button className="chommie-btn-next" onClick={handleNext}>
                                {currentStepIndex === tourSteps.length - 1 ? 'SHARP!' : 'NEXT'}
                            </button>
                        </div>
                    </div>

                    {/* Speech Bubble Tail */}
                    <div className="bubble-tail"></div>
                </div>

                <div className="mascot-container">
                    <Mascot mood={currentStep.mood || 'happy'} width="150px" height="150px" />
                </div>
            </div>

            <style>{`
                .fw-black { font-weight: 900; }
                .ls-tight { letter-spacing: -1px; }
                
                .chommie-bubble {
                    box-shadow: 12px 12px 0px rgba(0,0,0,0.2);
                    z-index: 2;
                }

                .bubble-tail {
                    position: absolute;
                    bottom: -20px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 15px solid transparent;
                    border-right: 15px solid transparent;
                    border-top: 20px solid #000; /* Border color */
                }
                .bubble-tail::after {
                    content: '';
                    position: absolute;
                    bottom: 5px;
                    left: -11px;
                    border-left: 11px solid transparent;
                    border-right: 11px solid transparent;
                    border-top: 15px solid #fff; /* Fill color */
                }

                .chommie-btn-next {
                    background: #facc15;
                    border: 3px solid #000;
                    border-radius: 50px;
                    padding: 8px 24px;
                    font-weight: 900;
                    font-size: 0.9rem;
                    box-shadow: 4px 4px 0px #000;
                    transition: all 0.1s;
                }
                .chommie-btn-next:active {
                    transform: translate(2px, 2px);
                    box-shadow: 0px 0px 0px #000;
                }

                .mascot-container {
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
};

export default TourGuide;





