import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import Swal from 'sweetalert2';
import { Menu, User as UserIcon, MessageSquare, Settings, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<{ username: string, points: number } | null>(null);
    const [chatCount, setChatCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // User Data Listener
                const userRef = doc(db, "users", currentUser.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({
                            username: docSnap.data().username || '',
                            points: docSnap.data().points || 0
                        });
                    }
                });

                // Chat Count Listener
                const unsubscribeChats = onSnapshot(
                    query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid)),
                    (snap) => setChatCount(snap.docs.length)
                );

                return () => {
                    unsubDoc();
                    unsubscribeChats();
                };
            } else {
                setUserData(null);
                setChatCount(0);
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
            confirmButtonColor: '#FACC15',
            cancelButtonColor: '#111827',
            confirmButtonText: 'Yes, Sign Out',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'rounded-4 border-0 shadow-none',
                confirmButton: 'text-dark fw-bold'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await signOut(auth);
                invalidateCache(); // Clear session data
                navigate('/login');
            }
        });
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom py-3">
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BRAND LOGO & SLOGAN */}
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                    <div
                        className="text-dark rounded-3 me-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{
                            width: '42px',
                            height: '42px',
                            fontSize: '1.2rem',
                            backgroundColor: '#FACC15',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        V
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                        <span className="fw-bold text-dark ls-tight lh-1" style={{ fontSize: '1.25rem' }}>
                            VENDA<span style={{ color: '#FACC15' }}>LEARN</span>
                        </span>
                        <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase">
                            Shumela Venda
                        </span>
                    </div>
                </Link>

                {/* MOBILE TOGGLER */}
                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#vendaNavbar"
                >
                    <Menu size={32} className="text-dark" />
                </button>

                {/* NAV LINKS & USER ACTIONS */}
                <div className="collapse navbar-collapse" id="vendaNavbar">
                    <ul className="navbar-nav ms-auto gap-lg-4 align-items-center">
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/') ? 'active-link' : ''}`} to="/">
                                Hayani
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/courses') ? 'active-link' : ''}`} to="/courses">
                                Pfunzo
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/history') ? 'active-link' : ''}`} to="/history">
                                Culture & History
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/muvhigo') ? 'active-link' : ''}`} to="/muvhigo">
                                Muvhigo
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/mitambo') || isActive('/word-puzzle') || isActive('/picture-puzzle') ? 'active-link' : ''}`} to="/mitambo">
                                Mitambo
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link position-relative ${isActive('/practice') ? 'active-link' : ''}`} to="/practice">
                                Practice
                                {chatCount > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ width: '8px', height: '8px' }}>
                                        <span className="visually-hidden">New alerts</span>
                                    </span>
                                )}
                            </Link>
                        </li>

                        {user ? (
                            /* AUTHENTICATED USER DROPDOWN */
                            <li className="nav-item dropdown ms-lg-2 w-100 w-lg-auto text-center mt-3 mt-lg-0">
                                <button
                                    className="nav-link dropdown-toggle d-flex align-items-center justify-content-center gap-3 border-0 bg-transparent p-0 mx-auto shadow-none"
                                    data-bs-toggle="dropdown"
                                >
                                    <div
                                        className="text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                        style={{
                                            width: '38px',
                                            height: '38px',
                                            fontSize: '0.8rem',
                                            backgroundColor: '#FACC15',
                                            border: '2px solid #111827'
                                        }}
                                    >
                                        {userData?.username.charAt(0).toUpperCase() || 'W'}
                                    </div>
                                    <span className="d-lg-none fw-bold text-dark small text-uppercase ls-1">
                                        {userData?.username || "Warrior"}
                                    </span>
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end border shadow-lg mt-3 p-0 overflow-hidden rounded-4 mx-auto" style={{ minWidth: '240px' }}>
                                    <li className="px-4 py-4 bg-light border-bottom text-start">
                                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Warrior Status</p>
                                        <h6 className="fw-bold text-dark mb-0">{userData?.username || "Learner"}</h6>
                                        <div className="d-flex align-items-center gap-2 mt-2">
                                            <span className="badge bg-dark rounded-pill smallest ls-1">{userData?.points || 0} LP</span>
                                            <span className="smallest text-muted fw-bold">Active</span>
                                        </div>
                                    </li>

                                    <li className="p-2 text-start">
                                        <Link className="dropdown-item rounded-3 py-2 px-3 d-flex align-items-center gap-3 shadow-none" to="/profile">
                                            <UserIcon size={18} className="text-muted" />
                                            <span className="small fw-bold">Profile</span>
                                        </Link>
                                    </li>
                                    <li className="p-2 pt-0 text-start">
                                        <Link className="dropdown-item rounded-3 py-2 px-3 d-flex align-items-center gap-3 shadow-none justify-content-between" to="/practice">
                                            <div className="d-flex align-items-center gap-3">
                                                <MessageSquare size={18} className="text-muted" />
                                                <span className="small fw-bold">Practice</span>
                                            </div>
                                            {chatCount > 0 && <span className="badge bg-danger rounded-pill smallest-pill">{chatCount}</span>}
                                        </Link>
                                    </li>
                                    <li className="p-2 pt-0 text-start">
                                        <Link className="dropdown-item rounded-3 py-2 px-3 d-flex align-items-center gap-3 shadow-none" to="/profile">
                                            <Settings size={18} className="text-muted" />
                                            <span className="small fw-bold">Settings</span>
                                        </Link>
                                    </li>

                                    <li className="border-top p-2 bg-white text-start">
                                        <button className="dropdown-item rounded-3 py-2 px-3 d-flex align-items-center gap-3 text-danger shadow-none" onClick={handleLogout}>
                                            <LogOut size={18} />
                                            <span className="small fw-bold">Sign Out</span>
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            /* GUEST BUTTONS */
                            <div className="ms-lg-4 d-flex flex-column flex-lg-row gap-2 mt-3 mt-lg-0 w-100 w-lg-auto">
                                <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest ls-1 px-3 shadow-none">
                                    DZHENA
                                </Link>
                                <Link to="/register" className="btn game-btn-primary fw-bold smallest ls-1 px-4 py-2 shadow-none">
                                    ṄWALISANI
                                </Link>
                            </div>
                        )}
                    </ul>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .smallest-pill { font-size: 9px; padding: 0.35em 0.65em; }
                
                .nav-custom-link {
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    letter-spacing: 2px !important;
                    text-transform: uppercase !important;
                    color: #6B7280 !important;
                    padding: 0.5rem 0 !important;
                    position: relative;
                    transition: color 0.2s ease;
                    text-decoration: none !important;
                    outline: none !important;
                }

                .nav-custom-link:hover {
                    color: #FACC15 !important;
                }

                .active-link {
                    color: #111827 !important;
                }

                @media (min-width: 992px) {
                    .active-link::after {
                        content: '';
                        position: absolute;
                        bottom: -2px;
                        left: 0;
                        width: 100%;
                        height: 3px;
                        background-color: #FACC15;
                        border-radius: 10px;
                    }
                }

                .shumela-venda-pulse {
                    font-size: 9px;
                    color: #9CA3AF;
                    animation: pulseVenda 3s infinite ease-in-out;
                }

                @keyframes pulseVenda {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; color: #FACC15; transform: scale(1.02); }
                    100% { opacity: 0.6; transform: scale(1); }
                }

                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                    text-decoration: none;
                }

                .game-btn-primary:active { 
                    transform: translateY(1px); 
                    box-shadow: 0 1px 0 #EAB308 !important; 
                }
                
                .dropdown-toggle::after { display: none; }

                .dropdown-item:hover {
                    background-color: #F3F4F6 !important;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;