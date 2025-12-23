import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

const Lobby: React.FC = () => {
    const [challenges, setChallenges] = useState<any[]>([]);
    const navigate = useNavigate();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "challenges"),
            where("players", "array-contains", user.uid),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setChallenges(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [user]);

    return (
        <div className="container py-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold mb-0">Ṱatanyisani Lobby</h2>
                        <p className="mb-0 opacity-75">Challenge friends to a Venda duel</p>
                    </div>
                    <button onClick={() => navigate('/create-challenge')} className="btn btn-light rounded-pill px-4 fw-bold">
                        + New Challenge
                    </button>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <h5 className="fw-bold mb-3">Zwifhinga zwa tshiṱatanyisi (Your Matches)</h5>
                    {challenges.map(c => (
                        <div key={c.id} className="card border-0 shadow-sm rounded-4 mb-3 p-3 transition-all hover-shadow">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <div className="bg-light rounded-circle p-3 me-3">⚔️</div>
                                    <div>
                                        <div className="badge bg-warning text-dark mb-1">{c.status.toUpperCase()}</div>
                                        <h6 className="fw-bold mb-0">Match against {c.creatorName}</h6>
                                        <small className="text-muted">ID: {c.id.slice(0, 8)}</small>
                                    </div>
                                </div>
                                <Link to={`/duel/${c.id}`} className="btn btn-primary rounded-pill px-4">Enter</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Lobby;