import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { seedLessons } from "../services/seedDatabase.ts";
import Swal from 'sweetalert2';

interface UserProfile {
    username: string;
    email: string;
    points: number; // Changed to number for easier math
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

    // Referral Link
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
                } else {
                    const initialData: UserProfile = {
                        username: 'New Learner',
                        email: user.email || '',
                        points: 0,
                        level: 1,
                        streak: 0,
                        completedLessons: []
                    };
                    setUserData(initialData);
                    setEditUsername('New Learner');
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
            text: 'Invite link copied to clipboard. Send it to your friends!',
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

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-5 animate__animated animate__fadeIn">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">

                    {/* USER CARD */}
                    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
                        <div className="text-center mb-4">
                            <div className="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow-lg"
                                 style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                {userData?.username?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <h2 className="fw-bold mb-0">{userData?.username}</h2>
                            <p className="text-muted small">{auth.currentUser?.email}</p>
                        </div>

                        {!isEditing ? (
                            <div className="text-center">
                                <div className="row bg-light rounded-4 p-3 mb-4 g-0 border">
                                    <div className="col-4 border-end">
                                        <h5 className="mb-0 fw-bold text-primary">{userData?.points}</h5>
                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '10px'}}>Points</small>
                                    </div>
                                    <div className="col-4 border-end">
                                        <h5 className="mb-0 fw-bold text-success">{userData?.level}</h5>
                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '10px'}}>Level</small>
                                    </div>
                                    <div className="col-4">
                                        <h5 className="mb-0 fw-bold text-warning">{userData?.streak}</h5>
                                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '10px'}}>Streak</small>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm">
                                    Edit Profile
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate}>
                                <div className="mb-3 text-start">
                                    <label className="form-label small fw-bold text-uppercase text-muted">Username (Dzina)</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg fs-6 border-0 bg-light"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-success flex-grow-1 fw-bold rounded-pill" disabled={updateLoading}>
                                        {updateLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light fw-bold rounded-pill">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* INVITE SECTION */}
                    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-center border-top border-primary border-5">
                        <div className="mb-3">
                            <span className="display-6">🎁</span>
                        </div>
                        <h5 className="fw-bold">Invite & Earn 500 LP</h5>
                        <p className="text-muted small px-3">
                            Ramba vhangana vhavho! Share your link and get 500 points when they join Venda Learn.
                        </p>

                        <div className="input-group mb-3 bg-light rounded-pill p-1 border">
                            <input
                                type="text"
                                className="form-control bg-transparent border-0 small px-3"
                                value={inviteLink}
                                readOnly
                            />
                            <button className="btn btn-primary rounded-pill px-4 fw-bold" onClick={handleCopyLink}>
                                Copy
                            </button>
                        </div>

                        <small className="text-primary fw-bold">#KhaRiGudeVenda</small>
                    </div>

                    {/* ADMIN TOOLS */}
                    <div className="mt-4 text-center">
                        <button onClick={seedLessons} className="btn btn-link text-muted smallest text-decoration-none">
                            <i className="bi bi-gear-fill me-1"></i> Admin: Seed Lessons
                        </button>
                    </div>

                </div>
            </div>

            <style>{`
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};

export default Profile;