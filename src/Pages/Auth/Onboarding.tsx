import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Mascot from '../../features/gamification/components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowLeft, Globe, Heart, Brain, Briefcase, Plane, MessageCircle, Sun, Shield, Mountain, Waves, Sprout, Egg, Zap, Clock, Timer, Search, Instagram, Users, Tv, Type, Eye, EyeOff, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

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

const getLevelMessage = (level: string, language: string) => {
    const lang = language || 'Tshivenda';
    switch (level) {
        case 'beginner':
            return `Starting from scratch? Awesome! We'll have you speaking your first ${lang} words in no time.`;
        case 'some':
            return `You already know some ${lang}? Nice! You've got the foundations down, let's build on that.`;
        case 'conversational':
            return `Impressive! You're already conversational in ${lang}. We'll help you master the nuances and local slang.`;
        default:
            return `Great! Let's tailor your ${lang} journey to your specific needs.`;
    }
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const skipIntro = searchParams.get('skipIntro') === 'true';
    const referrerId = searchParams.get('ref');
    const { playSwipe, playClick, triggerHaptic } = useVisualJuice();
    const { executeRecaptcha } = useGoogleReCaptcha();
    
    const [step, setStep] = useState(skipIntro ? 9 : -1);
    const [preferences, setPreferences] = useState({
        language: '',
        nativeLanguage: '',
        level: '',
        reason: '',
        timeId: '',
        timeMins: '',
        source: ''
    });

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fake loading progress
    const [loadProgress, setLoadProgress] = useState(0);

    const handleSelectOption = (key: string, value: string, timeMins?: string) => {
        triggerHaptic('medium');
        playClick();
        playSwipe();
        
        const newPrefs = { ...preferences, [key]: value };
        if (timeMins) newPrefs.timeMins = timeMins;
        
        setPreferences(newPrefs);
        
        // Auto-advance after small delay for juice (except for level)
        if (key !== 'level') {
            setTimeout(() => {
                setStep(prev => prev + 1);
            }, 300);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitRegistration = async () => {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        setLoading(true);

        if (!executeRecaptcha) {
            setError("reCAPTCHA isn't ready. Try again.");
            setLoading(false);
            return;
        }

        try {
            const token = await executeRecaptcha("register");
            if (!token) {
                setError("reCAPTCHA failed.");
                setLoading(false);
                return;
            }

            const { findUserByEmail } = await import('../../services/authService');
            const existingProfile = await findUserByEmail(formData.email);
            
            if (existingProfile) {
                setError("Account already exists with this email. Sharp-sharp, just log in!");
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await setDoc(doc(db as Firestore, "users", userCredential.user.uid), {
                username: formData.username,
                email: formData.email,
                points: 0,
                streak: 0,
                completedLessons: [],
                isNativeSpeaker: false,
                tourCompleted: false,
                createdAt: new Date().toISOString()
            });

            if (referrerId) {
                try {
                    await setDoc(doc(db as Firestore, "invites", `${referrerId}_${userCredential.user.uid}`), {
                        inviterId: referrerId,
                        inviteeId: userCredential.user.uid,
                        inviteeName: formData.username,
                        claimed: false,
                        createdAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Referral Error:", err);
                }
            }
            navigate('/');
        } catch (err: any) {
            setError(err.code === 'auth/email-already-in-use' ? "Email already exists." : "Registration failed.");
        } finally { setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            if (!user.email) {
                setError("Google didn't provide an email. Try regular registration.");
                return;
            }

            const userDoc = await getDoc(doc(db as Firestore, 'users', user.uid));

            if (!userDoc.exists()) {
                const { consolidateUserProfile } = await import('../../services/authService');
                const wasConsolidated = await consolidateUserProfile(user.uid, user.email);

                if (!wasConsolidated) {
                    await setDoc(doc(db as Firestore, 'users', user.uid), {
                        username: user.displayName || 'Learner',
                        email: user.email.toLowerCase(),
                        points: 0,
                        streak: 0,
                        completedLessons: [],
                        isNativeSpeaker: false,
                        tourCompleted: false,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            navigate('/');
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            setError("Google login failed.");
        } finally { setLoading(false); }
    };

    const handleGuestSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            await signInAnonymously(auth);
            navigate('/');
        } catch (err: any) {
            console.error("Guest Sign-In Error:", err);
            setError("Couldn't jump in. Try again.");
        } finally {
            setLoading(false);
        }
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

    const renderStepContent = () => {
        switch (step) {
            case -1: // INTRO
                return (
                    <div className="w-100 text-center pb-3">
                        <div className="d-flex justify-content-center mb-3 animate-chommie">
                            <Mascot width="150px" height="150px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.6rem' }}>
                            Aweh! I'm Elphie
                        </h2>
                        <div className="mb-2">
                            <span className="badge bg-warning text-dark text-uppercase border border-2 border-dark px-3 py-2" style={{ fontSize: '0.75rem' }}>Your Culture Guide</span>
                        </div>
                        <p className="fw-bold text-theme-muted mb-3 mx-auto px-3 smaller">
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
                        <div className="d-flex justify-content-center mb-2 animate-chommie">
                            <Mascot width="80px" height="80px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.4rem' }}>
                            What do you want to learn?
                        </h2>
                        <div className="row g-2 mx-auto" style={{ maxWidth: '440px' }}>
                            {LANGUAGES.map(lang => (
                                <div className="col-6 col-md-4" key={lang.id}>
                                    <button 
                                        onClick={() => handleSelectOption('language', lang.id)}
                                        className={`btn text-start p-2 brutalist-card hover-press d-flex flex-column align-items-center justify-content-center gap-1 w-100 ${preferences.language === lang.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                        style={{ minHeight: '100px' }}
                                    >
                                        <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center" style={{ transform: 'scale(0.8)' }}>{lang.icon}</div>
                                        <span className="fw-black text-uppercase smallest ls-1">{lang.id}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 1: // NATIVE LANGUAGE
                return (
                    <div className="w-100">
                        <div className="d-flex justify-content-center mb-2 animate-chommie">
                            <Mascot width="80px" height="80px" mood="happy" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.4rem' }}>
                            And your native language?
                        </h2>
                        <div className="row g-2 mx-auto" style={{ maxWidth: '440px' }}>
                            {NATIVE_LANGUAGES.map(lang => (
                                <div className="col-6 col-md-4" key={lang.id}>
                                    <button 
                                        onClick={() => handleSelectOption('nativeLanguage', lang.id)}
                                        className={`btn text-start p-2 brutalist-card hover-press d-flex flex-column align-items-center justify-content-center gap-1 w-100 ${preferences.nativeLanguage === lang.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                        style={{ minHeight: '100px' }}
                                    >
                                        <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center" style={{ transform: 'scale(0.8)' }}>{lang.icon}</div>
                                        <span className="fw-black text-uppercase smallest ls-1">{lang.id}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 2: // CONNECTION FUN FACT
                return (
                    <div className="w-100 text-center">
                        <div className="d-flex justify-content-center mb-3 animate-chommie">
                            <Mascot width="120px" height="120px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-2" style={{ fontSize: '1.6rem' }}>
                            Fun Fact!
                        </h2>
                        <div className="brutalist-card bg-theme-surface mx-auto p-3 mb-3 shadow-action-sm border border-4 border-theme-main text-start" style={{ maxWidth: '400px' }}>
                            <p className="fw-bold mb-0 text-theme-main" style={{ fontSize: '1rem', lineHeight: '1.4' }}>
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
                                SHARP! CONTINUE
                                <ArrowRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                );
            case 3: // LEVEL
                return (
                    <div className="w-100">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.5rem' }}>
                            Your {preferences.language} level?
                        </h2>
                        <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: '400px' }}>
                            {LEVELS.map(lvl => (
                                <button 
                                    key={lvl.id}
                                    onClick={() => handleSelectOption('level', lvl.id)}
                                    className={`btn text-start p-2 brutalist-card hover-press w-100 d-flex align-items-center gap-3 ${preferences.level === lvl.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                >
                                    <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm" style={{ transform: 'scale(0.8)' }}>{lvl.icon}</div>
                                    <div>
                                        <div className="fw-black small text-uppercase">{lvl.title}</div>
                                        <div className="fw-bold text-theme-muted smaller">{lvl.detail}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Merged Outcome Section */}
                        {preferences.level && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4"
                            >
                                <div className="brutalist-card bg-theme-surface mx-auto p-3 mb-3 shadow-action-sm border border-4 border-theme-main text-start d-flex align-items-start gap-3" style={{ maxWidth: '400px' }}>
                                    <div style={{ flexShrink: 0 }}>
                                        <Mascot width="60px" height="60px" mood="excited" />
                                    </div>
                                    <p className="fw-bold mb-0 text-theme-main" style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                                        {getLevelMessage(preferences.level, preferences.language)}
                                    </p>
                                </div>
                                <div className="mx-auto px-4" style={{ maxWidth: '400px' }}>
                                    <button 
                                        onClick={() => {
                                            triggerHaptic('medium');
                                            playClick();
                                            playSwipe();
                                            setStep(4);
                                        }}
                                        className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                                        style={{ backgroundColor: 'var(--venda-yellow)' }}
                                    >
                                        CONTINUE
                                        <ArrowRight size={24} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );
            case 4: // REASON
                return (
                    <div className="w-100">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.5rem' }}>
                            Why learn {preferences.language}?
                        </h2>
                        <div className="row g-2 mx-auto" style={{ maxWidth: '400px' }}>
                            {REASONS.map(rsn => (
                                <div className="col-6" key={rsn.id}>
                                    <button 
                                        onClick={() => handleSelectOption('reason', rsn.id)}
                                        className={`btn p-3 brutalist-card hover-press w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center gap-2 ${preferences.reason === rsn.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                        style={{ minHeight: '110px' }}
                                    >
                                        <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm" style={{ transform: 'scale(0.8)' }}>{rsn.icon}</div>
                                        <span className="fw-black text-uppercase smallest ls-1">{rsn.title}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 5: // DAILY GOAL
                return (
                    <div className="w-100">
                        <div className="d-flex justify-content-center mb-3 animate-chommie">
                            <Mascot width="80px" height="80px" mood="happy" />
                        </div>
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-1" style={{ fontSize: '1.5rem' }}>
                            Your Daily Goal
                        </h2>
                        <p className="text-center fw-bold text-theme-muted mb-3 smallest text-uppercase ls-1">Stay consistent!</p>
                        <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: '400px' }}>
                            {TIMES.map(t => (
                                <button 
                                    key={t.id}
                                    onClick={() => handleSelectOption('timeId', t.id, t.mins)}
                                    className={`btn text-start p-2 brutalist-card hover-press d-flex align-items-center justify-content-between w-100 ${preferences.timeId === t.id ? 'bg-theme-accent border-theme-main text-dark' : 'bg-theme-surface text-theme-main'}`}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm d-flex align-items-center justify-content-center" style={{ transform: 'scale(0.8)' }}>{t.icon}</div>
                                        <span className="fw-black small text-uppercase">{t.title}</span>
                                    </div>
                                    <span className="badge bg-dark fw-bold smallest">{t.mins}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6: // SOURCE
                return (
                    <div className="w-100">
                        <h2 className="fw-black text-center text-uppercase ls-tight mb-3" style={{ fontSize: '1.5rem' }}>
                            Where did you find us?
                        </h2>
                        <div className="row g-2 mx-auto" style={{ maxWidth: '400px' }}>
                            {SOURCES.map(src => (
                                <div className="col-6" key={src.id}>
                                    <button 
                                        onClick={() => handleSelectOption('source', src.id)}
                                        className="btn p-3 brutalist-card hover-press w-100 bg-theme-surface h-100 d-flex flex-column align-items-center justify-content-center text-center gap-1 text-theme-main"
                                        style={{ minHeight: '110px' }}
                                    >
                                        <div className="bg-theme-base p-1 rounded-circle border border-2 border-theme-main shadow-action-sm" style={{ transform: 'scale(0.8)' }}>{src.icon}</div>
                                        <span className="fw-black text-uppercase smallest ls-1">{src.title}</span>
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
                            Building your {preferences.language ? preferences.language : 'Language'} Journey...
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
                    <div className="w-100 text-center">
                        <div className="d-flex justify-content-center mb-3 animate-chommie">
                            <Mascot width="120px" height="120px" mood="excited" />
                        </div>
                        <h2 className="fw-black text-uppercase ls-tight mb-1" style={{ fontSize: '1.8rem', color: 'var(--color-text)' }}>
                            Your Plan is Set!
                        </h2>
                        <p className="fw-bold text-theme-muted mb-4 mx-auto px-3 smaller">
                            We've customized a {preferences.timeMins ? preferences.timeMins.split('/')[0].trim() : 'custom'} daily curriculum for {preferences.language ? preferences.language : 'you'}.
                        </p>
                        <div className="mx-auto px-4" style={{ maxWidth: '400px' }}>
                            <button 
                                onClick={() => {
                                    // Save preferences to session storage so they aren't lost
                                    sessionStorage.setItem('onboarding_language', preferences.language);
                                    sessionStorage.setItem('onboarding_native', preferences.nativeLanguage);
                                    sessionStorage.setItem('onboarding_level', preferences.level);
                                    sessionStorage.setItem('onboarding_reason', preferences.reason);
                                    sessionStorage.setItem('onboarding_time', preferences.timeMins);
                                    
                                    if (onComplete) {
                                        onComplete();
                                    } else {
                                        setStep(9);
                                    }
                                }}
                                className="btn w-100 fw-black py-3 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                            >
                                CREATE ACCOUNT
                                <ArrowRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                );
            case 9:
            case 10:
            case 11:
                return (
                    <div className="w-100 text-theme-main px-3 py-2 mx-auto mt-0" style={{ maxWidth: '440px', zIndex: 10 }}>

                        <div className="text-center mb-4 mt-2">
                            <img src="/images/Logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                        </div>

                        <div className="text-center mb-4 mt-2">
                            <h2 className="fw-black text-uppercase ls-tight text-theme-main mb-2" style={{ fontSize: '1.3rem' }}>
                                {step === 9 ? "What's your name?" :
                                 step === 10 ? `Thanks ${formData.username}, what's your email?` :
                                 `Almost there ${formData.username}! Pick a password.`}
                            </h2>
                        </div>

                        {error && (
                            <div className="border border-4 border-theme-main p-3 mb-4 text-center fw-black text-uppercase shadow-action-sm"
                                 style={{ backgroundColor: '#FFD1D1', color: '#000', fontSize: '12px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setError(null);
                            
                            if (step === 9) {
                                if (!formData.username.trim()) { setError("Input your name, boss."); triggerHaptic('light'); return; }
                                playClick();
                                triggerHaptic('medium');
                                setStep(10);
                            } else if (step === 10) {
                                const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
                                if (!emailRegex.test(formData.email)) { setError("That email doesn't look right."); return; }
                                
                                setLoading(true);
                                import('../../services/authService').then(({ findUserByEmail }) => {
                                    findUserByEmail(formData.email).then((existingProfile) => {
                                        if (existingProfile) {
                                            setError("Email already exists.");
                                            triggerHaptic('light');
                                        } else {
                                            playClick();
                                            triggerHaptic('medium');
                                            setStep(11);
                                        }
                                        setLoading(false);
                                    }).catch(() => {
                                        setError("Email already exists.");
                                        setLoading(false);
                                    });
                                });
                            } else if (step === 11) {
                                handleSubmitRegistration();
                            }
                        }}>

                            {step === 9 && (
                                <div className="mb-4">
                                    <label className="form-label smallest fw-black text-uppercase ls-1">Your Name</label>
                                    <div className="custom-input-group custom-input-group--brutalist">
                                        <input name="username" type="text" className="fw-bold" placeholder="What should we call you?" value={formData.username} onChange={handleChange} required autoFocus disabled={loading} />
                                    </div>
                                </div>
                            )}

                             {step === 10 && (
                                <div className="mb-4">
                                    <label className="form-label smallest fw-black text-uppercase ls-1">Email Address</label>
                                    <div className="custom-input-group custom-input-group--brutalist">
                                        <input name="email" type="email" className="fw-bold" placeholder="vhadau@example.com" value={formData.email} onChange={handleChange} required autoFocus disabled={loading} />
                                    </div>
                                </div>
                            )}

                            {step === 11 && (
                                <>
                                    <div className="mb-4">
                                        <label className="form-label smallest fw-black text-uppercase ls-1">Create Password</label>
                                        <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                                            <input name="password" type={showPassword ? "text" : "password"} className="fw-bold" placeholder="••••••••" value={formData.password} onChange={handleChange} required autoFocus disabled={loading} />
                                            <button type="button" className="btn border-0 p-0 text-theme-main me-3 position-absolute end-0" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label smallest fw-black text-uppercase ls-1">Confirm Password</label>
                                        <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                                            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="fw-bold" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
                                            <button type="button" className="btn border-0 p-0 text-theme-main me-3 position-absolute end-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="btn w-100 fw-black py-3 mb-4 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : step === 11 ? 'Register Sharp-Sharp' : 'Continue'}
                            </button>
                        </form>

                        {step === 9 && (
                            <>
                                <div className="d-flex align-items-center my-4">
                                    <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                                    <span className="mx-3 text-theme-main smallest fw-black text-uppercase ls-1">OR</span>
                                    <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                                </div>

                                <div className="row g-2 mb-4">
                                    <div className="col-6">
                                        <button
                                            onClick={handleGoogleSignIn}
                                            className="btn w-100 h-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                                            disabled={loading}
                                        >
                                            <div className="d-flex align-items-center justify-content-center me-2" style={{ width: '20px', height: '20px' }}>
                                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            Google
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            onClick={handleGuestSignIn}
                                            className="btn w-100 h-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                                            disabled={loading}
                                        >
                                            <div className="d-flex align-items-center justify-content-center me-2" style={{ width: '20px', height: '20px' }}>
                                                <i className="bi bi-person-bounding-box fs-5 m-0 d-flex align-items-center" style={{ lineHeight: 1 }}></i>
                                            </div>
                                            Guest
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="text-center mt-5 mb-4">
                            <p className="fw-bold smallest text-uppercase text-theme-main mb-4">
                                Got an account? <Link to="/login" className="fw-black text-decoration-underline text-theme-main">Log In</Link>
                            </p>

                            <p className="text-theme-muted mx-auto" style={{ fontSize: '11px', maxWidth: '320px' }}>
                                This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" className="text-theme-muted text-decoration-underline" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" className="text-theme-muted text-decoration-underline" target="_blank" rel="noreferrer">Terms of Service</a> apply.
                            </p>
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
            {step >= -1 && step !== 7 && step !== 8 && (
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
                    
                    <div className="brutalist-card p-0" style={{ flexGrow: 1, maxWidth: '500px', height: '20px', backgroundColor: 'var(--color-surface-soft)' }}>
                        <div 
                            style={{ 
                                height: '100%', 
                                width: `${((step + 2) / 13) * 100}%`, 
                                backgroundColor: 'var(--venda-yellow)',
                                transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }} 
                        />
                    </div>
                    <div style={{ width: '28px', flexShrink: 0 }} className="ms-3 d-none d-md-block"></div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center p-2 position-relative" style={{ zIndex: 5, minHeight: 0 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="w-100 d-flex justify-content-center overflow-auto py-2"
                        style={{ maxHeight: '100%' }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Onboarding;
