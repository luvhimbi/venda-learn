import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, increment, getDoc, type Firestore } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { fetchPuzzles, fetchUserData, fetchLanguages, awardPoints } from '../../services/dataCache';
import { ArrowLeft, Delete, Lightbulb, AlertCircle, CheckCircle2, Flame, HelpCircle, Keyboard, Search, Palette } from 'lucide-react';
import GameResultModal from '../../components/GameResultModal';
import Mascot from '../../components/Mascot';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import { updateStreak } from '../../services/streakUtils';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';

interface PuzzleWord {
    id: string;
    word: string;
    hint: string;
    translation: string;
    difficulty: string;
    languageId?: string;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const WORD_PUZZLE_INTRO_STEPS = [
    {
        icon: <Lightbulb size={28} strokeWidth={3} />,
        title: 'Read the Hint',
        description: 'A hint is shown to help you guess the hidden word. Use it wisely!'
    },
    {
        icon: <Keyboard size={28} strokeWidth={3} />,
        title: 'Type Your Guess',
        description: 'Use the keyboard to type a 5-letter word and press Enter to check it.'
    },
    {
        icon: <Palette size={28} strokeWidth={3} />,
        title: 'Follow the Colors',
        description: 'Green = correct spot, Yellow = wrong spot, Grey = not in word. Fix your guess until you get it right!'
    }
];

const WordPuzzle: React.FC = () => {
    const navigate = useNavigate();
    const [targetPuzzle, setTargetPuzzle] = useState<PuzzleWord | null>(null);
    const [preferredLanguage, setPreferredLanguage] = useState<any>(null);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [loading, setLoading] = useState(true);
    const [shake, setShake] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [checkedGuess, setCheckedGuess] = useState<string | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const [streak, setStreak] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState({ isSuccess: false, title: '', message: '', points: 0 });
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleIntroDismiss = useCallback(() => setShowIntro(false), []);

    const handleExit = () => {
        if (gameStatus === 'playing') {
            setShowExitConfirm(true);
        } else {
            navigate('/mitambo');
        }
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        navigate('/mitambo');
    };

    useEffect(() => {
        loadGame();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameStatus !== 'playing' || loading) return;

            const key = e.key.toUpperCase();
            if (key === 'ENTER') {
                handleKeyPress('ENTER');
            } else if (key === 'BACKSPACE') {
                handleKeyPress('BACKSPACE');
            } else if (/^[A-Z]$/.test(key)) {
                handleKeyPress(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStatus, loading, currentGuess]);


    const loadGame = async () => {
        setLoading(true);
        try {
            const [allPuzzles, uData, langs] = await Promise.all([
                fetchPuzzles(),
                fetchUserData(),
                fetchLanguages()
            ]);

            let activeLang: any = null;
            if (uData && langs) {
                activeLang = langs.find((l: any) => l.id === uData.preferredLanguageId);
                setPreferredLanguage(activeLang);
            }

            // Filter only 5-letter words for now to match grid
            // Also filter by language if possible
            const validPuzzles = allPuzzles.filter((p: any) => {
                const isCorrectLength = p.word.length === WORD_LENGTH;
                const isCorrectLang = !activeLang || p.languageId === activeLang.id || (!p.languageId && activeLang.name.toLowerCase().includes('venda'));
                return isCorrectLength && isCorrectLang;
            });

            if (validPuzzles.length > 0) {
                const random = validPuzzles[Math.floor(Math.random() * validPuzzles.length)];
                setTargetPuzzle(random);
            }
            if (auth.currentUser) {
                const snap = await getDoc(doc(db as Firestore, "users", auth.currentUser.uid));
                if (snap.exists()) setStreak(snap.data().streak || 0);
            }
        } catch (error) {
            console.error("Error loading puzzle:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (key: string) => {
        if (gameStatus !== 'playing') return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else {
            if (currentGuess.length < WORD_LENGTH) {
                setCurrentGuess(prev => (prev + key).toUpperCase());
            }
        }
    };

    const triggerMobileKeyboard = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const submitGuess = async () => {
        if (currentGuess.length !== WORD_LENGTH) {
            setShake(true);
            playWrong();
            triggerShake('uvumba-grid');
            setMessage({ text: "Complete the word!", type: 'error' });
            setTimeout(() => { setShake(false); setMessage(null); }, 2000);
            return;
        }

        if (currentGuess === targetPuzzle?.word.toUpperCase()) {
            const newGuesses = [...guesses, currentGuess];
            setGuesses(newGuesses);
            setCurrentGuess('');
            setGameStatus('won');
            playCorrect();
            setMessage({ text: "Correct!", type: 'success' });
            await handleWin();
        } else {
            // WRONG GUESS - Forgiving Mode
            // Don't add to guesses (don't move row)
            // Just show feedback and let them fix it
            setCheckedGuess(currentGuess);
            setShake(true);
            playWrong();
            triggerShake('uvumba-grid');
            setMessage({ text: "That's not correct - Fix your mistake!", type: 'error' });
            setTimeout(() => { setShake(false); setMessage(null); }, 3000);
        }
    };

    const handleWin = async () => {
        const totalDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const user = auth.currentUser;
        if (user) {
            // Using centralized awardPoints to ensure weekly leaderboard sync
            await awardPoints(10);

            const userRef = doc(db as Firestore, 'users', user.uid);
            await updateDoc(userRef, {
                puzzlesSolved: increment(1),
                [`gamePerformance.wordPuzzle.${targetPuzzle?.id || 'unknown'}`]: {
                    words: targetPuzzle?.word,
                    duration: totalDuration,
                    timestamp: new Date().toISOString()
                }
            });
            await updateStreak(user.uid);
        }
        setResultData({
            isSuccess: true,
            title: 'Ndi hone! (Correct!)',
            message: `You found the word: <strong>${targetPuzzle?.word}</strong> (${targetPuzzle?.translation}).`,
            points: 10
        });
        setShowResult(true);
    };

    const resetGame = () => {
        setGuesses([]);
        setCurrentGuess('');
        setCheckedGuess(null);
        setGameStatus('playing');
        setSessionStartTime(Date.now());
        loadGame();
    };

    // Keyboard Layout
    const keys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    const getKeyStatus = (key: string) => {
        if (!targetPuzzle) return '';

        // Simpler loop for "best status so far"
        let bestStatus = '';

        // Check committed guesses AND check the current "checked" guess if applicable
        const allGuessesToCheck = [...guesses];
        if (checkedGuess) allGuessesToCheck.push(checkedGuess);

        allGuessesToCheck.forEach(guess => {
            const target = targetPuzzle.word.toUpperCase();
            for (let i = 0; i < WORD_LENGTH; i++) {
                if (guess[i] === key) {
                    if (target[i] === key) return bestStatus = 'correct';
                    if (target.includes(key) && bestStatus !== 'correct') bestStatus = 'present';
                    else if (!target.includes(key)) bestStatus = 'absent';
                }
            }
        });
        return bestStatus;
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center">
            <Mascot width="100px" height="100px" mood="excited" />
            <p className="text-muted mt-3 fw-bold" style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading puzzle...</p>
        </div>
    );

    return (
        <div className="min-vh-100 py-4 d-flex flex-column align-items-center" style={{ 
            backgroundColor: '#ffffff',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' 
        }}>
            {/* RESULT MODAL */}
            <GameResultModal
                isOpen={showResult}
                isSuccess={resultData.isSuccess}
                title={resultData.title}
                message={resultData.message}
                points={resultData.points}
                primaryActionText="PLAY AGAIN"
                secondaryActionText="EXIT TO MENU"
                onPrimaryAction={() => { setShowResult(false); resetGame(); }}
                onSecondaryAction={() => { setShowResult(false); navigate('/mitambo'); }}
            />

            {/* INTRO MODAL */}
            {showIntro && (
                <GameIntroModal
                    gameId="wordPuzzle"
                    gameTitle="WORD PUZZLE"
                    gameIcon={<Search size={28} strokeWidth={3} />}
                    steps={WORD_PUZZLE_INTRO_STEPS}
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

            <div className="container" style={{ maxWidth: '500px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <button onClick={handleExit} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="text-center">
                        <span className="smallest fw-black text-muted uppercase ls-1 mb-0 d-block">{preferredLanguage?.name || 'Local'} Word</span>
                        <h2 className="fw-black mb-0 text-dark ls-tight" style={{ fontSize: '1.5rem' }}>U VUMBA</h2>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button onClick={() => { resetIntroSeen('wordPuzzle'); setShowIntro(true); }} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, padding: 0 }} title="How to play">
                            <HelpCircle size={18} strokeWidth={3} className="text-dark" />
                        </button>
                         {streak > 0 && (
                            <div className="d-flex align-items-center flex-column bg-white brutalist-card--sm px-2 py-1" title="Daily Streak">
                                <Flame size={18} color="#EF4444" fill="#EF4444" />
                                <span className="fw-black smallest text-dark">{streak}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* FEEDBACK MESSAGE */}
                {message && (
                    <div className={`brutalist-card--sm ${message.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'} py-2 px-3 text-center fw-black shadow-action-sm mb-3 animate__animated animate__shakeX d-flex align-items-center justify-content-center gap-2 uppercase smallest`}>
                        {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {message.text}
                    </div>
                )}

                {/* HINT BANNER */}
                <div className="brutalist-card p-3 mb-4 shadow-action-sm d-flex align-items-center gap-3 animate__animated animate__fadeInDown bg-warning">
                    <div className="bg-white p-2 border border-2 border-dark rounded-circle">
                        <Lightbulb className="text-dark" size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <p className="text-uppercase smallest fw-black text-dark ls-1 mb-0 opacity-75">MURERO (HINT)</p>
                        <p className="mb-0 fw-black text-dark uppercase">{targetPuzzle?.hint}</p>
                    </div>
                </div>

                {/* HIDDEN INPUT FOR MOBILE KEYBOARD */}
                <input
                    ref={inputRef}
                    type="text"
                    style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleKeyPress('ENTER');
                        else if (e.key === 'Backspace') handleKeyPress('BACKSPACE');
                        else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
                    }}
                    autoFocus
                />

                {/* GAME GRID */}
                <div id="uvumba-grid" className="d-flex flex-column gap-2 mb-5" onClick={triggerMobileKeyboard} style={{ cursor: 'pointer' }}>
                    {/* Previous Guesses */}
                    {guesses.map((guess, i) => (
                        <div key={i} className="d-flex gap-2 justify-content-center">
                            {guess.split('').map((letter, j) => {
                                const target = targetPuzzle?.word.toUpperCase() || '';
                                let status = 'bg-white border-secondary text-dark';
                                if (target[j] === letter) status = 'bg-success text-white border-success';
                                else if (target.includes(letter)) status = 'bg-warning text-dark border-warning';
                                else status = 'bg-secondary text-white border-secondary';

                                return (
                                    <div key={j} className={`guess-box ${status} fw-bold d-flex align-items-center justify-content-center fs-2 rounded shadow-sm`}>
                                        {letter}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Current Guess */}
                    {gameStatus === 'playing' && guesses.length < MAX_GUESSES && (
                        <div className={`d-flex gap-2 justify-content-center ${shake ? 'shake-animation' : ''}`}>
                            {[...Array(WORD_LENGTH)].map((_, i) => {
                                const letter = currentGuess[i] || '';
                                let status = 'bg-white border-dark text-dark';

                                // Show hints if we checked the guess
                                if (checkedGuess && letter && checkedGuess.length === WORD_LENGTH) {
                                    const target = targetPuzzle?.word.toUpperCase() || '';
                                    if (target[i] === letter) status = 'bg-success text-white border-success';
                                    else if (target.includes(letter)) status = 'bg-warning text-dark border-warning';
                                    else status = 'bg-secondary text-white border-secondary';
                                }

                                return (
                                    <div
                                        key={i}
                                        className={`guess-box border-2 fw-bold d-flex align-items-center justify-content-center fs-2 rounded shadow-sm ${status} ${!letter && i === currentGuess.length ? 'active-slot' : ''}`}
                                    >
                                        {letter}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty Slots */}
                    {[...Array(Math.max(0, MAX_GUESSES - 1 - guesses.length))].map((_, i) => (
                        <div key={i} className="d-flex gap-2 justify-content-center">
                            {[...Array(WORD_LENGTH)].map((_, j) => (
                                <div key={j} className="guess-box bg-light border border-secondary-subtle text-muted d-flex align-items-center justify-content-center fs-2 rounded opacity-50">
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* KEYBOARD */}
                <div className="w-100 px-1">
                    {keys.map((row, i) => (
                        <div key={i} className="d-flex justify-content-center gap-1 mb-1">
                            {row.map(key => {
                                const status = getKeyStatus(key);
                                let btnClass = 'bg-white';
                                if (status === 'correct') btnClass = 'bg-success text-white';
                                else if (status === 'present') btnClass = 'bg-warning text-dark';
                                else if (status === 'absent') btnClass = 'bg-secondary text-white opacity-50';

                                return (
                                    <button
                                        key={key}
                                        onClick={() => { playClick(); handleKeyPress(key); }}
                                        className={`btn-game ${btnClass} fw-black shadow-action-sm key-btn p-0`}
                                        style={{
                                            flex: key === 'ENTER' || key === 'BACKSPACE' ? '2' : '1',
                                            height: '54px',
                                            fontSize: key === 'ENTER' || key === 'BACKSPACE' ? '10px' : '18px',
                                            borderWidth: '3px'
                                        }}
                                    >
                                        {key === 'BACKSPACE' ? <Delete size={20} strokeWidth={3} /> : key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div style={{ height: 40 }}></div>
            </div>

            <style>{`
                .guess-box {
                    width: clamp(45px, 12vw, 55px);
                    height: clamp(45px, 12vw, 55px);
                    font-size: clamp(1.2rem, 5vw, 2rem) !important;
                    transition: all 0.2s;
                    text-transform: uppercase;
                }
                .key-btn {
                    height: clamp(45px, 10vw, 55px);
                    font-size: clamp(0.7rem, 3vw, 0.9rem);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 0;
                }
                .ls-1 { letter-spacing: 1px; }
                .active-slot {
                    border-color: #FACC15 !important;
                    box-shadow: 0 0 10px rgba(250, 204, 21, 0.3);
                    transform: scale(1.05);
                }
                .shake-animation {
                    animation: shake 0.5s;
                }
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
            `}</style>
        </div>
    );
};

export default WordPuzzle;




