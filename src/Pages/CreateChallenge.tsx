import React, { useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CreateChallenge: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState('');
    const navigate = useNavigate();

    const handleCreate = async () => {
        const user = auth.currentUser;
        if (!user) {
            Swal.fire('Login Required', 'Kha vha dzhene u itela u thoma tshiṱatanyisi.', 'error');
            return;
        }

        setLoading(true);
        try {
            // 1. Check if user has enough LP
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const currentLP = userSnap.data()?.points || 0;

            if (currentLP < 20) {
                Swal.fire('Insufficient LP', 'You need 20 LP to start a duel. Play lessons to earn more!', 'warning');
                setLoading(false);
                return;
            }

            // 2. Deduct 20 LP upfront
            await updateDoc(userRef, { points: increment(-20) });

            // 3. Create the Challenge document
            const docRef = await addDoc(collection(db, "challenges"), {
                creatorId: user.uid,
                players: [user.uid],
                scores: { [user.uid]: 0 },
                names: { [user.uid]: user.displayName || user.email?.split('@')[0] || "Player 1" },
                status: 'pending',
                pot: 20, // Initial stake
                createdAt: serverTimestamp()
            });

            const duelUrl = `${window.location.origin}/duel/${docRef.id}`;
            setLink(duelUrl);

            Swal.fire('Duel Created!', '20 LP has been staked. Share the link!', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Something went wrong.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="card border-0 shadow-lg rounded-5 p-5 text-center mx-auto" style={{ maxWidth: '500px' }}>
                <div className="display-4 mb-3">⚔️</div>
                <h2 className="fw-bold">New Ṱatanyisani</h2>
                <p className="text-muted">Stake 20 LP. Winner takes all (40 LP)!</p>

                {!link ? (
                    <button onClick={handleCreate} disabled={loading} className="btn btn-primary btn-lg rounded-pill w-100 py-3 shadow">
                        {loading ? 'Processing LP...' : 'Create & Stake 20 LP'}
                    </button>
                ) : (
                    <div className="animate__animated animate__fadeIn">
                        <div className="bg-light p-3 rounded-4 mb-3 border">
                            <code className="text-primary small">{link}</code>
                        </div>
                        <button onClick={() => {
                            navigator.clipboard.writeText(link);
                            Swal.fire({title:'Copied!', icon:'success', timer:800, showConfirmButton:false});
                        }} className="btn btn-dark rounded-pill px-4 me-2">Copy Link</button>
                        <button onClick={() => navigate(`/duel/${link.split('/').pop()}`)} className="btn btn-primary rounded-pill px-4">Enter Room</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateChallenge;