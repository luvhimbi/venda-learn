import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Trophy, User, Monitor, RotateCcw, Info, Star } from 'lucide-react';
import { doc, updateDoc, increment, type Firestore } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import GameResultModal from '../../components/GameResultModal';
import { fetchUserData, awardPoints } from '../../services/dataCache';
import { useVisualJuice } from '../../hooks/useVisualJuice';
import GameIntroModal, { resetIntroSeen } from '../../components/GameIntroModal';
import ExitConfirmModal from '../../components/ExitConfirmModal';

// --- CONSTANTS ---
const STONES_PER_HOLE = 4;
const XP_REWARD = 15;

type Player = 1 | 2; // 1 = User (Bottom), 2 = AI (Top)

const MORUBA_INTRO_STEPS = [
    {
        icon: <Info size={28} strokeWidth={3} />,
        title: 'The Board',
        description: 'Moruba is played on 4 rows. You control the bottom two rows. Each hole starts with 4 stones.'
    },
    {
        icon: <RotateCcw size={28} strokeWidth={3} />,
        title: 'Sowing Stones',
        description: 'Pick stones from a hole and sow them anti-clockwise. If your last stone lands in a non-empty hole, you pick them all up and keep going!'
    },
    {
        icon: <Star size={28} strokeWidth={3} />,
        title: 'Capture!',
        description: 'If your last stone lands in an empty INNER hole, you capture all stones from the opponent\'s opposite holes!'
    }
];

const Moruba: React.FC = () => {
    const navigate = useNavigate();
    const { playCorrect, playClick, playWin, playLose, triggerHaptic } = useVisualJuice();

    // Game State
    // P1 (Bottom): Inner (Index 0-7), Outer (Index 8-15)
    // P2 (Top): Inner (Index 0-7), Outer (Index 8-15)
    const [p1Board, setP1Board] = useState<number[]>(new Array(16).fill(STONES_PER_HOLE));
    const [p2Board, setP2Board] = useState<number[]>(new Array(16).fill(STONES_PER_HOLE));
    const [turn, setTurn] = useState<Player>(1);
    const [gameOver, setGameOver] = useState<Player | 'draw' | null>(null);
    const [isVsAI] = useState(true);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [isSowing, setIsSowing] = useState(false);

    // UI State
    const [showIntro, setShowIntro] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState({ isSuccess: false, title: '', message: '', points: 0 });
    const [userPoints, setUserPoints] = useState(0);

    useEffect(() => {
        fetchUserData().then(data => {
            if (data) setUserPoints(data.points || 0);
        });
    }, []);

    // Get capture indices
    // If P1 lands in P1-Inner [i], they capture P2-Inner [i] and P2-Outer [i]
    // Note: Board alignment:
    // P2 Outer: 15 14 13 12 11 10 9 8
    // P2 Inner: 0  1  2  3  4  5  6  7
    // --------------------------------
    // P1 Inner: 0  1  2  3  4  5  6  7
    // P1 Outer: 15 14 13 12 11 10 9 8

    // Helper for anti-clockwise loop within 16 holes
    // Loop: 0->1->2->3->4->5->6->7 (Inner) -> 15 (Outer Right) -> 14 -> 13 -> 12 -> 11 -> 10 -> 9 -> 8 -> 0.
    const getNextIndex = (idx: number) => {
        if (idx < 7) return idx + 1;
        if (idx === 7) return 15;
        if (idx > 8) return idx - 1;
        if (idx === 8) return 0;
        return 0;
    };

    const checkWin = useCallback((p1: number[], p2: number[]) => {
        const p1Total = p1.reduce((a, b) => a + b, 0);
        const p2Total = p2.reduce((a, b) => a + b, 0);
        
        if (p1Total === 0) return 2;
        if (p2Total === 0) return 1;
        
        return null;
    }, []);

    // --- AI BRAIN (Advanced Minimax) ---

    // Pure functional simulation of a move
    const simulateSowing = useCallback((player: Player, startIndex: number, p1: number[], p2: number[]) => {
        let currentBoard = player === 1 ? [...p1] : [...p2];
        let opponentBoard = player === 1 ? [...p2] : [...p1];
        
        let stones = currentBoard[startIndex];
        if (stones <= 1 && currentBoard.some(s => s > 1)) return null; // Avoid illegal move if others available
        
        currentBoard[startIndex] = 0;
        let idx = startIndex;

        while (stones > 0) {
            idx = getNextIndex(idx);
            currentBoard[idx]++;
            stones--;

            if (stones === 0) {
                if (currentBoard[idx] > 1) {
                    stones = currentBoard[idx];
                    currentBoard[idx] = 0;
                } else {
                    // Capture logic
                    if (idx <= 7) {
                        const oppInner = idx;
                        const oppOuter = 15 - idx;
                        if (opponentBoard[oppInner] > 0) {
                            opponentBoard[oppInner] = 0;
                            opponentBoard[oppOuter] = 0;
                        }
                    }
                    break;
                }
            }
        }
        return {
            p1: player === 1 ? currentBoard : opponentBoard,
            p2: player === 2 ? currentBoard : opponentBoard
        };
    }, []);

    const evaluateBoard = useCallback((p1: number[], p2: number[]) => {
        const p1Total = p1.reduce((a, b) => a + b, 0);
        const p2Total = p2.reduce((a, b) => a + b, 0);
        
        // Base score: stone difference
        let score = (p2Total - p1Total) * 10;
        
        // Bonus for having stones in inner row (harder to capture)
        const p2Inner = p2.slice(0, 8).reduce((a, b) => a + b, 0);
        const p1Inner = p1.slice(0, 8).reduce((a, b) => a + b, 0);
        score += (p2Inner * 2);
        score -= (p1Inner * 2);
        

        return score;
    }, []);

    const minimax = useCallback((p1: number[], p2: number[], depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
        const win = checkWin(p1, p2);
        if (win === 2) return 1000 + depth;
        if (win === 1) return -1000 - depth;
        if (depth === 0) return evaluateBoard(p1, p2);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 16; i++) {
                if (p2[i] > 0) {
                    const result = simulateSowing(2, i, p1, p2);
                    if (!result) continue;
                    const evaluation = minimax(result.p1, result.p2, depth - 1, alpha, beta, false);
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 16; i++) {
                if (p1[i] > 0) {
                    const result = simulateSowing(1, i, p1, p2);
                    if (!result) continue;
                    const evaluation = minimax(result.p1, result.p2, depth - 1, alpha, beta, true);
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }, [checkWin, evaluateBoard, simulateSowing]);

    const handleWinner = async (winner: Player) => {
        setGameOver(winner);
        if (winner === 1 && auth.currentUser) {
            // Using centralized awardPoints to ensure weekly leaderboard sync
            await awardPoints(XP_REWARD);

            const userRef = doc(db as Firestore, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                morubaWins: increment(1)
            });
            playWin();
        } else {
            playLose();
        }
        
        setResultData({
            isSuccess: winner === 1,
            title: winner === 1 ? 'Ndi hone! (Victory)' : 'Ndi yone! (Defeat)',
            message: winner === 1 ? 'You are a Moruba Grandmaster!' : 'The CPU outplayed you. Keep practicing your strategy!',
            points: winner === 1 ? XP_REWARD : 0
        });
        setShowResult(true);
    };

    const performMove = useCallback(async (player: Player, startIndex: number) => {
        if (gameOver || isSowing || (player !== turn)) return;

        let currentBoard = player === 1 ? [...p1Board] : [...p2Board];
        let opponentBoard = player === 1 ? [...p2Board] : [...p1Board];
        
        if (currentBoard[startIndex] <= 1) {
            // Usually need at least 2 stones to start in Moruba unless it's the last move possible
            // But let's allow 1+ if it's the only choice. 
            if (currentBoard[startIndex] === 0) return;
        }

        playClick();
        
        let stonesInHand = currentBoard[startIndex];
        currentBoard[startIndex] = 0;
        let currentIndex = startIndex;
        setIsSowing(true);

        // Visual "sowing" simulation - for now synchronous logic with state updates
        const sow = async () => {
            while (stonesInHand > 0) {
                currentIndex = getNextIndex(currentIndex);
                currentBoard[currentIndex]++;
                stonesInHand--;
                
                // If last stone
                if (stonesInHand === 0) {
                    // Check if current hole was empty before
                    if (currentBoard[currentIndex] > 1) {
                        // Relay sowing: pick up all stones and continue
                        stonesInHand = currentBoard[currentIndex];
                        currentBoard[currentIndex] = 0;
                        triggerHaptic('light');
                    } else {
                        // Turn ends. Check for capture.
                        // Capture happens if:
                        // 1. Landing in inner row (0-7)
                        // 2. Was previously empty (now has 1)
                        // 3. Opponent has stones in opposite inner hole
                        if (currentIndex <= 7) {
                            const oppInner = currentIndex;
                            const oppOuter = 15 - currentIndex; // Mirror outer index

                            if (opponentBoard[oppInner] > 0) {
                                let captured = opponentBoard[oppInner] + opponentBoard[oppOuter];
                                opponentBoard[oppInner] = 0;
                                opponentBoard[oppOuter] = 0;
                                
                                if (captured > 0) {
                                    playCorrect();
                                    triggerHaptic('heavy');
                                    // In Moruba, captured stones are often removed from play
                                    // We'll just set them to 0 and they count towards winning
                                }
                            }
                        }
                        break;
                    }
                }
                // Optional: add a small delay here for animation if we use a recursive state update
            }

            // Sync boards back
            if (player === 1) {
                setP1Board(currentBoard);
                setP2Board(opponentBoard);
            } else {
                setP2Board(currentBoard);
                setP1Board(opponentBoard);
            }

            const winner = checkWin(player === 1 ? currentBoard : opponentBoard, player === 1 ? opponentBoard : currentBoard);
            if (winner) {
                handleWinner(winner as Player);
            } else {
                setTurn(player === 1 ? 2 : 1);
            }
        };

        await sow();
        setIsSowing(false);
    }, [p1Board, p2Board, turn, gameOver, isSowing, checkWin, playClick, playCorrect, triggerHaptic, handleWinner]);

    // AI Logic Controller
    useEffect(() => {
        if (isVsAI && turn === 2 && !gameOver) {
            setAiProcessing(true);
            
            // Add thinking delay
            const thinkingTime = 1500 + Math.random() * 1000;
            
            const timer = setTimeout(() => {
                let bestMove = -1;
                let maxEval = -Infinity;
                
                // Shuffle moves to avoid predictable play on equal scores
                const possibleMoves = p2Board
                    .map((s, i) => s > 0 ? i : -1)
                    .filter(i => i !== -1)
                    .sort(() => Math.random() - 0.5);
                
                if (possibleMoves.length === 0) return;

                for (const move of possibleMoves) {
                    const res = simulateSowing(2, move, p1Board, p2Board);
                    if (!res) continue;
                    
                    const val = minimax(res.p1, res.p2, 3, -Infinity, Infinity, false);
                    if (val > maxEval) {
                        maxEval = val;
                        bestMove = move;
                    }
                }

                if (bestMove === -1) bestMove = possibleMoves[0];

                performMove(2, bestMove);
                setAiProcessing(false);
            }, thinkingTime);
            
            return () => clearTimeout(timer);
        }
    }, [turn, isVsAI, gameOver, p1Board, p2Board, minimax, simulateSowing, performMove]);

    const resetGame = () => {
        setP1Board(new Array(16).fill(STONES_PER_HOLE));
        setP2Board(new Array(16).fill(STONES_PER_HOLE));
        setTurn(1);
        setGameOver(null);
        setAiProcessing(false);
    };

    // UI Helpers
    const renderHoles = (player: Player, rowType: 'inner' | 'outer') => {
        const board = player === 1 ? p1Board : p2Board;
        let indices = [];
        if (rowType === 'inner') indices = [0, 1, 2, 3, 4, 5, 6, 7];
        else indices = [8, 9, 10, 11, 12, 13, 14, 15]; // Visual mapping: 8 is left, 15 is right? 
        // Let's adjust display order
        // P1 Outer: [15, 14, 13, 12, 11, 10, 9, 8]
        // P1 Inner: [0, 1, 2, 3, 4, 5, 6, 7]
        if (rowType === 'outer' && player === 1) indices = [8, 9, 10, 11, 12, 13, 14, 15].reverse();
        if (rowType === 'outer' && player === 2) indices = [8, 9, 10, 11, 12, 13, 14, 15];
        if (rowType === 'inner' && player === 2) indices = [0, 1, 2, 3, 4, 5, 6, 7].reverse();

        return indices.map(idx => (
           <div 
                key={`${player}-${idx}`} 
                className={`moruba-hole ${player === 1 && turn === 1 && board[idx] > 0 ? 'playable' : ''}`}
                onClick={() => player === 1 && performMove(1, idx)}
            >
                <div className="stone-count-badge">{board[idx]}</div>
                <div className="stones-container">
                    {Array.from({ length: Math.min(board[idx], 8) }).map((_, i) => (
                        <motion.div 
                            key={i} 
                            className="stone" 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }}
                            style={{ 
                                left: `${20 + (i % 3) * 15}%`, 
                                top: `${20 + Math.floor(i / 3) * 15}%`,
                                backgroundColor: i % 2 === 0 ? '#d1d5db' : '#9ca3af'
                            }}
                        />
                    ))}
                    {board[idx] > 8 && <div className="plus-indicator">+{board[idx] - 8}</div>}
                </div>
           </div>
        ));
    };

    return (
        <div className="moruba-game-container">
            {/* result modal */}
            <GameResultModal
                isOpen={showResult}
                isSuccess={resultData.isSuccess}
                title={resultData.title}
                message={resultData.message}
                points={resultData.points}
                primaryActionText="PLAY AGAIN"
                secondaryActionText="EXIT"
                onPrimaryAction={() => { setShowResult(false); resetGame(); }}
                onSecondaryAction={() => { setShowResult(false); navigate('/mitambo'); }}
            />

            {/* modals */}
            {showIntro && (
                <GameIntroModal
                    gameId="moruba"
                    gameTitle="MORUBA"
                    gameIcon={<Trophy size={28} strokeWidth={3} />}
                    steps={MORUBA_INTRO_STEPS}
                    accentColor="#FACC15"
                    onClose={() => setShowIntro(false)}
                />
            )}
            <ExitConfirmModal
                visible={showExitConfirm}
                onConfirmExit={() => navigate('/mitambo')}
                onCancel={() => setShowExitConfirm(false)}
            />

            <div className="container py-4" style={{ maxWidth: '900px' }}>
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-4 px-3 text-theme-main">
                    <button onClick={() => setShowExitConfirm(true)} className="btn-game bg-theme-surface text-theme-main border border-2 border-theme-main rounded-circle shadow-action-sm p-0 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="text-center">
                        <span className="smallest fw-black text-theme-muted uppercase ls-1 mb-0 d-block">Traditional Strategy</span>
                        <h1 className="fw-black mb-0 ls-tight" style={{ fontSize: '2rem' }}>MORUBA</h1>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <div className="brutalist-card--sm bg-warning px-3 py-1 fw-black d-flex align-items-center gap-2 smallest shadow-action-sm text-dark">
                            <Star size={14} fill="currentColor" /> {userPoints} XP
                        </div>
                        <button onClick={() => { resetIntroSeen('moruba'); setShowIntro(true); }} className="btn-game bg-theme-surface text-theme-main border border-2 border-theme-main rounded-circle shadow-action-sm p-0 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                            <HelpCircle size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* PLAYER INFO CARDS - TOP SIDE BY SIDE */}
                <div className="row g-3 mb-4">
                    <div className="col-6">
                        <div className={`brutalist-card bg-theme-surface p-2 p-md-3 transition-all h-100 ${turn === 1 ? 'border-theme-main shadow-action-sm' : 'opacity-75'}`} style={{ borderWidth: turn === 1 ? '4px' : '2px', borderColor: turn === 1 ? 'var(--venda-yellow)' : 'var(--color-border)' }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="p-1 p-md-2 bg-warning bg-opacity-10 rounded-circle border border-2 border-theme-main d-none d-sm-block">
                                    <User size={16} className="text-theme-main" strokeWidth={3} />
                                </div>
                                <h5 className="fw-black mb-0 text-theme-main" style={{ fontSize: '0.85rem' }}>YOU (P1)</h5>
                            </div>
                            <div className="d-flex flex-column gap-0 smallest fw-black text-theme-muted uppercase">
                                <span>Stones: <span className="text-theme-main">{p1Board.reduce((a,b)=>a+b, 0)}</span></span>
                                {turn === 1 && !isSowing && <span className="badge bg-warning text-dark p-1 mt-1 animate__animated animate__flash animate__infinite" style={{ fontSize: '9px' }}>YOUR TURN</span>}
                            </div>
                        </div>
                    </div>

                    <div className="col-6">
                        <div className={`brutalist-card bg-theme-surface p-2 p-md-3 transition-all h-100 ${turn === 2 ? 'border-theme-main shadow-action-sm' : 'opacity-75'}`} style={{ borderWidth: turn === 2 ? '4px' : '2px', borderColor: turn === 2 ? 'var(--color-text)' : 'var(--color-border)' }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="p-1 p-md-2 bg-secondary bg-opacity-10 rounded-circle border border-2 border-theme-main d-none d-sm-block">
                                    <Monitor size={16} className="text-theme-main" strokeWidth={3} />
                                </div>
                                <h5 className="fw-black mb-0 text-theme-main" style={{ fontSize: '0.85rem' }}>CPU (P2)</h5>
                            </div>
                            <div className="d-flex flex-column gap-0 smallest fw-black text-theme-muted uppercase">
                                <span>Stones: <span className="text-theme-main">{p2Board.reduce((a,b)=>a+b, 0)}</span></span>
                                {turn === 2 && <span className="badge bg-theme-main text-theme-base p-1 mt-1 animate__animated animate__pulse animate__infinite" style={{ fontSize: '9px' }}>{aiProcessing ? 'THINKING' : 'CPU TURN'}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOARD AREA */}
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="moruba-board-wrapper brutalist-card p-1 p-md-3 shadow-action">
                            <div className="moruba-board">
                                {/* P2 Rows */}
                                <div className="moruba-row p2-outer">{renderHoles(2, 'outer')}</div>
                                <div className="moruba-row p2-inner">{renderHoles(2, 'inner')}</div>
                                
                                <div className="board-divider"></div>
                                
                                {/* P1 Rows */}
                                <div className="moruba-row p1-inner">{renderHoles(1, 'inner')}</div>
                                <div className="moruba-row p1-outer">{renderHoles(1, 'outer')}</div>
                            </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                            <p className="fw-bold text-theme-muted small uppercase ls-1">
                                {turn === 1 ? 'Select a hole with stones to start sowing.' : 'Computer is playing...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .moruba-game-container {
                    min-height: 100vh;
                    background-color: var(--color-bg);
                    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.02' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E");
                }

                .moruba-board-wrapper {
                    background-color: #5d4037; /* Warm wood color */
                    background-image: 
                        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                    border: 8px solid #3e2723;
                    border-radius: 20px;
                }

                .moruba-board {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding: 10px;
                }

                .moruba-row {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 10px;
                }

                .moruba-hole {
                    aspect-ratio: 1;
                    background-color: #3e2723;
                    border-radius: 50%;
                    position: relative;
                    box-shadow: inset 0 10px 20px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.1);
                    cursor: default;
                    transition: transform 0.2s;
                }

                .moruba-hole.playable:hover {
                    transform: scale(1.05);
                    cursor: pointer;
                    box-shadow: inset 0 10px 20px rgba(0,0,0,0.5), 0 0 15px var(--venda-yellow);
                }

                .stone-count-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background-color: var(--venda-yellow);
                    color: black;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 900;
                    border: 2px solid black;
                    z-index: 5;
                }

                .stones-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    border-radius: 50%;
                }

                .stone {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.2);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                .plus-indicator {
                    position: absolute;
                    bottom: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    opacity: 0.7;
                }

                .board-divider {
                    height: 4px;
                    background-color: #3e2723;
                    border-radius: 2px;
                    margin: 5px 0;
                    opacity: 0.5;
                }

                @media (max-width: 768px) {
                    .moruba-row {
                        gap: 5px;
                    }
                    .stone {
                        width: 8px;
                        height: 8px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Moruba;
