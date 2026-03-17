import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import { popupService } from '../services/popupService';
import { Menu, LogOut, Database } from 'lucide-react';
import { seedSyllables } from '../services/seedSyllables';
import { seedSentences } from '../services/seedSentences';
import { seedPicturePuzzles } from '../services/seedPicturePuzzles';

const AdminNavbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSeedGames = async () => {
        const confirm = await popupService.confirm('Seed Games?', 'Vha khou ṱoḓa u vusulusa data ya mitambo?');
        if (confirm.isConfirmed) {
            popupService.showLoading();
            await seedSyllables();
            await seedSentences();
            await seedPicturePuzzles();
            popupService.innerSuccess('Success', 'Game data seeded!');
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        popupService.confirm(
            'Admin Logout',
            'Vho khwaṱha uri vha khou bva kha admin dashboard?',
            'Yes, Logout',
            'Stay'
        ).then(async (result) => {
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
                    <img src="/images/VendaLearnLogo.png" alt="Venda Learn Logo" height="45" className="object-fit-contain" />
                </Link>

                {/* MOBILE TOGGLER */}
                <button
                    className="navbar-toggler border-0 shadow-none bg-secondary"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#adminNavbar"
                >
                    <Menu size={32} className="text-white" />
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
                            <Link className={`nav-link nav-custom-link ${isActive('/admin/visualizer') ? 'active-link' : ''}`} to="/admin/visualizer">
                                Visualizer
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
                            <button onClick={handleSeedGames} className="btn nav-link nav-custom-link text-warning border-0 bg-transparent">
                                <Database size={14} className="me-1" /> SEED GAMES
                            </button>
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
                                    className="btn game-btn-admin-logout fw-bold smallest ls-1 px-4 py-2 shadow-none d-flex align-items-center gap-2"
                                >
                                    <LogOut size={16} /> LOGOUT
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