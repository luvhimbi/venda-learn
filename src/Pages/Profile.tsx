import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {seedLessons} from "../services/seedDatabase.ts";

interface UserProfile {
    username: string;
    email: string;
    points: string;
    level: string;
    streak: string;
    completedLessons: string[];
}

const Profile: React.FC = () => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [editUsername, setEditUsername] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    setUserData(data);
                    setEditUsername(data.username || '');
                } else {
                    // Fallback using Auth data if Firestore doc is missing
                    const initialData: UserProfile = {
                        username: 'New Learner',
                        email: user.email || '',
                        points: "0",
                        level: "1",
                        streak: "0",
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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setUpdateLoading(true);
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                username: editUsername,
                email: auth.currentUser.email // Ensure email is always synced
            }, { merge: true });

            setUserData(prev => prev ? { ...prev, username: editUsername } : null);
            setIsEditing(false);
            alert("Phurofayili yo vusuluswa!");
        } catch (error) {
            console.error("Update error:", error);
            alert("Error updating profile.");
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                        <div className="text-center mb-4">
                            <div className="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow" style={{ width: '90px', height: '90px', fontSize: '2rem' }}>
                                {userData?.username?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <h3 className="fw-bold mb-0">{userData?.username}</h3>
                            <p className="text-muted">{auth.currentUser?.email}</p>
                        </div>
                        <button onClick={seedLessons} className="btn btn-warning btn-sm">
                            Seed Database (Admin Only)
                        </button>

                        {!isEditing ? (
                            <div className="text-center">
                                <div className="row bg-light rounded-3 p-3 mb-4 g-0">
                                    <div className="col-4 border-end">
                                        <h6 className="mb-0 fw-bold">{userData?.points || "0"}</h6>
                                        <small className="text-muted extra-small">Points</small>
                                    </div>
                                    <div className="col-4 border-end">
                                        <h6 className="mb-0 fw-bold">{userData?.level || "1"}</h6>
                                        <small className="text-muted extra-small">Level</small>
                                    </div>
                                    <div className="col-4">
                                        <h6 className="mb-0 fw-bold">{userData?.streak || "0"}</h6>
                                        <small className="text-muted extra-small">Streak</small>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary w-100 rounded-pill fw-bold py-2">
                                    Edit Profile
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Username (Dzina)</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg fs-6"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-success flex-grow-1 fw-bold" disabled={updateLoading}>
                                        {updateLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light fw-bold">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;