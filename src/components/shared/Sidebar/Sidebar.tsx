import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';

import { AvatarDisplay } from '../../../features/avatar/components/AvatarPicker';
import LogoutModal from '../../../components/feedback/modals/LogoutModal';
import { useTheme } from '../../../app/providers/contexts/ThemeContext';
import {invalidateCache} from "../../../services/dataCache.ts";


const Sidebar: React.FC = () => {
    const { mode, setMode } = useTheme();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<{ username: string, points: number, avatarId?: string, role?: string } | null>(null);
    const [showLogout, setShowLogout] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({
                            username: docSnap.data().username || '',
                            points: docSnap.data().points || 0,
                            avatarId: docSnap.data().avatarId,
                            role: docSnap.data().role
                        });
                    }
                }, (err) => console.warn('Sidebar user listener error:', err.message));

                return () => {
                    unsubDoc();
                };
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        setShowLogout(true);
    };

    const confirmLogout = async () => {
        await signOut(auth);
        invalidateCache();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems: { path: string, label: string, icon: string, badge?: number, tourClass?: string }[] = [
        { path: '/', label: 'Home', icon: 'bi-house-heart-fill', tourClass: 'tour-sidebar-home' },
        { path: '/courses', label: 'Lessons', icon: 'bi-journal-bookmark-fill', tourClass: 'tour-sidebar-lessons' },
        { path: '/mitambo', label: 'Games', icon: 'bi-controller', tourClass: 'tour-sidebar-games' },
        { path: '/muvhigo', label: 'Leaderboard', icon: 'bi-bar-chart-fill', tourClass: 'tour-sidebar-progress' },
    ];

    if (!user) return null;

    return (
        <>

            {/* MAIN SIDEBAR (Desktop Only) */}
            <aside className="sidebar bg-theme-base border-end border-theme-main border-4 d-none d-lg-flex flex-column transition-all">

                {/* BRAND */}
                <Link className="sidebar-brand px-4 pt-5 pb-4 d-flex align-items-center gap-2 text-decoration-none" to="/">
                    <img src="/images/Logo.png" alt="Language Learning Platform Logo" height="45" className="object-fit-contain w-100" style={{ maxWidth: '160px' }} />
                </Link>

                {/* NAV LINKS */}
                <nav className="flex-grow-1 px-3 d-flex flex-column gap-3 overflow-auto scrollbar-hide py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item-link d-flex align-items-center gap-3 px-4 py-2 rounded-3 transition-all text-decoration-none border-3 ${item.tourClass || ''} ${isActive(item.path) ? 'active shadow-action-sm' : 'border-transparent'}`}
                        >
                            <i className={`bi ${item.icon} fs-4`}></i>
                            <span className="fw-black smallest uppercase flex-grow-1 ls-1">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && <span className="badge rounded-pill bg-danger border border-theme-main border-2 smallest py-1 px-2">{item.badge}</span>}
                        </Link>
                    ))}

                    {userData?.role === 'admin' && (
                        <Link to="/admin/dashboard" className={`nav-item-link d-flex align-items-center gap-3 px-4 py-3 rounded-3 transition-all text-decoration-none mt-4 border-3 ${isActive('/admin/dashboard') ? 'active-admin shadow-action-sm' : 'text-danger bg-danger-subtle border-transparent'}`}>
                            <i className="bi bi-shield-lock-fill fs-4"></i>
                            <span className="fw-black smallest uppercase ls-1">Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* USER CARD (Bottom) */}
                <div className="sidebar-footer p-3 border-top border-theme-main border-3">
                    <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                        <span className="smallest fw-black ls-1 uppercase text-theme-muted">APPEARANCE</span>
                        <div className="d-flex gap-1">
                            <button 
                                onClick={() => setMode('light')}
                                className={`btn-theme-toggle ${mode === 'light' ? 'active' : ''}`}
                                title="Light Mode"
                            >
                                <i className="bi bi-sun-fill"></i>
                            </button>
                            <button 
                                onClick={() => setMode('dark')}
                                className={`btn-theme-toggle ${mode === 'dark' ? 'active' : ''}`}
                                title="Dark Mode"
                            >
                                <i className="bi bi-moon-stars-fill"></i>
                            </button>
                            <button 
                                onClick={() => setMode('system')}
                                className={`btn-theme-toggle ${mode === 'system' ? 'active' : ''}`}
                                title="Sync with System"
                            >
                                <i className="bi bi-display"></i>
                            </button>
                        </div>
                    </div>

                    <div className="user-profile-card transition-all">
                        <Link to="/profile" className="d-flex align-items-center gap-3 mb-3 text-decoration-none p-2 rounded-3 hover-bg-theme transition-all border border-theme-main border-2 shadow-sm">
                            <AvatarDisplay
                                avatarId={userData?.avatarId || 'adventurer'}
                                seed={userData?.username || 'warrior'}
                                size={42}
                            />
                            <div className="overflow-hidden">
                                <div className="d-flex align-items-center gap-1">
                                    <h6 className="fw-black mb-0 text-truncate text-theme-main uppercase smallest ls-1">{userData?.username || (user?.isAnonymous ? "Guest Learner" : "Warrior")}</h6>
                                    {user?.isAnonymous && <span className="badge bg-secondary rounded-pill fw-bold" style={{ fontSize: '8px', padding: '2px 4px' }}>GUEST</span>}
                                </div>
                                <p className="smallest-print text-theme-muted mb-0 fw-bold ls-1 uppercase">{userData?.points || 0} XP</p>
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="btn-logout w-100 rounded-3 py-2 small fw-black ls-1 uppercase transition-all d-flex align-items-center justify-content-center gap-2 border border-theme-main border-2">
                            <i className="bi bi-box-arrow-right fs-5"></i> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV (Mobile Only) */}
            <nav className="mobile-bottom-nav fixed-bottom bg-theme-base border-top border-theme-main border-4 d-lg-none d-flex flex-column shadow-action">
                <div className="d-flex align-items-center px-1 py-1 overflow-x-auto no-scrollbar w-100">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-decoration-none transition-all flex-grow-1 flex-shrink-0 ${item.tourClass || ''} ${isActive(item.path) ? 'text-dark fw-black' : 'text-muted'}`}
                            style={{ minWidth: '70px' }}
                        >
                            <div className={`position-relative mb-1 rounded-3 border-2 d-flex align-items-center justify-content-center ${isActive(item.path) ? 'bg-theme-accent border-theme-main shadow-sm' : 'border-transparent'}`} style={{ width: '38px', height: '38px' }}>
                                <i className={`bi ${item.icon} ${isActive(item.path) ? 'fs-5 text-theme-main' : 'fs-5'}`}></i>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger p-1 border border-theme-main">
                                        <span className="visually-hidden">unread messages</span>
                                    </span>
                                )}
                            </div>
                            <span className="fw-black ls-1 uppercase" style={{ fontSize: '9px' }}>{item.label}</span>
                        </Link>
                    ))}

                    {/* MOBILE PROFILE LINK IN BOTTOM NAV */}
                    <Link
                        to="/profile"
                        className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-decoration-none transition-all flex-grow-1 flex-shrink-0 ${isActive('/profile') ? 'text-dark fw-black' : 'text-muted'}`}
                        style={{ minWidth: '70px' }}
                    >
                        <div className={`position-relative mb-1 rounded-3 border-2 d-flex align-items-center justify-content-center ${isActive('/profile') ? 'bg-warning border-dark shadow-sm' : 'border-transparent'}`} style={{ width: '38px', height: '38px' }}>
                            <AvatarDisplay
                                avatarId={userData?.avatarId || 'adventurer'}
                                seed={userData?.username || 'warrior'}
                                size={isActive('/profile') ? 28 : 24}
                            />
                        </div>
                        <span className="fw-black ls-1 uppercase" style={{ fontSize: '9px' }}>Profile</span>
                    </Link>
                </div>
            </nav>

            <style>{`
                .sidebar {
                    width: 280px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 1050;
                }
                .bg-theme-base { background-color: var(--color-bg); }
                .border-theme-main { border-color: var(--color-border) !important; }
                .text-theme-main { color: var(--color-text) !important; }
                .text-theme-muted { color: var(--color-text-muted) !important; }
                .bg-theme-accent { background-color: var(--venda-yellow) !important; }

                .btn-theme-toggle {
                    background: transparent;
                    border: 2px solid var(--color-border-soft);
                    border-radius: 6px;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted);
                    transition: all 0.2s;
                }
                .btn-theme-toggle:hover {
                    border-color: var(--color-border) !important;
                    color: #000 !important;
                    background-color: var(--venda-yellow) !important;
                }
                .btn-theme-toggle:hover i {
                    color: #000 !important;
                }
                .btn-theme-toggle.active {
                    background-color: var(--venda-yellow);
                    border-color: var(--color-border);
                    color: #000;
                    box-shadow: 2px 2px 0px var(--color-border);
                }
                .btn-theme-toggle.active i {
                    color: #000;
                }

                .nav-item-link {
                    color: var(--color-text-muted);
                }
                .nav-item-link:hover {
                    background-color: var(--venda-yellow) !important;
                    color: #000 !important;
                    border-color: var(--color-border) !important;
                    transform: translate(-2px, -2px);
                }
                .nav-item-link:hover * {
                    color: #000 !important;
                }
                
                .hover-bg-theme:hover {
                    background-color: var(--venda-yellow) !important;
                    border-color: var(--color-border) !important;
                }
                .hover-bg-theme:hover * {
                    color: #000 !important;
                }
                
                /* Brutalist Active State - Yellow & Black */
                .nav-item-link.active {
                    background-color: var(--venda-yellow) !important;
                    border-color: var(--color-border) !important;
                    color: #000 !important;
                    transform: translate(-2px, -2px);
                }
                .nav-item-link.active i {
                    color: #000 !important;
                }

                /* Admin Panel Link Customization */
                .active-admin {
                    background-color: #fb7185 !important;
                    border-color: var(--color-border) !important;
                    color: #000 !important;
                    transform: translate(-2px, -2px);
                }
                .active-admin i {
                    color: #000 !important;
                }

                .smallest-print { font-size: 9px; }
                
                .mobile-bottom-nav {
                    z-index: 1100;
                    padding-bottom: env(safe-area-inset-bottom, 12px);
                }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                .text-primary { color: #FACC15 !important; }
                
                .btn-logout {
                    background-color: transparent;
                    color: #ef4444;
                    transition: 0.1s;
                }
                .btn-logout:hover {
                    background-color: var(--color-surface-soft);
                    border-color: var(--color-border) !important;
                    transform: translate(-2px, -2px);
                    box-shadow: 4px 4px 0px var(--color-border);
                }

                .hover-bg-theme:hover {
                    background-color: var(--color-surface-soft) !important;
                    border-color: var(--color-border) !important;
                }
            `}</style>
            {/* Logout Modal */}
            {showLogout && <LogoutModal onClose={() => setShowLogout(false)} onConfirm={confirmLogout} />}
        </>
    );
};

export default Sidebar;






