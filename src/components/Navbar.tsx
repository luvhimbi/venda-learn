import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import Swal from 'sweetalert2';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string>('');
    const navigate = useNavigate();
    const location = useLocation();

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
            title: 'Logout',
            text: "Vho khwaṱha uri vha khou fhedza u shumisa system?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#adb5bd',
            confirmButtonText: 'Yes, Sign Out',
            cancelButtonText: 'Cancel',
            padding: '2rem',
            customClass: {
                popup: 'rounded-4 border-0 shadow-lg'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                navigate('/login');
            }
        });
    };

    const getInitials = () => {
        if (username) return username.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'V';
    };

    // Helper to identify active link
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom py-3 shadow-sm animate__animated animate__fadeInDown">
            <div className="container">
                {/* LOGO STYLE MATCHING AUTH PAGES */}
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    <div className="bg-primary text-white rounded-3 me-2 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                         style={{ width: '32px', height: '32px', fontSize: '1rem' }}>V</div>
                    <span className="fw-bold text-dark ls-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                        VENDA<span className="text-primary">LEARN</span>
                    </span>
                </Link>

                <button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#vendaNavbar">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="vendaNavbar">
                    <ul className="navbar-nav ms-auto gap-lg-3 align-items-center">
                        <li className="nav-item">
                            <Link className={`nav-link fw-bold small text-uppercase ls-1 px-3 ${isActive('/') ? 'text-primary' : 'text-muted hover-primary'}`} to="/">
                                Hayani
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className={`nav-link fw-bold small text-uppercase ls-1 px-3 ${isActive('/muvhigo') ? 'text-primary' : 'text-muted hover-primary'}`} to="/muvhigo">
                                Muvhigo
                            </Link>
                        </li>

                        {user ? (
                            <li className="nav-item dropdown ms-lg-3 mt-3 mt-lg-0 w-100 w-lg-auto">
                                <button
                                    className="nav-link dropdown-toggle d-flex align-items-center gap-2 border-0 bg-light rounded-pill px-3 py-2 transition-all hover-shadow mx-auto mx-lg-0"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                         style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                                        {getInitials()}
                                    </div>

                                    <div className="text-start d-flex flex-column">
                                        <span className="fw-bold text-dark small lh-1">
                                            {username || "Warrior"}
                                        </span>
                                    </div>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-3 p-2 rounded-4 animate__animated animate__fadeIn">
                                    <li className="px-3 py-2 border-bottom mb-2">
                                        <div className="fw-bold text-dark small">Signed in as</div>
                                        <div className="text-muted truncate small" style={{maxWidth: '150px'}}>{user.email}</div>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item rounded-3 py-2 transition-all" to="/profile">
                                            <span className="me-2">👤</span> Profile
                                        </Link>
                                    </li>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li>
                                        <button className="dropdown-item rounded-3 py-2 text-danger transition-all" onClick={handleLogout}>
                                            <span className="me-2">🚪</span> Sign Out
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <div className="ms-lg-4 mt-3 mt-lg-0 d-flex gap-2">
                                <Link to="/login" className="btn btn-link text-decoration-none text-muted fw-bold small ls-1 px-3">
                                    DZHENA
                                </Link>
                                <Link to="/register" className="btn btn-primary rounded-pill px-4 py-2 fw-bold small ls-1 shadow-sm transition-all hover-lift">
                                    ṄWALISANI
                                </Link>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .hover-primary:hover { color: #0d6efd !important; transition: 0.2s ease; }
                .hover-shadow:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
                .hover-lift:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(13, 110, 253, 0.2) !important; }
                .dropdown-item:active { background-color: #0d6efd; }
                .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .transition-all { transition: all 0.2s ease-in-out; }
            `}</style>
        </nav>
    );
};

export default Navbar;