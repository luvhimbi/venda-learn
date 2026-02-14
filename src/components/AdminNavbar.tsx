import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import Swal from 'sweetalert2';

const AdminNavbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        Swal.fire({
            title: 'Admin Logout',
            text: "Vho khwaṱha uri vha khou bva kha admin dashboard?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            cancelButtonColor: '#111827',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Stay',
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
        <nav className="navbar navbar-expand-lg sticky-top bg-dark border-bottom border-secondary py-3">
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BRAND LOGO - Matches Student UI exactly */}
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/admin/dashboard">
                    <div
                        className="text-dark rounded-3 me-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{
                            width: '42px',
                            height: '42px',
                            fontSize: '1.2rem',
                            backgroundColor: '#FACC15',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                    >
                        V
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                        <span className="fw-bold  ls-tight lh-1" style={{ fontSize: '1.25rem' }}>
                            VENDA<span style={{ color: '#FACC15' }}>ADMIN</span>
                        </span>
                        <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase">
                            Management Portal
                        </span>
                    </div>
                </Link>

                {/* MOBILE TOGGLER */}
                <button
                    className="navbar-toggler border-0 shadow-none bg-secondary"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#adminNavbar"
                >
                    <i className="bi bi-list fs-2 text-white"></i>
                </button>

                {/* ADMIN SPECIFIC NAV LINKS */}
                <div className="collapse navbar-collapse" id="adminNavbar">
                    <ul className="navbar-nav ms-auto gap-lg-4 align-items-center">
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/dashboard') ? 'active-link' : ''}`} to="/admin/dashboard">
                                Overview
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/lesson') ? 'active-link' : ''}`} to="/admin/lessons">
                                Content Editor
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/users') ? 'active-link' : ''}`} to="/admin/users">
                                User Records
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/daily-words') ? 'active-link' : ''}`} to="/admin/daily-words">
                                Daily Words
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/history') ? 'active-link' : ''}`} to="/admin/history">
                                History
                            </Link>
                        </li>
                        <li className="nav-item w-100 w-lg-auto text-center">
                            <Link className="nav-link nav-custom-link" to="/">
                                Exit to Site
                            </Link>
                        </li>

                        {user && (
                            <li className="nav-item ms-lg-2 w-100 w-lg-auto text-center mt-3 mt-lg-0">
                                <button
                                    onClick={handleLogout}
                                    className="btn game-btn-admin-logout fw-bold smallest ls-1 px-4 py-2 shadow-none"
                                >
                                    LOGOUT
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                
                .nav-custom-link {
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    letter-spacing: 2px !important;
                    text-transform: uppercase !important;
                    color: #9CA3AF !important;
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
                    color: black !important;
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
                    color: #6B7280;
                    animation: pulseAdmin 3s infinite ease-in-out;
                }

                @keyframes pulseAdmin {
                    0% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; color: #FACC15; transform: scale(1.02); }
                    100% { opacity: 0.6; transform: scale(1); }
                }

                .game-btn-admin-logout { 
                    background-color: #374151 !important; 
                    color: #FFFFFF !important; 
                    border: 1px solid #4B5563 !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #111827 !important; 
                    transition: all 0.2s; 
                    text-decoration: none;
                }

                .game-btn-admin-logout:hover {
                    background-color: #B91C1C !important;
                    border-color: #991B1B !important;
                }

                .game-btn-admin-logout:active { 
                    transform: translateY(1px); 
                    box-shadow: 0 1px 0 #111827 !important; 
                }
            `}</style>
        </nav>
    );
};

export default AdminNavbar;