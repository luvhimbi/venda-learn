import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import Swal from 'sweetalert2';
import { Menu, User as UserIcon, Settings, LogOut, Bell } from 'lucide-react';
import { AvatarDisplay } from './AvatarPicker';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<{ username: string, points: number, avatarId?: string } | null>(null);
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
                            points: docSnap.data().points || 0,
                            avatarId: docSnap.data().avatarId
                        });
                    }
                }, (err) => console.warn('Navbar user listener error:', err.message));

                return () => {
                    unsubDoc();
                };
            } else {
                setUserData(null);
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
        <>
            <div className="bg-munwenda" style={{ height: '6px', width: '100%', position: 'fixed', top: 0, zIndex: 1031 }}></div>
            <nav className="navbar navbar-expand-lg sticky-top bg-white border-bottom py-2" style={{ top: '6px' }}>
                <div className="container" style={{ maxWidth: '1100px' }}>

                    {/* BRAND LOGO & SLOGAN */}
                    <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                        <img src="/images/Logo.png" alt="Language Learning Platform Logo" height="45" className="object-fit-contain" />
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
                                    Home
                                </Link>
                            </li>
                            <li className="nav-item w-100 w-lg-auto text-center">
                                <Link className={`nav-link nav-custom-link ${isActive('/courses') ? 'active-link' : ''}`} to="/courses">
                                    Lessons
                                </Link>
                            </li>
                            <li className="nav-item w-100 w-lg-auto text-center">
                                <Link className={`nav-link nav-custom-link ${isActive('/history') ? 'active-link' : ''}`} to="/history">
                                    Culture & History
                                </Link>
                            </li>
                            <li className="nav-item w-100 w-lg-auto text-center">
                                <Link className={`nav-link nav-custom-link ${isActive('/muvhigo') ? 'active-link' : ''}`} to="/muvhigo">
                                    Leaderboard
                                </Link>
                            </li>
                            <li className="nav-item w-100 w-lg-auto text-center">
                                <Link className={`nav-link nav-custom-link ${isActive('/mitambo') || isActive('/word-puzzle') || isActive('/picture-puzzle') ? 'active-link' : ''}`} to="/mitambo">
                                    Games
                                </Link>
                            </li>

                            {user ? (
                                <div className="d-flex align-items-center justify-content-center gap-3 mt-3 mt-lg-0">
                                    {/* NOTIFICATION BELL */}
                                    <div className="position-relative d-flex align-items-center">
                                        <button className="btn btn-link text-dark p-1 shadow-none border-0" aria-label="Notifications">
                                            <Bell size={22} />
                                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                                <span className="visually-hidden">New alerts</span>
                                            </span>
                                        </button>
                                    </div>

                                    {/* AUTHENTICATED USER DROPDOWN */}
                                    <li className="nav-item dropdown w-100 w-lg-auto text-center">
                                        <button
                                            className="nav-link dropdown-toggle d-flex align-items-center justify-content-center gap-3 border-0 bg-transparent p-0 mx-auto shadow-none"
                                            data-bs-toggle="dropdown"
                                        >
                                            <AvatarDisplay
                                                avatarId={userData?.avatarId || 'adventurer'}
                                                seed={userData?.username || 'warrior'}
                                                size={38}
                                            />
                                            <span className="d-lg-none fw-bold text-dark small text-uppercase ls-1">
                                                {userData?.username || "Warrior"}
                                            </span>
                                        </button>

                                        <ul className="dropdown-menu dropdown-menu-end border shadow-lg mt-3 p-0 overflow-hidden rounded-4 mx-auto" style={{ minWidth: '240px' }}>
                                            <li className="px-4 py-4 bg-light border-bottom text-start">
                                                <div className="d-flex align-items-center gap-3">
                                                    <AvatarDisplay
                                                        avatarId={userData?.avatarId || 'adventurer'}
                                                        seed={userData?.username || 'warrior'}
                                                        size={48}
                                                    />
                                                    <div>
                                                        <p className="smallest fw-bold text-muted mb-0 ls-2 text-uppercase">Warrior Status</p>
                                                        <h6 className="fw-bold text-dark mb-0">{userData?.username || "Learner"}</h6>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 mt-2">
                                                    <span className="badge bg-dark rounded-pill smallest ls-1">{userData?.points || 0} XP</span>
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
                                </div>
                            ) : (
                                /* GUEST BUTTONS */
                                <div className="ms-lg-4 d-flex flex-column flex-lg-row gap-2 mt-3 mt-lg-0 w-100 w-lg-auto">
                                    <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest ls-1 px-3 shadow-none">
                                        LOG IN
                                    </Link>
                                    <Link to="/register" className="btn game-btn-primary fw-bold smallest ls-1 px-4 py-2 shadow-none">
                                        SIGN UP
                                    </Link>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>

                <style>{`
                .ls-2 { letter-spacing: 2px; }
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
                
                .dropdown-toggle::after { display: none; }

                .dropdown-item:hover {
                    background-color: #F3F4F6 !important;
                }
            `}</style>
            </nav>
        </>
    );
};

export default Navbar;