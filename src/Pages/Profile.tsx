import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { seedLessons } from "../services/seedDatabase.ts";
import Swal from 'sweetalert2';

interface UserProfile {
    username: string;
    email: string;
    points: number;
    level: number;
    streak: number;
    completedLessons: string[];
}

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editUsername, setEditUsername] = useState('');

    const inviteLink = `${window.location.origin}/register?ref=${auth.currentUser?.uid}`;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    setUserData({
                        ...data,
                        points: Number(data.points) || 0,
                        level: Number(data.level) || 1,
                        streak: Number(data.streak) || 0
                    });
                    setEditUsername(data.username || '');
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        Swal.fire({
            title: 'Khopi!',
            text: 'Invite link copied to clipboard.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-4' }
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setUpdateLoading(true);
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                username: editUsername,
                email: auth.currentUser.email
            }, { merge: true });

            setUserData(prev => prev ? { ...prev, username: editUsername } : null);
            setIsEditing(false);
            Swal.fire('Success', 'Phurofayili yo vusuluswa!', 'success');
        } catch (error) {
            Swal.fire('Error', 'Update failed', 'error');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '700px' }}>

                {/* HEADER */}
                <header className="text-center mb-5 pb-5 border-bottom">
                    <div className="text-dark rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                         style={{ width: '120px', height: '120px', fontSize: '3rem', backgroundColor: '#FACC15', border: '4px solid #111827' }}>
                        {userData?.username?.charAt(0).toUpperCase() || 'V'}
                    </div>
                    <h1 className="fw-bold mb-1 ls-tight">{userData?.username}</h1>
                    <p className="smallest fw-bold text-muted text-uppercase ls-2">{userData?.email}</p>
                </header>

                {/* STATS STRIP */}
                <section className="row text-center mb-5 g-0">
                    <div className="col-4 border-end">
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Total LP</p>
                        <h3 className="fw-bold mb-0">{userData?.points}</h3>
                    </div>
                    <div className="col-4 border-end">
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Level</p>
                        <h3 className="fw-bold mb-0" style={{ color: '#FACC15' }}>{userData?.level}</h3>
                    </div>
                    <div className="col-4">
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Streak</p>
                        <h3 className="fw-bold mb-0">{userData?.streak} 🔥</h3>
                    </div>
                </section>

                {/* PROFILE EDITING */}
                <section className="mb-5 pb-5 border-bottom">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="btn btn-outline-dark border-2 w-100 py-3 fw-bold ls-1 rounded-3">
                            EDIT PROFILE
                        </button>
                    ) : (
                        <form onSubmit={handleUpdate} className="animate__animated animate__fadeIn">
                            <div className="mb-4">
                                <label className="smallest fw-bold text-muted text-uppercase ls-2 mb-2">Dzina (Username)</label>
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light py-3 px-4 rounded-3 fw-bold"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn game-btn-primary flex-grow-1 py-3 fw-bold ls-1" disabled={updateLoading}>
                                    {updateLoading ? 'SAVING...' : 'SAVE CHANGES'}
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light px-4 py-3 fw-bold ls-1">
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* REFERRAL / INVITE SECTION */}
                <section className="bg-dark text-white p-5 rounded-4 position-relative overflow-hidden shadow-lg">
                    <div className="position-relative z-1">
                        <p className="smallest fw-bold ls-2 text-uppercase mb-2" style={{ color: '#FACC15' }}>Vhuimo ha Thonifho</p>
                        <h2 className="fw-bold mb-3">Invite & Earn 500 LP</h2>
                        <p className="small opacity-75 mb-4 pe-lg-5">
                            Ramba vhangana vhavho! Spread the language. You'll receive 500 Learning Points for every warrior who joins through your link.
                        </p>

                        <div className="d-flex flex-column flex-md-row gap-2">
                            <div className="flex-grow-1 bg-white bg-opacity-10 rounded-3 p-3 small text-truncate border border-secondary border-opacity-25">
                                {inviteLink}
                            </div>
                            <button className="btn game-btn-primary px-4 py-2 fw-bold ls-1" onClick={handleCopyLink}>
                                COPY LINK
                            </button>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="position-absolute top-0 end-0 opacity-10 display-1 p-4">🐘</div>
                </section>

                {/* ADMIN TOOLS */}
                <footer className="mt-5 pt-5 text-center">
                    <button onClick={seedLessons} className="btn btn-link text-muted text-decoration-none smallest fw-bold ls-2 opacity-50">
                        <i className="bi bi-shield-lock me-2"></i> ADMIN: SEED DATABASE
                    </button>
                </footer>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default Profile;