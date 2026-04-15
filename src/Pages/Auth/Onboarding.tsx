import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Mascot from '../../components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowLeft, Globe, Flame, Heart, Brain, GraduationCap, Briefcase, Plane, Compass, MessageCircle, Sun, Shield, Mountain, Waves, Sprout, Egg, Zap, Clock, Timer, Search, Instagram, Users, Tv, Type } from 'lucide-react';

interface OnboardingProps {
    onComplete?: () => void;
}

const LANGUAGES = [
    { id: 'Tshivenda', icon: <Globe size={28} className="text-primary" /> },
    { id: 'Xitsonga', icon: <Sun size={28} className="text-warning" /> },
    { id: 'Sepedi', icon: <Mountain size={28} className="text-success" /> },
    { id: 'isiZulu', icon: <Shield size={28} className="text-danger" /> },
    { id: 'isiXhosa', icon: <Waves size={28} className="text-info" /> },
    { id: 'Afrikaans', icon: <Sprout size={28} className="text-secondary" /> }
];

const NATIVE_LANGUAGES = [
    { id: 'English', icon: <Type size={28} className="text-secondary" /> },
    { id: 'Afrikaans', icon: <Sprout size={28} className="text-success" /> },
    { id: 'isiZulu', icon: <Shield size={28} className="text-danger" /> },
    { id: 'isiXhosa', icon: <Waves size={28} className="text-info" /> },
    { id: 'Sesotho', icon: <Mountain size={28} className="text-primary" /> },
    { id: 'Other', icon: <Globe size={28} className="text-warning" /> }
];

const LEVELS = [
    { id: 'beginner', title: 'Total Beginner', detail: 'I am starting from scratch', icon: <Egg size={24} className="text-muted" /> },
    { id: 'some', title: 'Know a few words', detail: 'I know the basics like "aweh"', icon: <Sprout size={24} className="text-success" /> },
    { id: 'conversational', title: 'Conversational', detail: 'I want to speak more fluently', icon: <MessageCircle size={24} className="text-primary" /> }
];

const REASONS = [
    { id: 'family', title: 'Family & Friends', icon: <Heart size={28} className="text-danger" /> },
    { id: 'travel', title: 'Travel & Culture', icon: <Plane size={28} className="text-info" /> },
    { id: 'school', title: 'School / Work', icon: <Briefcase size={28} className="text-success" /> },
    { id: 'brain', title: 'Brain Training', icon: <Brain size={28} className="text-warning" /> }
];

const TIMES = [
    { id: 'casual', title: 'Casual', mins: '5 min / day', icon: <Clock size={24} className="text-info" /> },
    { id: 'regular', title: 'Regular', mins: '10 min / day', icon: <Timer size={24} className="text-warning" /> },
    { id: 'intense', title: 'Intense', mins: '15+ min / day', icon: <Zap size={24} className="text-danger" /> }
];

const SOURCES = [
    { id: 'search', title: 'Web Search', icon: <Search size={28} className="text-primary" /> },
    { id: 'socials', title: 'Social Media', icon: <Instagram size={28} className="text-secondary" /> },
    { id: 'friends', title: 'Friends / Family', icon: <Users size={28} className="text-success" /> },
    { id: 'ads', title: 'Ads or TV', icon: <Tv size={28} className="text-danger" /> }
];

const getConnectionMessage = (native: string, target: string) => {
    if (!native || !target) return "Learning a new language opens up a whole new world!";
    if (native === target) return `Aweh! Perfecting your ${target} skills? Let's take you to the next level.`;
    
    const nguni = ['isiZulu', 'isiXhosa'];
    if (nguni.includes(native) && nguni.includes(target)) {
        return "These are both Nguni languages! You'll find the grammatical noun classes very similar, with just a few vocabulary differences.";
    }
    
    if (native === 'English' && target === 'Afrikaans') {
        return "Did you know? English and Afrikaans are both Germanic languages! You'll spot many similar words like 'water' and 'water'.";
    }

    if (native === 'English' && target === 'Tshivenda') {
        return "Tshivenda is a Bantu language with rich click sounds and tones. It's built totally differently from English, making it a super fun challenge!";
    }
    
    if (native === 'Afrikaans' && target === 'isiZulu') {
        return "Learning isiZulu from Afrikaans will be an exciting shift from Germanic grammar to a beautiful Bantu language structure!";
    }
    
    if (native === 'Other') {
        return `${target} is a beautiful language! It will give you a unique cultural perspective to learn from.`;
    }

    // Default connection
    return `${target} is a beautiful language! Knowing ${native} gives you a unique cultural perspective to learn from.`;
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { playSwipe, playClick, triggerHaptic } = useVisualJuice();
    
    const [step, setStep] = useState(-1);
    const [preferences, setPreferences] = useState({
        language: '',
        nativeLanguage: '',
        level: '',
        reason: '',
        timeId: '',
        timeMins: '',
        source: ''
    });

    // Fake loading progress
    const [loadProgress, setLoadProgress] = useState(0);

    const handleSelectOption = (key: string, value: string, timeMins?: string) => {
        triggerHaptic('medium');
        playClick();
        playSwipe();
        
        const newPrefs = { ...preferences, [key]: value };
        if (timeMins) newPrefs.timeMins = timeMins;
        
        setPreferences(newPrefs);
        
        // Auto-advance after small delay for juice
        setTimeout(() => {
            setStep(prev => prev + 1);
        }, 300);
    };

    useEffect(() => {
        if (step === 7) { // Loading Step
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setStep(8), 600);
                } else {
                    setLoadProgress(Math.min(progress, 100));
                }
            }, 300);
            return () => clearInterval(interval);
        }
        
        if (step === 8) { // Plan is Set
            // Blast confetti from both sides
            const duration = 2000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#FACC15', '#3B82F6', '#10B981', '#EF4444']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#FACC15', '#3B82F6', '#10B981', '#EF4444']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }

    }, [step]);

    const handleComplete = () => {
        // Save to Session Storage
        sessionStorage.setItem('onboarding_language', preferences.language);
        sessionStorage.setItem('onboarding_native', preferences.nativeLanguage);
        sessionStorage.setItem('onboarding_level', preferences.level);
        sessionStorage.setItem('onboarding_reason', preferences.reason);
        sessionStorage.setItem('onboarding_time', preferences.timeMins);

        if (onComplete) {
            onComplete();
            return;
        }

        const ref = searchParams.get('ref');
        const search = new URLSearchParams();
        if (ref) search.set('ref', ref);
        navigate({ pathname: '/register', search: search.toString() });
    };

    const renderStepContent = () => {
        switch (step) {
            case -1: // INTRO
                return (
                    <div className="w-100 text-center pb-5 mt-4">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="220px" height="220px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '2.2rem' }}>
                            Aweh! I'm Elphie
                        </h2>
                        <div className="mb-4">
                            <span className="badge bg-warning text-dark text-uppercase border border-2 border-dark px-3 py-2" style={{ fontSize: '0.85rem' }}>Your Culture Guide</span>
                        </div>
                        <p className="fw-bold text-theme-muted mb-5 mx-auto px-3" style={{ maxWidth: '380px' }}>
                            Ready to speak the lingo? I'll be your guide through Mzansi's languages and cultural stories.
                        </p>
                        <div className="mx-auto px-4" style={{ maxWidth: '400px' }}>
                            <button 
                                onClick={() => {
                                    triggerHaptic('medium');
                                    playClick();
                                    playSwipe();
                                    setStep(0);
                                }}
                                className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                            >
                                SHARP-SHARP! LET'S GO
                                <ArrowRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                );
            case 0: // TARGET LANGUAGE
                return (
                    <div className="w-100">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="140px" height="140px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-4" style={{ fontSize: '1.8rem' }}>
                            Aweh! What do you want to learn?
                        </h2>
                        <div className="row g-3 mx-auto" style={{ maxWidth: '440px' }}>
                            {LANGUAGES.map(lang => (
                                <div className="col-6" key={lang.id}>
                                    <button 
                                        onClick={() => handleSelectOption('language', lang.id)}
                                        className={`btn text-start p-3 brutalist-card hover-press d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 ${preferences.language === lang.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                    >
                                        <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center">{lang.icon}</div>
                                        <span className="fw-black text-uppercase small">{lang.id}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 1: // NATIVE LANGUAGE
                return (
                    <div className="w-100">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="140px" height="140px" mood="happy" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-4" style={{ fontSize: '1.8rem' }}>
                            And what's your native language?
                        </h2>
                        <div className="row g-3 mx-auto" style={{ maxWidth: '440px' }}>
                            {NATIVE_LANGUAGES.map(lang => (
                                <div className="col-6" key={lang.id}>
                                    <button 
                                        onClick={() => handleSelectOption('nativeLanguage', lang.id)}
                                        className={`btn text-start p-3 brutalist-card hover-press d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 ${preferences.nativeLanguage === lang.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                    >
                                        <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center">{lang.icon}</div>
                                        <span className="fw-black text-uppercase small">{lang.id}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 2: // CONNECTION FUN FACT
                return (
                    <div className="w-100 text-center mt-4">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="180px" height="180px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.8rem' }}>
                            Fun Fact!
                        </h2>
                        <div className="brutalist-card bg-theme-surface mx-auto p-4 mb-5 shadow-action-sm border border-4 border-theme-main text-start" style={{ maxWidth: '400px' }}>
                            <p className="fw-bold mb-0 text-theme-main" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                                {getConnectionMessage(preferences.nativeLanguage, preferences.language)}
                            </p>
                        </div>
                        <div className="mx-auto px-4" style={{ maxWidth: '400px' }}>
                            <button 
                                onClick={() => {
                                    triggerHaptic('medium');
                                    playClick();
                                    playSwipe();
                                    setStep(3);
                                }}
                                className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                            >
                                THAT'S COOL! CONTINUE
                                <ArrowRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                );
            case 3: // LEVEL
                return (
                    <div className="w-100 mt-4">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.8rem' }}>
                            How much {preferences.language} do you know?
                        </h2>
                        <div className="d-flex flex-column gap-3 mx-auto mt-5" style={{ maxWidth: '400px' }}>
                            {LEVELS.map(lvl => (
                                <button 
                                    key={lvl.id}
                                    onClick={() => handleSelectOption('level', lvl.id)}
                                    className={`btn text-start p-3 brutalist-card hover-press w-100 d-flex align-items-center gap-3 ${preferences.level === lvl.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                >
                                    <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm">{lvl.icon}</div>
                                    <div>
                                        <div className="fw-black fs-5 text-uppercase">{lvl.title}</div>
                                        <div className="fw-bold text-theme-muted small">{lvl.detail}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 4: // REASON
                return (
                    <div className="w-100 mt-4">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.8rem' }}>
                            Why are you learning {preferences.language}?
                        </h2>
                        <div className="row g-3 mx-auto mt-4" style={{ maxWidth: '420px' }}>
                            {REASONS.map(rsn => (
                                <div className="col-6" key={rsn.id}>
                                    <button 
                                        onClick={() => handleSelectOption('reason', rsn.id)}
                                        className={`btn p-4 brutalist-card hover-press w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center gap-2 ${preferences.reason === rsn.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                    >
                                        <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm">{rsn.icon}</div>
                                        <span className="fw-black text-uppercase small">{rsn.title}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 5: // DAILY GOAL
                return (
                    <div className="w-100">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="120px" height="120px" mood="happy" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.8rem' }}>
                            How much time can you spend?
                        </h2>
                        <p className="text-center fw-bold text-theme-muted mb-4 small px-3">Building a habit requires consistency!</p>
                        <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: '400px' }}>
                            {TIMES.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleSelectOption('timeId', t.id, t.mins)}
                                    className={`btn text-start p-3 brutalist-card hover-press d-flex align-items-center justify-content-between w-100 ${preferences.timeId === t.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center">{t.icon}</div>
                                        <span className="fw-black fs-5 text-uppercase">{t.title}</span>
                                    </div>
                                    <span className="badge bg-dark fw-bold">{t.mins}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6: // SOURCE
                return (
                    <div className="w-100 mt-4">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.8rem' }}>
                            How did you hear about us?
                        </h2>
                        <div className="row g-3 mx-auto mt-4" style={{ maxWidth: '420px' }}>
                            {SOURCES.map(src => (
                                <div className="col-6" key={src.id}>
                                    <button 
                                        onClick={() => handleSelectOption('source', src.id)}
                                        className="btn p-4 brutalist-card hover-press w-100 bg-theme-surface h-100 d-flex flex-column align-items-center justify-content-center text-center gap-2 text-theme-main"
                                    >
                                        <div className="bg-theme-base p-2 rounded-circle border border-2 border-theme-main shadow-action-sm">{src.icon}</div>
                                        <span className="fw-black text-uppercase small">{src.title}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 7: // LOADING
                return (
                    <div className="w-100 text-center pb-5">
                        <div className="d-flex justify-content-center mb-5 animate-chommie">
                            <Mascot width="200px" height="200px" mood={loadProgress > 70 ? 'excited' : 'happy'} />
                        </div>
                        <h2 className="fw-black text-uppercase ls-tight mb-4" style={{ fontSize: '1.5rem', color: 'var(--venda-yellow)' }}>
                            Building your {preferences.language} Journey...
                        </h2>
                        
                        <div className="mx-auto" style={{ maxWidth: '350px' }}>
                            <div className="progress brutalist-card p-0" style={{ height: '30px', backgroundColor: 'var(--color-surface)' }}>
                                <div 
                                    className="progress-bar bg-warning" 
                                    style={{ 
                                        width: `${loadProgress}%`, 
                                        transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                                    }}
                                />
                            </div>
                            <p className="fw-bold text-theme-muted mt-3 small text-uppercase">
                                {loadProgress < 40 ? 'Analyzing goals...' : loadProgress < 80 ? 'Generating daily quests...' : 'Ready to roll!'}
                            </p>
                        </div>
                    </div>
                );
            case 8: // SUCCESS / PLAN SET
                return (
                    <div className="w-100 text-center pb-5 mt-4">
                        <div className="d-flex justify-content-center mb-4 animate-chommie">
                            <Mascot width="180px" height="180px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-uppercase ls-tight mb-2" style={{ fontSize: '2rem', color: 'var(--color-text)' }}>
                            Your Plan is Set!
                        </h2>
                        <p className="fw-bold text-theme-muted mb-5 mx-auto px-3" style={{ maxWidth: '350px' }}>
                            We've customized a {preferences.timeMins.split('/')[0].trim()} daily curriculum for {preferences.language}. Let's get started!
                        </p>
                        <div className="mx-auto px-4" style={{ maxWidth: '400px' }}>
                            <button 
                                onClick={handleComplete}
                                className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                            >
                                CREATE ACCOUNT
                                <ArrowRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-theme-base min-vh-100 d-flex flex-column font-auth position-relative overflow-hidden">
            {/* Background Pattern */}
            <div className="position-absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(var(--color-text) 1px, transparent 1px)', 
                backgroundSize: '32px 32px', 
                opacity: 0.05, 
                zIndex: 0 
            }}></div>

            {/* Header / Progress Fill */}
            {step >= -1 && step < 7 && (
                <div className="w-100 py-3 px-3 d-flex align-items-center justify-content-center position-relative" style={{ zIndex: 10 }}>
                    <button 
                        onClick={() => {
                            playClick();
                            triggerHaptic('light');
                            if (step <= -1) navigate('/');
                            else setStep(prev => prev - 1);
                        }}
                        className="btn p-0 text-theme-main border-0 shadow-none hover-press me-3"
                        style={{ flexShrink: 0 }}
                    >
                        <ArrowLeft size={28} strokeWidth={2.5} />
                    </button>
                    <div className="brutalist-card p-0" style={{ flexGrow: 1, maxWidth: '500px', height: '22px', backgroundColor: 'var(--color-surface-soft)' }}>
                        <div 
                            style={{ 
                                height: '100%', 
                                width: `${((step + 2) / 8) * 100}%`, 
                                backgroundColor: 'var(--venda-yellow)',
                                transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }} 
                        />
                    </div>
                    {/* Add an empty div for balance to keep progress bar centered if needed, but flex-grow 1 should be fine */}
                    <div style={{ width: '28px', flexShrink: 0 }} className="ms-3 d-none d-md-block"></div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 position-relative" style={{ zIndex: 5 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="w-100 d-flex justify-content-center"
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
