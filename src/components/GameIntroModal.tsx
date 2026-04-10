import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import Mascot from './Mascot';

export interface IntroStep {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface GameIntroModalProps {
    gameId: string;
    gameTitle: string;
    gameIcon: React.ReactNode;
    steps: IntroStep[];
    accentColor?: string;
    onClose: () => void;
    /** If true, always show regardless of localStorage */
    forceShow?: boolean;
}

const STORAGE_PREFIX = 'gameIntro_seen_';

/**
 * Reusable game introduction modal — mobile-first fullscreen design.
 * Shows a short step-by-step guide on first visit.
 * Stores 'seen' state in localStorage per gameId.
 */
const GameIntroModal: React.FC<GameIntroModalProps> = ({
    gameId,
    gameTitle,
    gameIcon,
    steps,
    accentColor = '#FACC15',
    onClose,
    forceShow = false,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const key = `${STORAGE_PREFIX}${gameId}`;
        const seen = localStorage.getItem(key);
        if (!seen || forceShow) {
            setVisible(true);
        } else {
            onClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, forceShow]);

    const handleDismiss = () => {
        const key = `${STORAGE_PREFIX}${gameId}`;
        localStorage.setItem(key, 'true');
        setVisible(false);
        onClose();
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleDismiss();
        }
    };

    if (!visible) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div className="gim-overlay">
            <div className="gim-container">

                {/* TOP: Skip button + mascot */}
                <div className="gim-top-section">
                    <button onClick={handleDismiss} className="gim-skip-btn">
                        Skip
                    </button>
                    <div className="gim-mascot-wrap">
                        <Mascot width="90px" height="90px" mood="excited" />
                    </div>
                </div>

                {/* HEADER: Game badge + title */}
                <div className="gim-header-section">
                    <div className="gim-badge" style={{ background: accentColor }}>
                        {gameIcon}
                    </div>
                    <h1 className="gim-game-title">{gameTitle}</h1>
                    <span className="gim-how-label">HOW TO PLAY</span>
                </div>

                {/* STEP CARD */}
                <div className="gim-step-card" key={currentStep}>
                    <div className="gim-step-num-row">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`gim-step-pip ${i === currentStep ? 'gim-pip-active' : ''} ${i < currentStep ? 'gim-pip-done' : ''}`}
                                style={i === currentStep ? { background: accentColor, borderColor: accentColor } : i < currentStep ? { background: '#10B981', borderColor: '#10B981' } : {}}
                            />
                        ))}
                    </div>

                    <div className="gim-step-icon-box" style={{ borderColor: accentColor }}>
                        {step.icon}
                    </div>

                    <div className="gim-step-num-badge" style={{ background: accentColor }}>
                        STEP {currentStep + 1}
                    </div>

                    <h2 className="gim-step-title">{step.title}</h2>
                    <p className="gim-step-desc">{step.description}</p>
                </div>

                {/* BOTTOM: Navigation */}
                <div className="gim-bottom-nav">
                    <button
                        onClick={handleNext}
                        className="gim-next-btn"
                        style={{ background: isLast ? '#10B981' : accentColor }}
                    >
                        {isLast ? (
                            <><Sparkles size={20} strokeWidth={2.5} /> LET'S PLAY!</>
                        ) : (
                            <>NEXT <ChevronRight size={20} strokeWidth={3} /></>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .gim-overlay {
                    position: fixed;
                    inset: 0;
                    background: #111827;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .gim-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px 20px;
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                    min-height: 100%;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                }

                /* TOP */
                .gim-top-section {
                    width: 100%;
                    display: flex;
                    justify-content: flex-end;
                    align-items: flex-start;
                    margin-bottom: 8px;
                    position: relative;
                }
                .gim-skip-btn {
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.6);
                    font-weight: 700;
                    font-size: 13px;
                    padding: 6px 16px;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    transition: all 0.15s;
                    font-family: var(--game-font-family, inherit);
                }
                .gim-skip-btn:active {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
                .gim-mascot-wrap {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    top: 0;
                }

                /* HEADER */
                .gim-header-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 60px;
                    margin-bottom: 24px;
                    text-align: center;
                }
                .gim-badge {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid #111827;
                    box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
                    margin-bottom: 12px;
                }
                .gim-game-title {
                    color: #ffffff;
                    font-weight: 900;
                    font-size: clamp(1.4rem, 5vw, 1.8rem);
                    letter-spacing: -0.5px;
                    margin: 0 0 4px;
                    text-transform: uppercase;
                    font-family: var(--game-font-family, inherit);
                }
                .gim-how-label {
                    color: #FACC15;
                    font-weight: 800;
                    font-size: 11px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    font-family: var(--game-font-family, inherit);
                }

                /* STEP CARD */
                .gim-step-card {
                    background: #ffffff;
                    border: 4px solid #111827;
                    box-shadow: 6px 6px 0 rgba(0,0,0,0.4);
                    width: 100%;
                    padding: 24px 20px 28px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    animation: gimSlideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    flex: 1;
                    max-height: none;
                }
                @keyframes gimSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Step pips */
                .gim-step-num-row {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .gim-step-pip {
                    width: 32px;
                    height: 6px;
                    border: 1.5px solid #d1d5db;
                    background: #e5e7eb;
                    transition: all 0.3s;
                }
                .gim-pip-active {
                    transform: scaleY(1.4);
                }
                .gim-pip-done {
                    opacity: 0.7;
                }

                .gim-step-icon-box {
                    width: 72px;
                    height: 72px;
                    background: #f9fafb;
                    border: 3px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    border-radius: 50%;
                    transition: border-color 0.3s;
                }
                .gim-step-num-badge {
                    font-weight: 900;
                    font-size: 11px;
                    letter-spacing: 2px;
                    color: #111827;
                    padding: 4px 14px;
                    margin-bottom: 10px;
                    font-family: var(--game-font-family, inherit);
                    border: 2px solid #111827;
                }
                .gim-step-title {
                    font-weight: 900;
                    font-size: clamp(1.1rem, 4vw, 1.3rem);
                    color: #111827;
                    margin: 0 0 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-family: var(--game-font-family, inherit);
                }
                .gim-step-desc {
                    font-weight: 500;
                    font-size: clamp(0.85rem, 3.5vw, 0.95rem);
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.6;
                    max-width: 300px;
                }

                /* BOTTOM NAV */
                .gim-bottom-nav {
                    width: 100%;
                    padding-top: 20px;
                    margin-top: auto;
                }
                .gim-next-btn {
                    width: 100%;
                    border: 3px solid #111827;
                    color: #111827;
                    font-weight: 900;
                    font-size: 1rem;
                    padding: 16px 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.15s;
                    font-family: var(--game-font-family, inherit);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 4px 4px 0 #111827;
                }
                .gim-next-btn:active {
                    transform: translateY(3px);
                    box-shadow: 1px 1px 0 #111827;
                }
            `}</style>
        </div>
    );
};

export default GameIntroModal;

/**
 * Utility to reset intro seen state (for re-showing from help button)
 */
export const resetIntroSeen = (gameId: string) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
};

/**
 * Utility to check if intro has been seen
 */
export const hasSeenIntro = (gameId: string): boolean => {
    return localStorage.getItem(`${STORAGE_PREFIX}${gameId}`) === 'true';
};
