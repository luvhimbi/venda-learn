import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import Swal from 'sweetalert2';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUsername(docSnap.data().username || '');
                    }
                });
                return () => unsubDoc();
            } else {
                setUsername('');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        Swal.fire({
            title: 'Kha vha humbele pfarelo',
            text: "Are you sure you want to sign out?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Sign Out!',
            cancelButtonText: 'No, Stay',
            borderRadius: '15px'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                Swal.fire({
                    title: 'Done!',
                    text: 'You have been signed out.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                navigate('/login');
            }
        });
    };

    const getInitials = () => {
        if (username) return username.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'V';
    };

    return (
        <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom py-3 shadow-sm">
            <div className="container">
                <Link className="navbar-brand fw-bold text-dark d-flex align-items-center" to="/" style={{ letterSpacing: "-0.5px" }}>
                    <span className="text-primary me-1">KHA RI</span>GUDE
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#vendaNavbar">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="vendaNavbar">
                    <ul className="navbar-nav ms-auto gap-lg-2 align-items-center">
                        <li className="nav-item">
                            <Link className="nav-link fw-medium px-3 text-dark" to="/">Hayani (Home)</Link>
                        </li>

                        {/* NEW: Duel Option */}
                        <li className="nav-item">
                            <Link className="nav-link fw-medium px-3 text-dark d-flex align-items-center" to="/lobby">
                                ⚔️ Ṱatanyisani
                                <span className="badge bg-danger ms-1" style={{fontSize: '0.6rem'}}>NEW</span>
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link fw-medium px-3 text-secondary" to="/muvhigo">Muvhigo (Leaderboard)</Link>
                        </li>

                        {user ? (
                            <li className="nav-item dropdown ms-lg-3">
                                <button
                                    className="nav-link dropdown-toggle d-flex align-items-center gap-2 border-0 bg-transparent"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '38px', height: '38px' }}>
                                        {getInitials()}
                                    </div>
                                    <div className="d-none d-sm-block text-start">
                                        <div className="fw-bold text-dark small lh-1">
                                            {username || user.email?.split('@')[0]}
                                        </div>
                                        <small className="text-muted" style={{ fontSize: '10px' }}>{user.email}</small>
                                    </div>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 p-2 rounded-3">
                                    <li>
                                        <Link className="dropdown-item rounded-2 py-2" to="/profile">👤 Phurofayili (Profile)</Link>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item rounded-2 py-2 text-danger" onClick={handleLogout}>🚪 Bva (Sign Out)</button>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <div className="ms-lg-4 mt-3 mt-lg-0 d-flex gap-2">
                                <Link to="/login" className="btn btn-outline-primary px-4 py-2 fw-bold" style={{ fontSize: '0.85rem' }}>Dzhena</Link>
                                <Link to="/register" className="btn btn-primary px-4 py-2 fw-bold shadow-sm" style={{ fontSize: '0.85rem' }}>Ṅwalisani</Link>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;