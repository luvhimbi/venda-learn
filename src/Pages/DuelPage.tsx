import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { doc, onSnapshot, updateDoc, increment, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

const DuelPage: React.FC = () => {
    const { challengeId } = useParams();
    const navigate = useNavigate();

    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [authLoading, setAuthLoading] = useState(true);

    // Refs to manage game state outside of the render cycle
    const hasEnded = useRef(false);
    const joinTriggered = useRef(false);
    const gameRef = useRef<any>(null);

    // 1. Auth Sync
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) {
                localStorage.setItem('redirectUrl', window.location.pathname);
                navigate('/login');
            } else { setUser(u); }
            setAuthLoading(false);
        });
        return () => unsub();
    }, [navigate]);

    // 2. Real-Time WebSocket Listener
    useEffect(() => {
        if (authLoading || !user || !challengeId) return;

        const unsubSnap = onSnapshot(doc(db, "challenges", challengeId), async (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            gameRef.current = data; // Keep ref updated for the endMatch logic
            setGame(data);

            // Handle Game Over from the other side
            if (data.status === 'completed' && !hasEnded.current) {
                hasEnded.current = true;
                navigate('/lobby');
            }

            // Join Logic
            if (data.status === 'pending' && !data.players.includes(user.uid) && !joinTriggered.current) {
                joinTriggered.current = true;
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if ((userSnap.data()?.points || 0) < 20) {
                    Swal.fire('No LP', '20 LP required', 'error');
                    navigate('/lobby');
                    return;
                }
                await updateDoc(userRef, { points: increment(-20) });
                await updateDoc(doc(db, "challenges", challengeId), {
                    players: arrayUnion(user.uid),
                    [`scores.${user.uid}`]: 0,
                    [`names.${user.uid}`]: user.displayName || "Warrior",
                    status: 'active',
                    pot: increment(20),
                    startTime: serverTimestamp()
                });
            }
        });
        return () => unsubSnap();
    }, [challengeId, user, authLoading]);

    // 3. Fixed Timer Logic
    useEffect(() => {
        if (game?.status === 'active' && game?.startTime?.toDate) {
            const timer = setInterval(() => {
                const start = game.startTime.toDate().getTime();
                const now = Date.now();
                const diff = Math.floor((now - start) / 1000);

                // Allow a small negative diff for server lag, but cap it at 0
                const safeElapsed = diff < 0 ? 0 : diff;
                const remaining = 60 - safeElapsed;

                if (remaining <= 0) {
                    setTimeLeft(0);
                    clearInterval(timer);
                    if (!hasEnded.current) endMatch();
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [game?.status, game?.startTime]);

    const endMatch = async () => {
        if (hasEnded.current) return;
        hasEnded.current = true;

        const finalData = gameRef.current;
        if (!finalData) return;

        const opponentId = finalData.players.find((id: string) => id !== user.uid);
        const myScore = finalData.scores[user.uid] || 0;
        const oppScore = opponentId ? (finalData.scores[opponentId] || 0) : 0;

        // Final UI feedback before redirect
        if (myScore > oppScore) {
            await updateDoc(doc(db, "users", user.uid), { points: increment(finalData.pot) });
            Swal.fire('Victory!', `You won ${finalData.pot} LP!`, 'success');
        } else if (myScore < oppScore) {
            Swal.fire('Defeat', `You lost the stake.`, 'error');
        } else {
            await updateDoc(doc(db, "users", user.uid), { points: increment(20) });
            Swal.fire('Draw', 'LP returned.', 'info');
        }

        await updateDoc(doc(db, "challenges", challengeId!), { status: 'completed' });
        navigate('/lobby');
    };

    const handleScore = async () => {
        // Only block if timeLeft is strictly 0.
        // If it's 60 but game is active, allow scoring.
        if (game?.status !== 'active' || hasEnded.current) return;

        try {
            await updateDoc(doc(db, "challenges", challengeId!), {
                [`scores.${user.uid}`]: increment(10)
            });
        } catch (e) {
            console.error("Score update failed", e);
        }
    };

    if (authLoading || !game || !user) return <div className="p-5 text-center">Loading Arena...</div>;

    const opponentId = game.players.find((id: string) => id !== user.uid);

    return (
        <div className="container py-4">
            {/* Real-time Scoreboard */}
            <div className="card bg-dark text-white rounded-4 p-4 mb-4 shadow-lg border-0">
                <div className="row align-items-center text-center">
                    <div className="col">
                        <small className="text-primary fw-bold">YOU</small>
                        <h2 className="display-4 fw-bold">{game.scores[user.uid] || 0}</h2>
                    </div>
                    <div className="col border-start border-end border-secondary">
                        <div className={`display-5 fw-bold ${timeLeft < 10 ? 'text-danger' : 'text-warning'}`}>
                            {game.status === 'active' ? `${timeLeft}s` : 'READY'}
                        </div>
                        <small className="opacity-50">STAKE: 20 LP</small>
                    </div>
                    <div className="col">
                        <small className="text-danger fw-bold">OPPONENT</small>
                        <h2 className="display-4 fw-bold">{opponentId ? (game.scores[opponentId] || 0) : '--'}</h2>
                    </div>
                </div>
            </div>

            {game.status === 'active' ? (
                <div className="card p-5 border-0 shadow-lg rounded-5 text-center">
                    <span className="badge bg-light text-primary mb-3 align-self-center">VENDA TO ENGLISH</span>
                    <h1 className="display-1 fw-bold mb-5">Vhuswa</h1>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <button onClick={handleScore} className="btn btn-primary btn-lg w-100 py-4 rounded-4 shadow fw-bold">
                                Porridge
                            </button>
                        </div>
                        <div className="col-md-6">
                            <button className="btn btn-outline-secondary btn-lg w-100 py-4 rounded-4 fw-bold">
                                Bread
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card p-5 border-0 shadow-sm rounded-5 text-center">
                    <div className="spinner-border text-primary mb-3"></div>
                    <h3>Waiting for Challenger...</h3>
                    <p className="text-muted mb-0">The game starts as soon as your friend clicks the link.</p>
                </div>
            )}
        </div>
    );
};

export default DuelPage;