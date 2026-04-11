import React, { useState, useEffect, useRef, isValidElement, useCallback } from 'react';
import {
    MessageCircle, Mic, Eye, PenTool, ArrowLeft, Star as StarIcon, Clock,
    Smile,
    Star,
    Heart,
    User,
    Crown,
    Droplets,
    CloudRain,
    Users,
    GraduationCap,
    Flower,
    Leaf,
    Sun,
    Mountain,
    Flame,
    Cloud,
    Cat,
    Coffee,
    Apple,
    Milk,
    Soup,
    Home,
    Globe,
    MapIcon,
    School,
    BookOpen,
    Footprints, ImageIcon,
    Bird,
    Stethoscope,
    Moon,
    Waves,
    Wind, Fish,
    Ham, DollarSign, Church, Shirt, Utensils, Hand, Car,
    HelpCircle, MousePointerClick, Timer
} from 'lucide-react';
import { fetchPicturePuzzles, fetchUserData, fetchLanguages } from '../../services/dataCache';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { auth, db } from '../../services/firebaseConfig';
import {doc, updateDoc, increment, getDoc, type Firestore} from 'firebase/firestore';
import Mascot from '../../components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { updateStreak } from '../../services/streakUtils';
import { popupService } from "../../services/popupService.ts";
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';

interface GameSlide {
    imageUrl: string;
    nativeWord: string;
    english: string;
}

const GAME_DURATION = 60;

const ICON_MAP: Record<string, any> = {
    // greetings & feelings
    'hello': <Smile size={48} />, 'goodbye': <Smile size={48} />, 'thank you': <Heart size={48} />, 'please': <Hand size={48} />,
    'yes': <Star size={48} fill="#FACC15" />, 'no': <Star size={48} />, 'sorry': <Smile size={48} />,
    'happy': <Smile size={48} />, 'sad': <Smile size={48} />, 'angry': <Smile size={48} />, 'love': <Heart size={48} fill="#EF4444" />,
    // people
    'person': <User size={48} />, 'man': <User size={48} />, 'woman': <User size={48} />, 'child': <User size={48} />, 'baby': <User size={48} />,
    'mother': <User size={48} />, 'father': <User size={48} />, 'family': <Users size={48} />, 'friend': <Users size={48} />,
    'king': <Crown size={48} />, 'chief': <Crown size={48} />, 'teacher': <GraduationCap size={48} />, 'doctor': <Stethoscope size={48} />,
    // nature
    'water': <Droplets size={48} />, 'rain': <CloudRain size={48} />, 'sun': <Sun size={48} />, 'moon': <Moon size={48} />, 'star': <StarIcon size={48} />,
    'tree': <Leaf size={48} />, 'flower': <Flower size={48} />, 'mountain': <Mountain size={48} />, 'river': <Waves size={48} />,
    'fire': <Flame size={48} />, 'earth': <Globe size={48} />, 'sky': <Cloud size={48} />, 'cloud': <Cloud size={48} />, 'wind': <Wind size={48} />,
    // animals
    'animal': <Cat size={48} />, 'dog': <Cat size={48} />, 'cat': <Cat size={48} />, 'bird': <Bird size={48} />, 'fish': <Fish size={48} />,
    // food
    'food': <Coffee size={48} />, 'eat': <Coffee size={48} />, 'drink': <Coffee size={48} />, 'bread': <Utensils size={48} />, 'meat': <Ham size={48} />,
    'fruit': <Apple size={48} />, 'milk': <Milk size={48} />, 'maize': <Soup size={48} />, 'porridge': <Soup size={48} />,
    // places & things
    'house': <Home size={48} />, 'home': <Home size={48} />, 'school': <School size={48} />, 'church': <Church size={48} />,
    'road': <MapIcon size={48} />, 'path': <MapIcon size={48} />, 'book': <BookOpen size={48} />, 'money': <DollarSign size={48} />, 'clothes': <Shirt size={48} />, 'car': <Car size={48} />,
    // actions
    'walk': <Footprints size={48} />, 'run': <Footprints size={48} />, 'read': <BookOpen size={48} />, 'write': <PenTool size={48} />,
    'talk': <MessageCircle size={48} />, 'speak': <Mic size={48} />, 'see': <Eye size={48} />, 'learn': <BookOpen size={48} />,
};

const getIcon = (english: string): any => {
    const lower = english.toLowerCase().trim();
    if (ICON_MAP[lower]) return ICON_MAP[lower];
    for (const [key, icon] of Object.entries(ICON_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return icon;
    }
    return <ImageIcon size={48} />;
};

const MASCOT_CHEERS = [
    'Great job!',
    'Correct!',
    'You got this!',
    'Awesome!',
    'Amazing!',
];

const CARD_BGNDS = [
    'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', // Amber
    'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Green
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
    'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', // Red
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Orange
];

const PICTURE_PUZZLE_INTRO_STEPS = [
    {
        icon: <Eye size={28} strokeWidth={3} />,
        title: 'See the English Word',
        description: 'A word appears in English with an icon to help you identify it.'
    },
    {
        icon: <MousePointerClick size={28} strokeWidth={3} />,
        title: 'Pick the Translation',
        description: 'Choose the correct translation from 4 options. Tap the right answer!'
    },
    {
        icon: <Timer size={28} strokeWidth={3} />,
        title: 'Beat the Clock!',
        description: 'Score as many points as possible before time runs out. Each correct answer = +5 XP!'
    }
];

const PicturePuzzle: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [slides, setSlides] = useState<GameSlide[]>([]);
    const [currentSlide, setCurrentSlide] = useState<GameSlide | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [gameActive, setGameActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);
    const [cardBg, setCardBg] = useState(CARD_BGNDS[0]);
    const [roundCount, setRoundCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Mascot
    const [showMascotCheer, setShowMascotCheer] = useState(false);
    const [mascotCheerText, setMascotCheerText] = useState(MASCOT_CHEERS[0]);

    const handleIntroDismiss = useCallback(() => setShowIntro(false), []);

    const handleExit = () => {
        if (gameActive) {
            setShowExitConfirm(true);
        } else {
            navigate('/mitambo');
        }
    };

    const confirmExit = () => {
        stopTimer();
        setShowExitConfirm(false);
        navigate('/mitambo');
    };

    useEffect(() => {
        loadGameData();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        if (gameActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => stopTimer();
    }, [gameActive]);

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const loadGameData = async () => {
        setLoading(true);
        try {
            const [allSlides, uData, langs] = await Promise.all([
                fetchPicturePuzzles(),
                fetchUserData(),
                fetchLanguages()
            ]);

            let activeLang: any = null;
            if (uData && langs) {
                activeLang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                setPreferredLanguage(activeLang);
            }

            const filtered = allSlides.filter((p: any) => {
                const isCorrectLang = !activeLang || p.languageId === activeLang.id || (!p.languageId && activeLang.name.toLowerCase().includes('venda'));
                return isCorrectLang;
            });
            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            setSlides(shuffled);
            if (shuffled.length > 0) {
                setGameActive(true);
                setupRound(shuffled[0], shuffled, 0);
            } else {
                popupService.error('Musi wo fhela', 'No puzzles found! Vha khou humbelwa u lingedza hafhu.');
                navigate('/mitambo');
            }
            if (auth.currentUser) {
                const snap = await getDoc(doc(db as Firestore, "users", auth.currentUser.uid));
                if (snap.exists()) setStreak(snap.data().streak || 0);
            }
        } catch (error) {
            console.error("Error loading picture puzzle:", error);
            Swal.fire('Error', 'Failed to load game data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const setupRound = (target: GameSlide, allSlides: GameSlide[], round: number) => {
        setCurrentSlide(target);
        setSelectedAnswer(null);
        setAnswerStatus(null);
        setCardBg(CARD_BGNDS[round % CARD_BGNDS.length]);
        setRoundCount(round);

        const otherOptions = allSlides
            .filter(s => s.nativeWord !== target.nativeWord)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(s => s.nativeWord);

        setOptions([target.nativeWord, ...otherOptions].sort(() => 0.5 - Math.random()));
    };

    const handleAnswer = (answer: string) => {
        if (!gameActive || !currentSlide || selectedAnswer) return;
        setSelectedAnswer(answer);

        if (answer === currentSlide.nativeWord) {
            setAnswerStatus('correct');
            const newScore = score + 5;
            setScore(newScore);

            setMascotCheerText(MASCOT_CHEERS[Math.floor(Math.random() * MASCOT_CHEERS.length)]);
            setShowMascotCheer(true);
            playCorrect();
            setTimeout(() => setShowMascotCheer(false), 900);

            setTimeout(() => {
                const currentIndex = slides.indexOf(currentSlide);
                const nextIndex = (currentIndex + 1) % slides.length;
                setupRound(slides[nextIndex], slides, roundCount + 1);
            }, 800);
        } else {
            setAnswerStatus('wrong');
            playWrong();
            triggerShake('pzl-game-arena');
            setTimeout(() => {
                setSelectedAnswer(null);
                setAnswerStatus(null);
            }, 600);
        }
    };

    const endGame = async () => {
        const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        setGameActive(false);
        stopTimer();

        const user = auth.currentUser;
        if (user && score > 0) {
            try {
                const userRef = doc(db as Firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    points: increment(score),
                    [`gamePerformance.pictureRace.lastSession`]: {
                        score,
                        duration: totalDuration,
                        timestamp: new Date().toISOString()
                    }
                });
                await updateStreak(user.uid);
            } catch (e) {
                console.error("Error saving score:", e);
            }
        }

        Swal.fire({
            title: 'Tshifhinga tsho fhela!',
            html: `<p style="font-size:14px;color:#666">Time's up!</p><h2 style="color:#FACC15;font-weight:800">+${score} XP</h2>`,
            icon: 'success',
            confirmButtonText: 'Play Again',
            confirmButtonColor: '#FACC15',
            showCancelButton: true,
            cancelButtonText: 'Exit',
            customClass: { popup: 'rounded-4' }
        }).then((result) => {
            if (result.isConfirmed) {
                setScore(0);
                setTimeLeft(GAME_DURATION);
                setGameActive(true);
                setSessionStartTime(Date.now());
                const reshuffled = [...slides].sort(() => 0.5 - Math.random());
                setSlides(reshuffled);
                setupRound(reshuffled[0], reshuffled, 0);
            } else {
                navigate('/mitambo');
            }
        });
    };

    if (loading) return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-white">
            <Mascot width="100px" height="100px" mood="excited" />
            <p className="text-muted mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading game...</p>
        </div>
    );

    const icon = currentSlide ? getIcon(currentSlide.english) : <PenTool size={48} />;
    const timerPercent = (timeLeft / GAME_DURATION) * 100;
    const timerColor = timeLeft > 20 ? '#FACC15' : timeLeft > 10 ? '#F97316' : '#EF4444';

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.02' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }}>

            {/* INTRO MODAL */}
            {showIntro && (
                <GameIntroModal
                    gameId="picturePuzzle"
                    gameTitle="PICTURE PUZZLE"
                    gameIcon={<ImageIcon size={28} strokeWidth={3} />}
                    steps={PICTURE_PUZZLE_INTRO_STEPS}
                    accentColor="#FACC15"
                    onClose={handleIntroDismiss}
                />
            )}

            {/* EXIT CONFIRM MODAL */}
            <ExitConfirmModal
                visible={showExitConfirm}
                onConfirmExit={confirmExit}
                onCancel={() => setShowExitConfirm(false)}
            />

            {/* DARK HEADER */}
            <div className="px-3 pt-4 pb-5 bg-dark text-white border-bottom border-dark border-4 shadow-action-sm">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button onClick={handleExit} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                            <ArrowLeft size={24} strokeWidth={3} fill="none" className="text-dark" />
                        </button>
                        <div className="text-center">
                            <span className="smallest fw-black text-warning uppercase ls-1 mb-0 d-block">{preferredLanguage?.name || 'Local'} Race</span>
                            <h2 className="fw-black mb-0 text-white ls-tight" style={{ fontSize: '1.5rem' }}>TSHIFANISO</h2>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button onClick={() => { resetIntroSeen('picturePuzzle'); setShowIntro(true); }} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, padding: 0 }} title="How to play">
                                <HelpCircle size={18} strokeWidth={3} className="text-dark" />
                            </button>
                             {streak > 0 && (
                                <div className="d-flex align-items-center flex-column bg-warning brutalist-card--sm px-2 py-1" title="Daily Streak">
                                    <Flame size={18} color="#000" fill="#000" />
                                    <span className="fw-black smallest text-dark">{streak}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                        {/* TIMER */}
                        <div className="d-flex align-items-center gap-2 bg-white bg-opacity-10 rounded-pill px-3 py-1">
                            <Clock size={16} style={{ color: timerColor }} />
                            <div style={{ width: '60px', height: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.1)' }} className="border border-white border-opacity-10 overflow-hidden">
                                <div style={{ width: `${timerPercent}%`, height: '100%', background: timerColor, transition: 'all 0.3s' }}></div>
                            </div>
                            <span className="fw-black smallest" style={{ color: timerColor }}>{timeLeft}S</span>
                        </div>
                        <div className="bg-warning text-dark brutalist-card--sm px-3 py-1 fw-black d-flex align-items-center gap-2 smallest shadow-action-sm">
                            <Star size={14} fill="currentColor" /> {score} XP
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div id="pzl-game-arena" className="flex-grow-1 px-3" style={{ marginTop: '-20px' }}>
                <div className="container" style={{ maxWidth: '600px' }}>

                    {/* ENGLISH WORD PROMPT CARD */}
                    <div className="brutalist-card shadow-action-sm overflow-hidden mb-5 text-center text-white p-0 animate__animated animate__zoomIn" style={{ background: cardBg }}>
                        <div className="p-5 d-flex flex-column align-items-center bg-white bg-opacity-10">
                            <div className="mb-4 p-4 rounded-circle border border-white border-2 d-flex align-items-center justify-content-center"
                                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', width: '100px', height: '100px', margin: '0 auto' }}>
                                {isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { color: '#ffffff', strokeWidth: 2.5 } as any) : icon}
                            </div>
                            <p className="smallest fw-black text-white uppercase ls-1 mb-2 opacity-75">WHAT IS THIS IN {preferredLanguage?.name || 'TARGET LANGUAGE'}?</p>
                            <h1 className="fw-black mb-0 ls-tight" style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)' }}>
                                {currentSlide?.english}
                            </h1>
                        </div>
                    </div>

                    {/* OPTIONS */}
                    <div className="row g-4 mb-5">
                        {options.map((opt, i) => {
                            const isSelected = selectedAnswer === opt;
                            const isCorrect = answerStatus === 'correct' && isSelected;
                            const isWrong = answerStatus === 'wrong' && isSelected;

                            return (
                                <div key={`${opt}-${i}`} className="col-6">
                                    <button
                                        onClick={() => { playClick(); handleAnswer(opt); }}
                                        disabled={!!selectedAnswer && answerStatus === 'correct'}
                                        className={`btn-game w-100 p-4 fw-black text-uppercase shadow-action-sm
                                            ${isCorrect ? 'bg-success text-white' : ''}
                                            ${isWrong ? 'bg-danger text-white animate__animated animate__shakeX' : ''}
                                            ${!isSelected ? 'bg-white text-dark' : ''}
                                        `}
                                        style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', letterSpacing: '1px' }}
                                    >
                                        {opt}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* ROUND COUNT */}
                    <div className="text-center">
                        <span className="text-muted fw-bold" style={{ fontSize: '11px', letterSpacing: '2px' }}>ROUND {roundCount + 1}</span>
                    </div>
                </div>
            </div>

            {/* MASCOT */}
            {showMascotCheer && (
                <div className="mascot-cheer-overlay">
                    <div className="mascot-cheer-bubble">{mascotCheerText}</div>
                    <Mascot width="70px" height="70px" mood="excited" />
                </div>
            )}

            <style>{`
                .transition-all { transition: all 0.3s ease; }

                /* PROMPT CARD */
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .pzl-card {
                    animation: cardSlideIn 0.35s ease-out;
                }

                /* OPTIONS */
                .pzl-opt-default {
                    background: white;
                    color: #111827;
                    border: 2px solid #E5E7EB;
                    box-shadow: 0 3px 0 #D1D5DB;
                }
                .pzl-opt-default:hover {
                    transform: translateY(-2px);
                    border-color: #FACC15;
                    box-shadow: 0 5px 0 #EAB308;
                }
                .pzl-opt-default:active {
                    transform: translateY(2px);
                    box-shadow: none;
                }
                .pzl-opt-correct {
                    background: #10B981 !important;
                    color: white !important;
                    border: 2px solid #059669 !important;
                    box-shadow: 0 3px 0 #047857 !important;
                }
                .pzl-opt-wrong {
                    background: #EF4444 !important;
                    color: white !important;
                    border: 2px solid #DC2626 !important;
                    box-shadow: 0 3px 0 #B91C1C !important;
                }

                /* MASCOT CHEER */
                @keyframes cheerPopIn {
                    0%   { opacity: 0; transform: translateY(40px) scale(0.7); }
                    50%  { opacity: 1; transform: translateY(-8px) scale(1.05); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .mascot-cheer-overlay {
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 60;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: cheerPopIn 0.4s ease-out forwards;
                    pointer-events: none;
                    filter: drop-shadow(0 6px 20px rgba(0,0,0,0.15));
                }
                .mascot-cheer-bubble {
                    background: #111827;
                    color: #FACC15;
                    font-size: 13px;
                    font-weight: 800;
                    font-family: var(--game-font-family);
                    padding: 6px 16px;
                    border-radius: 20px;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    box-shadow: 0 4px 16px rgba(250, 204, 21, 0.25);
                    position: relative;
                }
                .mascot-cheer-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0; height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 5px solid #111827;
                }
            `}</style>
        </div>
    );
};

export default PicturePuzzle;

