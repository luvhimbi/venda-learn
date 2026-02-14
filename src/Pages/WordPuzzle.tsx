import React, { useState, useEffect } from 'react';
import { fetchPuzzles, refreshUserData } from '../services/dataCache';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

interface PuzzleWord {
    id: string;
    word: string;
    hint: string;
    translation: string;
    difficulty: string;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const WordPuzzle: React.FC = () => {
    const navigate = useNavigate();
    const [targetPuzzle, setTargetPuzzle] = useState<PuzzleWord | null>(null);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
    const [loading, setLoading] = useState(true);
    const [shake, setShake] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [checkedGuess, setCheckedGuess] = useState<string | null>(null);

    useEffect(() => {
        loadGame();
    }, []);

    const loadGame = async () => {
        setLoading(true);
        try {
            const allPuzzles = await fetchPuzzles();
            // Filter only 5-letter words for now to match grid
            const validPuzzles = allPuzzles.filter((p: any) => p.word.length === WORD_LENGTH);

            if (validPuzzles.length > 0) {
                const random = validPuzzles[Math.floor(Math.random() * validPuzzles.length)];
                setTargetPuzzle(random);
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

    const submitGuess = async () => {
        if (currentGuess.length !== WORD_LENGTH) {
            setShake(true);
            setMessage({ text: "Nwalani mailede othe! (Complete the word)", type: 'error' });
            setTimeout(() => { setShake(false); setMessage(null); }, 2000);
            return;
        }

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === targetPuzzle?.word.toUpperCase()) {
            setGameStatus('won');
            setMessage({ text: "Ndi zwone! (Correct!)", type: 'success' });
            await handleWin();
        } else {
            // WRONG GUESS - Forgiving Mode
            // Don't add to guesses (don't move row)
            // Just show feedback and let them fix it
            setCheckedGuess(currentGuess);
            setShake(true);
            setMessage({ text: "A si zwone! (That's not correct - Fix your mistake)", type: 'error' });
            setTimeout(() => { setShake(false); setMessage(null); }, 3000);
        }
    };

    const handleWin = async () => {
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                points: increment(10),
                puzzlesSolved: increment(1)
            });
            await refreshUserData();
        }
        Swal.fire({
            title: 'Ndi hone! (Correct!)',
            text: `You found the word: ${targetPuzzle?.word} (${targetPuzzle?.translation}). +10 LP`,
            icon: 'success',
            confirmButtonText: 'Play Again',
            confirmButtonColor: '#FACC15'
        }).then(() => {
            resetGame();
        });
    };

    const resetGame = () => {
        setGuesses([]);
        setCurrentGuess('');
        setCheckedGuess(null);
        setGameStatus('playing');
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
        <div className="min-vh-100 d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning"></div>
        </div>
    );

    return (
        <div className="min-vh-100 bg-light py-4 d-flex flex-column align-items-center">
            <div className="container" style={{ maxWidth: '500px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button onClick={() => navigate('/')} className="btn btn-outline-dark btn-sm rounded-circle">
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h4 className="fw-bold mb-0 text-uppercase ls-1">U Vumba</h4>
                    <div style={{ width: 32 }}></div>
                </div>

                {/* FEEDBACK MESSAGE */}
                {message && (
                    <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} py-2 text-center fw-bold shadow-sm mb-4 animate__animated animate__fadeIn`}>
                        {message.text}
                    </div>
                )}

                {/* GAME GRID */}
                <div className="d-flex flex-column gap-2 mb-5">
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
                                if (checkedGuess && letter) {
                                    const target = targetPuzzle?.word.toUpperCase() || '';
                                    if (target[i] === letter) status = 'bg-success text-white border-success';
                                    else if (target.includes(letter)) status = 'bg-warning text-dark border-warning';
                                    else status = 'bg-secondary text-white border-secondary';
                                }

                                return (
                                    <div key={i} className={`guess-box border-2 fw-bold d-flex align-items-center justify-content-center fs-2 rounded shadow-sm ${status}`}>
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
                <div className="w-100">
                    {keys.map((row, i) => (
                        <div key={i} className="d-flex justify-content-center gap-1 mb-2">
                            {row.map(key => {
                                const status = getKeyStatus(key);
                                let btnClass = 'btn-light text-dark';
                                if (status === 'correct') btnClass = 'btn-success text-white';
                                else if (status === 'present') btnClass = 'btn-warning text-dark';
                                else if (status === 'absent') btnClass = 'btn-secondary text-white opacity-50';

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleKeyPress(key)}
                                        className={`btn ${btnClass} fw-bold shadow-sm key-btn`}
                                        style={{ minWidth: key === 'ENTER' || key === 'BACKSPACE' ? '65px' : '35px' }}
                                    >
                                        {key === 'BACKSPACE' ? <i className="bi bi-backspace"></i> : key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="text-center mt-4">
                    <p className="text-muted small">Hint: {targetPuzzle?.hint}</p>
                </div>
            </div>

            <style>{`
                .guess-box {
                    width: 55px;
                    height: 55px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                }
                .key-btn {
                    height: 50px;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
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
