import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../../../services/firebaseConfig';
import { invalidateCache } from '../../../services/dataCache';

import { Menu, LogOut } from 'lucide-react';
import {popupService} from "../../../services/popupService.ts";



const AdminNavbar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    /*
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
    */

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        popupService.confirm(
            'Admin Logout',
            'Are you sure u want to exit the admin dashboard?',
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
        <nav className="navbar navbar-expand-lg sticky-top border-bottom py-3 admin-nav-premium">
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* BRAND LOGO */}
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/admin/dashboard">
                    <img src="/images/Logo.png" alt="Platform Logo" height="40" className="object-fit-contain logo-filter" />
                </Link>

                {/* MOBILE TOGGLER */}
                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#adminNavbar"
                >
                    <Menu size={28} className="text-theme-main" />
                </button>

                {/* ADMIN SPECIFIC NAV LINKS */}
                <div className="collapse navbar-collapse" id="adminNavbar">
                    <ul className="navbar-nav ms-auto gap-lg-3 align-items-center">
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">
                                Overview
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/lessons') || isActive('/admin/lesson') ? 'active' : ''}`} to="/admin/lessons">
                                Content
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/game-content') ? 'active' : ''}`} to="/admin/game-content">
                                Games
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/reviews') ? 'active' : ''}`} to="/admin/reviews">
                                Reviews
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`} to="/admin/users">
                                Users
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link admin-nav-link ${isActive('/admin/languages') ? 'active' : ''}`} to="/admin/languages">
                                Languages
                            </Link>
                        </li>
                        <li className="nav-item border-start ps-lg-3 ms-lg-2">
                            <Link className="nav-link admin-nav-link text-warning-custom d-flex align-items-center gap-1" to="/">
                                Site View
                            </Link>
                        </li>

                        {user && (
                            <li className="nav-item ms-lg-2">
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-logout-premium"
                                >
                                    <LogOut size={16} />
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <style>{`
                .admin-nav-premium {
                    background-color: var(--color-surface) !important;
                    border-color: var(--color-border) !important;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                
                .admin-nav-link {
                    font-weight: 600 !important;
                    font-size: 0.85rem !important;
                    color: var(--color-text-muted) !important;
                    padding: 0.5rem 0.75rem !important;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .admin-nav-link:hover {
                    color: var(--venda-yellow-dark) !important;
                    background-color: var(--color-surface-soft);
                }

                .admin-nav-link.active {
                    color: var(--color-text) !important;
                    background-color: var(--color-surface-soft);
                }

                .text-warning-custom {
                    color: var(--venda-yellow-dark) !important;
                }

                .btn-logout-premium {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text-muted);
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    padding: 8px 12px;
                    transition: all 0.2s;
                }

                .btn-logout-premium:hover {
                    background-color: #fee2e2;
                    color: #ef4444;
                    border-color: #fecaca;
                }

                [data-theme='dark'] .btn-logout-premium:hover {
                    background-color: #450a0a;
                    color: #f87171;
                    border-color: #7f1d1d;
                }

                .logo-filter {
                    transition: filter 0.3s ease;
                }

                [data-theme='dark'] .logo-filter {
                    filter: brightness(1.2);
                }
            `}</style>
        </nav>
    );
};

export default AdminNavbar;





