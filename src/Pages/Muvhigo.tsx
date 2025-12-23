import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';

interface Player {
    id: string;
    username: string;
    points: number; // Changed from string to number
    level: string;
}

const Leaderboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // 1. Efficient Query: Let Firestore handle the sorting if possible
                const q = query(collection(db, "users"));
                const querySnapshot = await getDocs(q);

                const playersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        username: data.username || "Anonymous",
                        level: data.level || "1",
                        // 2. CRITICAL FIX: Ensure points are treated as numbers
                        // Number() is safer than parseInt() for clean math
                        points: Number(data.points) || 0
                    };
                }) as Player[];

                // 3. Mathematical Sort (Highest to Lowest)
                const sortedPlayers = playersData.sort((a, b) => b.points - a.points);

                setPlayers(sortedPlayers.slice(0, 10));
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="text-center mb-5">
                        <h1 className="fw-bold">Muvhigo</h1>
                        <p className="text-muted">Top Venda Learn Warriors</p>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className="bg-primary p-4 text-white text-center">
                            <h4 className="mb-0 fw-bold">Hall of Fame</h4>
                        </div>

                        <div className="list-group list-group-flush">
                            {players.map((player, index) => {
                                const isMe = player.id === auth.currentUser?.uid;
                                const rank = index + 1;

                                return (
                                    <div
                                        key={player.id}
                                        className={`list-group-item p-4 d-flex align-items-center transition-all ${isMe ? 'bg-primary bg-opacity-10 border-start border-primary border-4' : ''}`}
                                    >
                                        <div className="me-4 text-center" style={{ width: '40px' }}>
                                            {rank === 1 ? <span className="fs-3">🥇</span> :
                                                rank === 2 ? <span className="fs-3">🥈</span> :
                                                    rank === 3 ? <span className="fs-3">🥉</span> :
                                                        <span className="fw-bold text-muted h5">{rank}</span>}
                                        </div>

                                        <div
                                            className="rounded-circle bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm"
                                            style={{ width: '45px', height: '45px' }}
                                        >
                                            {player.username?.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-grow-1">
                                            <h6 className="mb-0 fw-bold">
                                                {player.username} {isMe && <span className="badge bg-primary ms-2 small">Inwi</span>}
                                            </h6>
                                            <small className="text-muted">Level {player.level}</small>
                                        </div>

                                        <div className="text-end">
                                            {/* Displaying the numeric point value */}
                                            <div className="fw-bold text-primary">{player.points} LP</div>
                                            <small className="text-muted extra-small">Learning Points</small>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;