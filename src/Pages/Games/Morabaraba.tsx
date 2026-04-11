import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, Info, Trophy, User, Monitor, RotateCcw, Palette, Check } from 'lucide-react';
import { doc, updateDoc, increment, type Firestore } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { refreshUserData } from '../../services/dataCache';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import Swal from 'sweetalert2';

// --- CONSTANTS ---
const COWS_PER_PLAYER = 12;
const XP_REWARD = 10;

// Board Geometry
const RING_OFFSETS = [50, 130, 210];
const RING_SIZES = [400, 240, 80];
const CENTER = 250;

type Player = 1 | 2; // 1 = Human/P1, 2 = AI/P2
type Phase = 'placing' | 'moving' | 'flying';

interface Junction {
    id: number; // 0-23
    r: number; // 0-2
    i: number; // 0-7
    x: number;
    y: number;
}
 
interface ThemeConfig {
    id: string;
    name: string;
    boardBg: string;
    lineColor: string;
    p1: { type: 'emoji' | 'shape'; value: string; color: string; };
    p2: { type: 'emoji' | 'shape'; value: string; color: string; };
}
 
const THEMES: ThemeConfig[] = [
    {
        id: 'traditional',
        name: 'Cattle Ranch',
        boardBg: '#ffffff',
        lineColor: '#000000',
        p1: { type: 'emoji', value: '🐂', color: '#FACC15' },
        p2: { type: 'emoji', value: '🐃', color: '#1e293b' }
    },
    {
        id: 'wooden',
        name: 'Royal Wood',
        boardBg: '#78350f',
        lineColor: '#451a03',
        p1: { type: 'shape', value: 'circle', color: '#fbbf24' },
        p2: { type: 'shape', value: 'circle', color: '#059669' }
    },
    {
        id: 'patriotic',
        name: 'South Africa',
        boardBg: '#1e293b',
        lineColor: '#ffffff',
        p1: { type: 'shape', value: 'gem', color: '#e11d48' },
        p2: { type: 'shape', value: 'gem', color: '#16a34a' }
    },
    {
        id: 'midnight',
        name: 'Midnight Stone',
        boardBg: '#0f172a',
        lineColor: '#38bdf8',
        p1: { type: 'shape', value: 'stone', color: '#94a3b8' },
        p2: { type: 'shape', value: 'stone', color: '#475569' }
    }
];

// Generate junctions
const JUNCTIONS: Junction[] = [];
for (let r = 0; r < 3; r++) {
    const offset = RING_OFFSETS[r];
    const size = RING_SIZES[r];
    const end = offset + size;
    const mid = CENTER;

    // Ordered 0-7 (TL, TM, TR, MR, BR, BM, BL, ML)
    const points = [
        { x: offset, y: offset }, { x: mid, y: offset }, { x: end, y: offset },
        { x: end, y: mid }, { x: end, y: end }, { x: mid, y: end },
        { x: offset, y: end }, { x: offset, y: mid }
    ];

    points.forEach((p, i) => {
        JUNCTIONS.push({ id: r * 8 + i, r, i, x: p.x, y: p.y });
    });
}

// Adjacency and Mills
const getNeighbors = (id: number): number[] => {
    const r = Math.floor(id / 8);
    const i = id % 8;
    const neighbors: number[] = [];

    // Same ring
    neighbors.push(r * 8 + (i + 1) % 8);
    neighbors.push(r * 8 + (i + 7) % 8);

    // Cross rings
    if (r > 0) neighbors.push((r - 1) * 8 + i);
    if (r < 2) neighbors.push((r + 1) * 8 + i);

    return neighbors;
};

const ALL_MILLS: number[][] = [];
// Horizontal/Vertical mills on each ring
for (let r = 0; r < 3; r++) {
    ALL_MILLS.push([r * 8 + 0, r * 8 + 1, r * 8 + 2]);
    ALL_MILLS.push([r * 8 + 2, r * 8 + 3, r * 8 + 4]);
    ALL_MILLS.push([r * 8 + 4, r * 8 + 5, r * 8 + 6]);
    ALL_MILLS.push([r * 8 + 6, r * 8 + 7, r * 8 + 0]);
}
// Cross-ring mills (including diagonals in Morabaraba)
for (let i = 0; i < 8; i++) {
    ALL_MILLS.push([0 * 8 + i, 1 * 8 + i, 2 * 8 + i]);
}

const MORABARABA_INTRO_STEPS = [
    {
        icon: <Info size={28} strokeWidth={3} />,
        title: 'Phase 1: Placing',
        description: 'Take turns placing your 12 cows on any empty junction. Form a mill (3 in a row) to remove an opponent\'s cow!'
    },
    {
        icon: <RotateCcw size={28} strokeWidth={3} />,
        title: 'Phase 2: Moving',
        description: 'Once all cows are placed, slide your cows to adjacent empty junctions to form new mills.'
    },
    {
        icon: <Trophy size={28} strokeWidth={3} />,
        title: 'Phase 3: Flying',
        description: 'When you only have 3 cows left, you can fly! Move to ANY empty junction on the board.'
    }
];

const Morabaraba: React.FC = () => {
    const navigate = useNavigate();
    const { playCorrect, playWrong, playClick, triggerShake } = useVisualJuice();
    
    // Game State
    const [board, setBoard] = useState<(Player | null)[]>(Array(24).fill(null));
    const [turn, setTurn] = useState<Player>(1);
    const [phaseP1, setPhaseP1] = useState<Phase>('placing');
    const [phaseP2, setPhaseP2] = useState<Phase>('placing');
    const [placingCount, setPlacingCount] = useState({ 1: COWS_PER_PLAYER, 2: COWS_PER_PLAYER });
    const [shootMode, setShootMode] = useState(false);
    const [selectedJunction, setSelectedJunction] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState<Player | 'draw' | null>(null);
    
    // UI State
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isVsAI, setIsVsAI] = useState(true);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
        const saved = localStorage.getItem('morabaraba_theme');
        return THEMES.find(t => t.id === saved) || THEMES[0];
    });
 
    useEffect(() => {
        localStorage.setItem('morabaraba_theme', currentTheme.id);
    }, [currentTheme]);
    
    // Haptic Logic
    const triggerHaptic = useCallback((pattern: number | number[]) => {
        if ('vibrate' in navigator) {
            try { navigator.vibrate(pattern); } catch (e) { /* silent */ }
        }
    }, []);

    // Helpers
    const getCowsOnBoard = useCallback((player: Player) => {
        return board.filter(owner => owner === player).length;
    }, [board]);

    const isJunctionInMill = useCallback((id: number, player: Player, currentBoard: (Player | null)[]) => {
        return ALL_MILLS.some(mill => 
            mill.includes(id) && mill.every(mid => currentBoard[mid] === player)
        );
    }, []);

    const hasLegalMoves = useCallback((player: Player, currentBoard: (Player | null)[]) => {
        const playerPhase = player === 1 ? phaseP1 : phaseP2;
        if (playerPhase === 'flying') return currentBoard.some(j => j === null);
        
        for (let i = 0; i < 24; i++) {
            if (currentBoard[i] === player) {
                const neighbors = getNeighbors(i);
                if (neighbors.some(n => currentBoard[n] === null)) return true;
            }
        }
        return false;
    }, [phaseP1, phaseP2]);

    const checkWinCondition = useCallback((player: Player, currentBoard: (Player | null)[], currentPlacingCount: {1:number,2:number}) => {
        const opponent = player === 1 ? 2 : 1;
        
        // If opponent is out of placement and has < 3 cows
        if (currentPlacingCount[opponent] === 0 && getCowsOnBoard(opponent) < 3) return player;
        
        // If opponent has no legal moves
        if (currentPlacingCount[opponent] === 0 && !hasLegalMoves(opponent, currentBoard)) return player;
        
        return null;
    }, [getCowsOnBoard, hasLegalMoves]);

    // Handle Victory
    const handleWinner = async (winner: Player) => {
        setGameOver(winner);
        if (winner === 1 && auth.currentUser) {
            const userRef = doc(db as Firestore, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                points: increment(XP_REWARD),
                morabarabaWins: increment(1)
            });
            await refreshUserData();
            playCorrect();
        }
        
        Swal.fire({
            title: winner === 1 ? 'MUWINA! (Winner!)' : 'LOSE (Try Again)',
            text: winner === 1 ? `Congratulations! You defeated the ${isVsAI ? 'CPU' : 'Player 2'}. +${XP_REWARD} XP` : 'Better luck next time!',
            icon: winner === 1 ? 'success' : 'error',
            confirmButtonText: 'PLAY AGAIN',
            confirmButtonColor: '#FACC15',
            showCancelButton: true,
            cancelButtonText: 'DASHBOARD',
        }).then(res => {
            if (res.isConfirmed) resetGame();
            else navigate('/mitambo');
        });
    };

    // Game Actions
    const performAction = useCallback(async (id: number) => {
        if (gameOver || aiProcessing) return;

        const currentPlayer = turn;
        const opponent = currentPlayer === 1 ? 2 : 1;
        const currentPhase = currentPlayer === 1 ? phaseP1 : phaseP2;

        // --- SHOOT MODE ---
        if (shootMode) {
            if (board[id] !== opponent) return;
            
            // Check Rule: cannot shoot from a mill unless ALL opponent's pieces are in mills
            const opponentCows = board.map((o, idx) => o === opponent ? idx : -1).filter(idx => idx !== -1);
            const allInMills = opponentCows.every(cowId => isJunctionInMill(cowId, opponent, board));
            
            if (!allInMills && isJunctionInMill(id, opponent, board)) {
                playWrong();
                triggerShake('m-board');
                return;
            }

            const newBoard = [...board];
            newBoard[id] = null;
            setBoard(newBoard);
            setShootMode(false);
            playCorrect();
            triggerHaptic([100, 50, 100]); // Mill confirmation vibration

            // Check if game ended after removal
            const winner = checkWinCondition(currentPlayer, newBoard, placingCount);
            if (winner) {
                handleWinner(winner);
                return;
            }

            setTurn(opponent);
            return;
        }

        // --- PLACING PHASE ---
        if (currentPhase === 'placing') {
            if (board[id] !== null) return;
            
            const newBoard = [...board];
            newBoard[id] = currentPlayer;
            const newPlacing = { ...placingCount, [currentPlayer]: placingCount[currentPlayer] - 1 };
            
            setBoard(newBoard);
            setPlacingCount(newPlacing);
            playClick();

            // Check mill
            if (isJunctionInMill(id, currentPlayer, newBoard)) {
                setShootMode(true);
                triggerHaptic(50);
            } else {
                setTurn(opponent);
            }

            // Phase transition check
            if (newPlacing[1] === 0) setPhaseP1(getCowsOnBoard(1) <= 3 ? 'flying' : 'moving');
            if (newPlacing[2] === 0) setPhaseP2(getCowsOnBoard(2) <= 3 ? 'flying' : 'moving');
            
            return;
        }

        // --- MOVING / FLYING PHASE ---
        if (selectedJunction === null) {
            // Select cow
            if (board[id] !== currentPlayer) return;
            setSelectedJunction(id);
            playClick();
        } else {
            // Move cow
            if (id === selectedJunction) {
                setSelectedJunction(null);
                return;
            }
            if (board[id] !== null) {
                if (board[id] === currentPlayer) setSelectedJunction(id); // Change selection
                return;
            }

            const isFlying = currentPhase === 'flying';
            const neighbors = getNeighbors(selectedJunction);

            if (!isFlying && !neighbors.includes(id)) {
                playWrong();
                return;
            }

            const newBoard = [...board];
            newBoard[selectedJunction] = null;
            newBoard[id] = currentPlayer;
            
            setBoard(newBoard);
            setSelectedJunction(null);
            playClick();

            // Mill check
            if (isJunctionInMill(id, currentPlayer, newBoard)) {
                setShootMode(true);
                triggerHaptic(50);
            } else {
                setTurn(opponent);
            }

            // Update opponent phase if they dropped to 3 cows
            if (getCowsOnBoard(opponent) === 3 && (opponent === 1 ? phaseP1 : phaseP2) === 'moving') {
                if (opponent === 1) setPhaseP1('flying');
                else setPhaseP2('flying');
            }
        }
    }, [board, turn, shootMode, selectedJunction, phaseP1, phaseP2, placingCount, gameOver, aiProcessing, checkWinCondition, getCowsOnBoard, isJunctionInMill]);

    // AI Logic
    useEffect(() => {
        if (isVsAI && turn === 2 && !gameOver && !shootMode) {
            setAiProcessing(true);
            const timer = setTimeout(() => {
                const currentPhase = phaseP2;

                if (currentPhase === 'placing') {
                    // Smart placement: try to form mills or block player
                    const emptyJunctions = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
                    // 1. Try to form a mill
                    const millMaker = emptyJunctions.find(id => {
                        const testBoard = [...board]; testBoard[id] = 2;
                        return isJunctionInMill(id, 2, testBoard);
                    });
                    if (millMaker !== undefined) { performAction(millMaker); setAiProcessing(false); return; }
                    // 2. Block player mill
                    const playerBlocker = emptyJunctions.find(id => {
                        const testBoard = [...board]; testBoard[id] = 1;
                        return isJunctionInMill(id, 1, testBoard);
                    });
                    if (playerBlocker !== undefined) { performAction(playerBlocker); setAiProcessing(false); return; }
                    // 3. Random
                    performAction(emptyJunctions[Math.floor(Math.random() * emptyJunctions.length)]);
                } else {
                    // Selection/Move
                    const cpuCows = board.map((v, i) => v === 2 ? i : -1).filter(i => i !== -1);
                    const moves: { from: number, to: number }[] = [];
                    
                    cpuCows.forEach(from => {
                        const targets = currentPhase === 'flying' 
                            ? board.map((v, i) => v === null ? i : -1).filter(i => i !== -1)
                            : getNeighbors(from).filter(n => board[n] === null);
                        
                        targets.forEach(to => moves.push({ from, to }));
                    });

                    if (moves.length > 0) {
                        // Priority: Move to form mill
                        const millMove = moves.find(m => {
                           const b = [...board]; b[m.from] = null; b[m.to] = 2;
                           return isJunctionInMill(m.to, 2, b);
                        });
                        const selectedMove = millMove || moves[Math.floor(Math.random() * moves.length)];
                        
                        // Fake selection then action
                        setSelectedJunction(selectedMove.from);
                        setTimeout(() => {
                            performAction(selectedMove.to);
                            setAiProcessing(false);
                        }, 500);
                        return;
                    }
                }
                setAiProcessing(false);
            }, 1000);
            return () => clearTimeout(timer);
        }

        // AI Shooting
        if (isVsAI && turn === 2 && shootMode && !gameOver) {
            setAiProcessing(true);
            const timer = setTimeout(() => {
                const playerCows = board.map((v, i) => v === 1 ? i : -1).filter(i => i !== -1);
                const allInMills = playerCows.every(id => isJunctionInMill(id, 1, board));
                
                const targets = playerCows.filter(id => allInMills || !isJunctionInMill(id, 1, board));
                if (targets.length > 0) {
                    performAction(targets[Math.floor(Math.random() * targets.length)]);
                }
                setAiProcessing(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, shootMode, board, isVsAI, gameOver, phaseP2, performAction]);


    const resetGame = () => {
        setBoard(Array(24).fill(null));
        setTurn(1);
        setPhaseP1('placing');
        setPhaseP2('placing');
        setPlacingCount({ 1: COWS_PER_PLAYER, 2: COWS_PER_PLAYER });
        setShootMode(false);
        setSelectedJunction(null);
        setGameOver(null);
        setAiProcessing(false);
    };

    return (
        <div className="min-vh-100 bg-white py-4 overflow-hidden" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            {/* MODALS */}
            {showIntro && (
                <GameIntroModal
                    gameId="morabaraba"
                    gameTitle="MORABARABA"
                    gameIcon={<Trophy size={28} strokeWidth={3} />}
                    steps={MORABARABA_INTRO_STEPS}
                    accentColor="#FACC15"
                    onClose={() => setShowIntro(false)}
                />
            )}
            <ExitConfirmModal
                visible={showExitConfirm}
                onConfirmExit={() => navigate('/mitambo')}
                onCancel={() => setShowExitConfirm(false)}
            />
 
            {/* THEME PICKER MODAL */}
            <AnimatePresence>
                {showThemePicker && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                        style={{ backgroundColor: 'rgba(0,0,0,0.8)', zignore: 2000, zIndex: 2000 }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="brutalist-card bg-white p-4 w-100 shadow-action"
                            style={{ maxWidth: '500px' }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-black mb-0 ls-tight">CUSTOMIZE GAME</h3>
                                <button onClick={() => setShowThemePicker(false)} className="btn-close"></button>
                            </div>
                            
                            <div className="row g-3">
                                {THEMES.map(theme => (
                                    <div key={theme.id} className="col-12">
                                        <button 
                                            onClick={() => { setCurrentTheme(theme); setShowThemePicker(false); }}
                                            className={`w-100 text-start brutalist-card p-3 transition-all d-flex align-items-center justify-content-between ${currentTheme.id === theme.id ? 'border-primary bg-light shadow-action-sm' : 'border-dark'}`}
                                            style={{ borderWidth: '3px' }}
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded-2 border border-2 border-dark" style={{ width: 40, height: 40, backgroundColor: theme.boardBg }}></div>
                                                <div>
                                                    <h6 className="fw-black mb-0 smallest uppercase">{theme.name}</h6>
                                                    <div className="d-flex gap-1 mt-1">
                                                        <div className="rounded-circle border border-1 border-dark" style={{ width: 12, height: 12, backgroundColor: theme.p1.color }}></div>
                                                        <div className="rounded-circle border border-1 border-dark" style={{ width: 12, height: 12, backgroundColor: theme.p2.color }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {currentTheme.id === theme.id && <Check className="text-primary" size={24} strokeWidth={4} />}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => setShowThemePicker(false)} className="btn-game btn-game-primary w-100 mt-4 py-3 fw-black uppercase">
                                DONE
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container" style={{ maxWidth: '800px' }}>
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                    <button onClick={() => setShowExitConfirm(true)} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="text-center">
                        <span className="smallest fw-black text-muted uppercase ls-1 mb-0 d-block">Strategy Quest</span>
                        <h2 className="fw-black mb-0 text-dark ls-tight" style={{ fontSize: '1.5rem' }}>MORABARABA</h2>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button onClick={() => setShowThemePicker(true)} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, padding: 0 }}>
                            <Palette size={22} className="text-dark" strokeWidth={3} />
                        </button>
                        <button onClick={() => setIsVsAI(!isVsAI)} className={`btn-game ${isVsAI ? 'btn-game-primary' : 'btn-game-white'} rounded-pill px-3 py-1 smallest fw-black uppercase`}>
                            {isVsAI ? 'CPU' : 'PVP'}
                        </button>
                        <button onClick={() => { resetIntroSeen('morabaraba'); setShowIntro(true); }} className="btn-game btn-game-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, padding: 0 }}>
                            <HelpCircle size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="row g-4 justify-content-center">
                    {/* PLAYER 1 INFO - Side-by-side on mobile */}
                    <div className="col-6 col-lg-3 order-1 order-lg-3 d-flex flex-column">
                        <div className={`brutalist-card p-2 p-md-3 mb-3 transition-all h-100 ${turn === 1 ? 'border-warning shadow-action-sm' : 'opacity-75'}`} style={{ borderWidth: turn === 1 ? '4px' : '2px' }}>
                            <div className="d-flex align-items-center gap-2 mb-1 mb-md-2">
                                <div className="p-1 p-md-2 bg-warning bg-opacity-10 rounded-circle border border-2 border-dark d-none d-md-inline-block">
                                    <User size={16} className="text-dark" strokeWidth={3} />
                                </div>
                                <h5 className="fw-black mb-0 text-dark" style={{ fontSize: '0.85rem' }}>YOU (P1)</h5>
                            </div>
                            
                            <div className="d-flex flex-column fw-bold text-dark uppercase gap-0" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                <span>Cows: <span>{getCowsOnBoard(1)}</span></span>
                                <span>Stock: <span>{placingCount[1]}</span></span>
                            </div>

                            <div className="d-none d-md-block progress mt-2" style={{ height: '6px' }}>
                                <div className="progress-bar bg-warning" style={{ width: `${(getCowsOnBoard(1) / COWS_PER_PLAYER) * 100}%` }}></div>
                            </div>

                            <div className="mt-auto pt-2">
                                {turn === 1 && !shootMode && <span className="badge bg-warning text-dark fw-black smallest animate__animated animate__flash animate__infinite px-1">TURN</span>}
                                {turn === 1 && shootMode && <span className="badge bg-danger text-white fw-black smallest animate__animated animate__pulse animate__infinite px-1">SHOOT</span>}
                            </div>
                        </div>
                    </div>

                    {/* BOARD */}
                    <div className="col-12 col-lg-6 order-3 order-lg-2 d-flex justify-content-center">
                        <div id="m-board" className="brutalist-card p-1 p-md-2 shadow-action position-relative overflow-hidden" style={{ width: 'min(98vw, 500px)', height: 'min(98vw, 500px)', border: '6px solid #111', backgroundColor: currentTheme.boardBg }}>
                            <svg viewBox="0 0 500 500" className="w-100 h-100">
                                <defs>
                                    {/* Wood Pattern */}
                                    <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="100" height="100">
                                        <rect width="100" height="100" fill="#78350f" />
                                        <path d="M0 20 Q 50 10 100 20 M0 50 Q 50 60 100 50 M0 80 Q 50 70 100 80" stroke="#451a03" strokeWidth="2" fill="none" opacity="0.5" />
                                    </pattern>
                                    {/* Flag Decoration (Simplified SA Colors) */}
                                    <linearGradient id="flagGrad" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#e11d48" />
                                        <stop offset="45%" stopColor="#ffffff" />
                                        <stop offset="50%" stopColor="#16a34a" />
                                        <stop offset="55%" stopColor="#ffffff" />
                                        <stop offset="100%" stopColor="#1e293b" />
                                    </linearGradient>
                                </defs>

                                {/* Background Layer */}
                                {currentTheme.id === 'wooden' && <rect width="500" height="500" fill="url(#woodPattern)" />}
                                {currentTheme.id === 'patriotic' && <rect width="500" height="500" fill="url(#flagGrad)" opacity="0.3" />}
                                {currentTheme.id === 'midnight' && <rect width="500" height="500" fill={currentTheme.boardBg} />}

                                {/* Grid Lines */}
                                <g stroke={currentTheme.lineColor} strokeWidth="4" fill="none">
                                    {/* Rings */}
                                    <rect x="50" y="50" width="400" height="400" />
                                    <rect x="130" y="130" width="240" height="240" />
                                    <rect x="210" y="210" width="80" height="80" />
                                    
                                    {/* Mid Connectors */}
                                    <line x1="250" y1="50" x2="250" y2="210" />
                                    <line x1="250" y1="290" x2="250" y2="450" />
                                    <line x1="50" y1="250" x2="210" y2="250" />
                                    <line x1="290" y1="250" x2="450" y2="250" />
                                    
                                    {/* Corner Connectors (Morabaraba specials) */}
                                    <line x1="50" y1="50" x2="210" y2="210" />
                                    <line x1="450" y1="50" x2="290" y2="210" />
                                    <line x1="450" y1="450" x2="290" y2="290" />
                                    <line x1="50" y1="450" x2="210" y2="290" />
                                </g>

                                {/* Adjacency Visual for Hover (Optional Logic) */}
                                {selectedJunction !== null && getNeighbors(selectedJunction).map(n => (
                                     board[n] === null && (
                                         <circle key={`hint-${n}`} cx={JUNCTIONS[n].x} cy={JUNCTIONS[n].y} r="8" fill="rgba(250, 204, 21, 0.4)" stroke="#FACC15" strokeDasharray="4" />
                                     )
                                ))}

                                {/* Junctions & Pieces */}
                                {JUNCTIONS.map(j => (
                                    <g key={j.id} style={{ cursor: 'pointer' }} onClick={() => performAction(j.id)}>
                                        {/* Interaction Area (Larger for Mobile) */}
                                        <circle cx={j.x} cy={j.y} r="35" fill="transparent" />
                                        
                                        {/* Dot */}
                                        <circle 
                                            cx={j.x} cy={j.y} r="10" 
                                            fill={board[j.id] ? 'none' : '#000'} 
                                            stroke="#000" strokeWidth="2"
                                            className="transition-all"
                                        />

                                        {/* Cow Piece */}
                                        <AnimatePresence>
                                            {board[j.id] && (
                                                <motion.g
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ 
                                                        scale: selectedJunction === j.id ? 1.2 : 1, 
                                                        rotate: 0,
                                                        y: selectedJunction === j.id ? -10 : 0
                                                    }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: 'spring', bounce: 0.5 }}
                                                >
                                                    {(() => {
                                                        const p = board[j.id] === 1 ? currentTheme.p1 : currentTheme.p2;
                                                        if (p.type === 'emoji') {
                                                            return (
                                                                <>
                                                                    <circle cx={j.x} cy={j.y} r="18" fill={p.color} stroke={currentTheme.lineColor} strokeWidth="3" className="shadow-action-sm" />
                                                                    <text x={j.x} y={j.y + 5} fontSize="14" textAnchor="middle" fill="#000" style={{ pointerEvents: 'none', fontWeight: 'bold' }}>
                                                                        {p.value}
                                                                    </text>
                                                                </>
                                                            );
                                                        }
                                                        if (p.value === 'stone') {
                                                            return (
                                                                <path 
                                                                    d={`M ${j.x-15} ${j.y-5} q 15 -15 30 0 q 5 15 -15 20 q -20 -5 -15 -20`}
                                                                    fill={p.color} stroke={currentTheme.lineColor} strokeWidth="3"
                                                                />
                                                            );
                                                        }
                                                        if (p.value === 'gem') {
                                                            return (
                                                                <polygon 
                                                                    points={`${j.x},${j.y-18} ${j.x+18},${j.y} ${j.x},${j.y+18} ${j.x-18},${j.y}`}
                                                                    fill={p.color} stroke={currentTheme.lineColor} strokeWidth="3" fillOpacity="0.8"
                                                                />
                                                            );
                                                        }
                                                        return (
                                                            <circle cx={j.x} cy={j.y} r="18" fill={p.color} stroke={currentTheme.lineColor} strokeWidth="3" className="shadow-action-sm" />
                                                        );
                                                    })()}
                                                    
                                                    {/* Selection indicator */}
                                                    {selectedJunction === j.id && (
                                                        <circle cx={j.x} cy={j.y} r="22" fill="none" stroke={board[j.id] === 1 ? '#FACC15' : '#38bdf8'} strokeWidth="4" className="animate__animated animate__pulse animate__infinite" />
                                                    )}
                                                </motion.g>
                                            )}
                                        </AnimatePresence>
                                    </g>
                                ))}
                            </svg>
                            
                            {/* Shoot Overlay */}
                            {shootMode && (
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '4px solid #ef4444' }}>
                                    <div className="bg-danger text-white px-3 py-1 fw-black rounded shadow-action uppercase animate__animated animate__fadeInDown">
                                        CAPTURE A COW!
                                    </div>
                                </div>
                            )}

                            {/* Processing AI overlay */}
                            {aiProcessing && (
                                <div className="position-absolute bottom-0 end-0 p-3">
                                    <div className="spinner-border spinner-border-sm text-dark" role="status"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PLAYER 2 / AI INFO - Side-by-side on mobile */}
                    <div className="col-6 col-lg-3 order-2 order-lg-1 d-flex flex-column">
                         <div className={`brutalist-card p-2 p-md-3 mb-3 transition-all h-100 ${turn === 2 ? 'border-primary shadow-action-sm' : 'opacity-75'}`} style={{ borderWidth: turn === 2 ? '4px' : '2px', borderColor: '#1e293b' }}>
                            <div className="d-flex align-items-center gap-2 mb-1 mb-md-2">
                                <div className="p-1 p-md-2 bg-secondary bg-opacity-10 rounded-circle border border-2 border-dark d-none d-md-inline-block">
                                    {isVsAI ? <Monitor size={16} className="text-dark" strokeWidth={3} /> : <User size={16} className="text-dark" strokeWidth={3} />}
                                </div>
                                <h5 className="fw-black mb-0 text-dark" style={{ fontSize: '0.85rem' }}>{isVsAI ? 'CPU' : 'P2'}</h5>
                            </div>

                            <div className="d-flex flex-column fw-bold text-dark uppercase gap-0" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                <span>Cows: <span>{getCowsOnBoard(2)}</span></span>
                                <span>Stock: <span>{placingCount[2]}</span></span>
                            </div>

                            <div className="d-none d-md-block progress mt-2" style={{ height: '6px' }}>
                                <div className="progress-bar bg-dark" style={{ width: `${(getCowsOnBoard(2) / COWS_PER_PLAYER) * 100}%` }}></div>
                            </div>

                            <div className="mt-auto pt-2">
                                {turn === 2 && !shootMode && <span className="badge bg-dark text-white fw-black smallest animate__animated animate__flash animate__infinite px-1">{isVsAI ? 'THINK' : 'TURN'}</span>}
                                {turn === 2 && shootMode && <span className="badge bg-danger text-white fw-black smallest animate__animated animate__pulse animate__infinite px-1">SHOOT</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* QUICK TIPS - Hidden on very small screens or made into a footer */}
                <div className="d-none d-md-block mt-4">
                    <div className="brutalist-card p-3 bg-light smallest shadow-action-sm">
                        <h6 className="fw-black uppercase mb-2">QUICK TIPS</h6>
                        <ul className="ps-3 mb-0 fw-bold text-muted d-flex gap-4 list-unstyled">
                            <li><strong>Placing:</strong> Block your opponent early!</li>
                            <li><strong>Moving:</strong> Keep mills flexible.</li>
                            <li><strong>Flying:</strong> Move anywhere with 3 cows.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <style>{`
                .pointer-events-none { pointer-events: none; }
                .ls-1 { letter-spacing: 1px; }
                svg circle { transition: r 0.2s, fill 0.2s; }
                svg g:hover circle[r="10"] { r: 12; fill: #FACC15; }
                
                @media (max-width: 768px) {
                    .container { padding-left: 8px; padding-right: 8px; }
                    .ls-tight { letter-spacing: -1px; }
                }
            `}</style>
        </div>
    );
};

export default Morabaraba;
