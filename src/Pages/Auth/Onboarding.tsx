import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Mascot from '../../components/Mascot';
import JuicyButton from '../../components/JuicyButton';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { ArrowRight, Flame, Sparkles, Star, Trophy, Globe, Zap } from 'lucide-react';

interface OnboardingProps {
    onComplete?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentSlide, setCurrentSlide] = useState(0);
    const { playSwipe, triggerHaptic } = useVisualJuice();

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            playSwipe();
            triggerHaptic('medium');
            setCurrentSlide(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete();
            return;
        }
        const ref = searchParams.get('ref');
        const search = new URLSearchParams();
        if (ref) search.set('ref', ref);
        search.set('skipIntro', 'true');
        navigate({ pathname: '/register', search: search.toString() });
    };

    const slides = [
        {
            title: "Aweh! I'm Elphie",
            subtitle: "Your Culture Guide",
            description: "Ready to speak the lingo? I'll be your guide through Mzansi's languages and cultural stories. Sharp-Sharp!",
            accent: "var(--venda-yellow)",
            visual: (
                <div className="onboarding-visual-node">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="visual-circle bg-warning shadow-action-sm border border-4 border-theme-main"
                    >
                        <Mascot width="220px" height="220px" mood="excited" />
                    </motion.div>
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="floating-icon icon-1"
                    >
                        <Sparkles size={40} className="text-theme-main" fill="#FACC15" />
                    </motion.div>
                </div>
            )
        },
        {
            title: "Master the Lingo",
            subtitle: "11 Official Languages",
            description: "From Tshivenda to isiZulu, master the languages of South Africa with bite-sized lessons and interactive quests.",
            accent: "#3B82F6",
            visual: (
                <div className="onboarding-visual-node">
                    <motion.div 
                        initial={{ rotate: -10, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        className="visual-card brutalist-card p-4 bg-theme-surface border border-4 border-theme-main d-flex flex-column align-items-center justify-content-center"
                        style={{ width: '220px', height: '220px' }}
                    >
                        <Globe size={80} strokeWidth={2.5} className="text-theme-main mb-3" />
                        <div className="d-flex gap-1 flex-wrap justify-content-center">
                            <span className="badge bg-dark rounded-0 border border-2 border-dark text-white text-uppercase smallest-print">Venda</span>
                            <span className="badge bg-primary rounded-0 border border-2 border-dark text-white text-uppercase smallest-print">Zulu</span>
                            <span className="badge bg-success rounded-0 border border-2 border-dark text-white text-uppercase smallest-print">Xhosa</span>
                        </div>
                    </motion.div>
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="floating-icon icon-2"
                    >
                        <Star size={44} className="text-warning" fill="#FACC15" />
                    </motion.div>
                </div>
            )
        },
        {
            title: "Power Up!",
            subtitle: "Earn Rewards",
            description: "Level up your profile, earn XP, and collect rare Trophies. Compete on the Leaderboard to become the ultimate Language Boss.",
            accent: "#10B981",
            visual: (
                <div className="onboarding-visual-node">
                    <div className="d-flex flex-column gap-3">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="stat-pill brutalist-card--sm bg-theme-surface p-2 d-flex align-items-center gap-3 border border-2 border-theme-main"
                        >
                            <div className="bg-warning p-2 border border-2 border-dark"><Zap size={20} fill="#000" /></div>
                            <span className="fw-black text-theme-main text-uppercase">+250 XP earned!</span>
                        </motion.div>
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="stat-pill brutalist-card--sm bg-theme-surface p-2 d-flex align-items-center gap-3 mx-4 border border-2 border-theme-main"
                        >
                            <div className="bg-info p-2 border border-2 border-dark"><Trophy size={20} fill="#000" /></div>
                            <span className="fw-black text-theme-main text-uppercase">New Achievement!</span>
                        </motion.div>
                    </div>
                </div>
            )
        },
        {
            title: "Keep the Fire",
            subtitle: "Build Your Streak",
            description: "Stay consistent and keep your Daily Streak alive. Unlock exclusive content and rewards for your dedication.",
            accent: "#EF4444",
            visual: (
                <div className="onboarding-visual-node">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="visual-circle bg-theme-surface border border-4 border-theme-main shadow-action d-flex flex-column align-items-center justify-content-center"
                        style={{ width: '200px', height: '200px' }}
                    >
                        <Flame size={100} className="text-danger" fill="#EF4444" strokeWidth={3} />
                        <div className="mt-2 fw-black text-theme-main uppercase ls-1" style={{ fontSize: '1.5rem' }}>7 DAYS</div>
                    </motion.div>
                </div>
            )
        }
    ];

    return (
        <div className="onboarding-container bg-theme-base font-auth">
            {/* Background Pattern */}
            <div className="onboarding-dots theme-aware-dots"></div>

            {/* Header / Progress */}
            <div className="onboarding-top">
                <div className="progress-track brutalist-card--sm bg-theme-surface border border-2 border-theme-main">
                    <motion.div 
                        className="progress-fill" 
                        animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                        style={{ backgroundColor: slides[currentSlide].accent }}
                    />
                </div>
                <button onClick={handleComplete} className="skip-link fw-black text-uppercase smallest-print text-theme-main ls-1">
                    Skip
                </button>
            </div>

            {/* Main Content */}
            <div className="onboarding-main container">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="onboarding-slide"
                    >
                        {/* Visual Segment */}
                        <div className="onboarding-visual-wrap">
                            {slides[currentSlide].visual}
                        </div>

                        {/* Text Segment */}
                        <div className="onboarding-text-wrap text-center mt-4 mt-lg-5">
                            <span className="slide-subtitle text-uppercase fw-black ls-1 mb-2 d-inline-block" style={{ color: slides[currentSlide].accent }}>
                                {slides[currentSlide].subtitle}
                            </span>
                            <h1 className="fw-black text-theme-main text-uppercase ls-tight mb-3 slide-title">
                                {slides[currentSlide].title}
                            </h1>
                            <p className="slide-description fw-bold text-theme-muted mx-auto" style={{ maxWidth: '380px' }}>
                                {slides[currentSlide].description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="onboarding-footer container pb-5">
                <JuicyButton 
                    onClick={handleNext}
                    className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: 'var(--venda-yellow)' }}
                >
                    {currentSlide === slides.length - 1 ? "Start My Quest" : "Continue"}
                    <ArrowRight size={24} strokeWidth={3} />
                </JuicyButton>
                
                <div className="slide-indicator-pills d-flex justify-content-center gap-2 mt-4">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`indicator-pill ${currentSlide === idx ? 'active' : ''}`}
                            style={{ backgroundColor: currentSlide === idx ? 'var(--venda-yellow)' : '#E2E8F0' }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                .onboarding-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                    user-select: none;
                }

                .onboarding-dots {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(var(--color-text) 1px, transparent 1px);
                    background-size: 32px 32px;
                    opacity: 0.1;
                    z-index: 0;
                }

                .onboarding-top {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2.5rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 10;
                }

                .progress-track {
                    width: 200px;
                    height: 12px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-fill {
                    height: 100%;
                    transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .skip-link {
                    background: none;
                    border: none;
                    text-decoration: underline;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .skip-link:hover { opacity: 1; }

                .onboarding-main {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    z-index: 5;
                }

                .onboarding-slide {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .onboarding-visual-node {
                    position: relative;
                    min-height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .visual-circle {
                    width: 250px;
                    height: 250px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    z-index: 2;
                }

                .floating-icon {
                    position: absolute;
                    z-index: 3;
                }

                .icon-1 { top: -10px; right: -10px; }
                .icon-2 { bottom: 20px; left: -20px; }

                .stat-pill {
                    border-radius: 50px !important;
                    min-width: 240px;
                }

                .slide-title {
                    font-size: 3rem;
                    line-height: 0.9;
                }

                .slide-description {
                    font-size: 1.1rem;
                    line-height: 1.6;
                }

                .onboarding-footer {
                    max-width: 500px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 10;
                }

                .indicator-pill {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid #000;
                    transition: all 0.3s;
                }

                .indicator-pill.active {
                    width: 40px;
                    border-radius: 12px;
                }

                @media (max-width: 768px) {
                    .slide-title { font-size: 2.2rem; }
                    .visual-circle { width: 200px; height: 200px; }
                }

                .ls-tight { letter-spacing: -2px; }
            `}</style>
        </div>
    );
};

export default Onboarding;
