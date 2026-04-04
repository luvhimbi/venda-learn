import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import { AvatarDisplay } from './AvatarPicker';
import LogoutModal from './LogoutModal';


const Sidebar: React.FC = () => {
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
        // { path: '/ngano', label: 'Stories', icon: 'bi-book-half', tourClass: 'tour-sidebar-ngano' },
        // { path: '/history', label: 'Culture', icon: 'bi-bank2', tourClass: 'tour-sidebar-culture' },
        { path: '/mitambo', label: 'Games', icon: 'bi-controller', tourClass: 'tour-sidebar-games' },
        { path: '/muvhigo', label: 'Leaderboard', icon: 'bi-trophy-fill', tourClass: 'tour-sidebar-progress' },
    ];

    if (!user) return null;

    return (
        <>

            {/* MAIN SIDEBAR (Desktop Only) */}
            <aside className="sidebar bg-white border-end d-none d-lg-flex flex-column transition-all">

                {/* BRAND */}
                <Link className="sidebar-brand px-4 pt-5 pb-2 d-flex align-items-center gap-2 text-decoration-none" to="/">
                    <img src="/images/Logo.png" alt="Language Learning Platform Logo" height="45" className="object-fit-contain w-100" style={{ maxWidth: '160px' }} />
                </Link>

                {/* NAV LINKS */}
                <nav className="flex-grow-1 px-3 d-flex flex-column gap-3 overflow-auto scrollbar-hide py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item-link d-flex align-items-center gap-3 px-4 py-2 rounded-4 transition-all text-decoration-none border-2 border-transparent ${item.tourClass || ''} ${isActive(item.path) ? 'active' : 'text-muted'}`}
                        >
                            <i className={`bi ${item.icon} fs-4`}></i>
                            <span className="fw-bold small ls-1 uppercase flex-grow-1">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && <span className="badge rounded-pill bg-danger border-0 smallest py-1 px-2">{item.badge}</span>}
                        </Link>
                    ))}

                    {userData?.role === 'admin' && (
                        <Link to="/admin/dashboard" className={`nav-item-link d-flex align-items-center gap-3 px-4 py-2 rounded-4 transition-all text-decoration-none mt-4 ${isActive('/admin/dashboard') ? 'active-admin' : 'text-danger bg-danger-subtle border-2 border-transparent'}`}>
                            <i className="bi bi-shield-lock-fill fs-4"></i>
                            <span className="fw-bold small ls-1 uppercase">Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* USER CARD (Bottom) */}
                <div className="sidebar-footer p-3 border-top">
                    <div className="user-profile-card transition-all">
                        <Link to="/profile" className="d-flex align-items-center gap-3 mb-3 text-decoration-none p-2 rounded-4 hover-bg-light transition-all border border-transparent">
                            <AvatarDisplay
                                avatarId={userData?.avatarId || 'adventurer'}
                                seed={userData?.username || 'warrior'}
                                size={42}
                            />
                            <div className="overflow-hidden">
                                <div className="d-flex align-items-center gap-1">
                                    <h6 className="fw-bold mb-0 text-truncate text-dark" style={{ fontSize: '14px' }}>{userData?.username || (user?.isAnonymous ? "Guest Learner" : "Warrior")}</h6>
                                    {user?.isAnonymous && <span className="badge bg-secondary rounded-pill fw-bold" style={{ fontSize: '8px', padding: '2px 4px' }}>GUEST</span>}
                                </div>
                                <p className="smallest text-muted mb-0 fw-bold ls-1 uppercase">{userData?.points || 0} XP</p>
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="btn-logout w-100 rounded-4 py-2 small fw-bold ls-1 uppercase transition-all d-flex align-items-center justify-content-center gap-2">
                            <i className="bi bi-box-arrow-right fs-5"></i> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV (Mobile Only) */}
            <nav className="mobile-bottom-nav fixed-bottom bg-white border-top d-lg-none d-flex flex-column shadow-lg">
                <div className="d-flex align-items-center px-1 py-1 overflow-x-auto no-scrollbar w-100">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-decoration-none transition-all flex-grow-1 flex-shrink-0 ${item.tourClass || ''} ${isActive(item.path) ? 'text-primary' : 'text-muted'}`}
                            style={{ minWidth: '70px' }}
                        >
                            <div className={`position-relative mb-1 rounded-circle d-flex align-items-center justify-content-center ${isActive(item.path) ? 'bg-primary-subtle' : ''}`} style={{ width: '32px', height: '32px' }}>
                                <i className={`bi ${item.icon} ${isActive(item.path) ? 'fs-5 text-primary' : 'fs-5'}`}></i>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger p-1 border border-light">
                                        <span className="visually-hidden">unread messages</span>
                                    </span>
                                )}
                            </div>
                            <span className="fw-bold ls-1" style={{ fontSize: '9px', textTransform: 'uppercase' }}>{item.label}</span>
                        </Link>
                    ))}

                    {/* NEW: MOBILE PROFILE LINK IN BOTTOM NAV */}
                    <Link
                        to="/profile"
                        className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-decoration-none transition-all flex-grow-1 flex-shrink-0 ${isActive('/profile') ? 'text-primary' : 'text-muted'}`}
                        style={{ minWidth: '70px' }}
                    >
                        <div className={`position-relative mb-1 rounded-circle d-flex align-items-center justify-content-center ${isActive('/profile') ? 'bg-primary-subtle' : ''}`} style={{ width: '32px', height: '32px' }}>
                            <AvatarDisplay
                                avatarId={userData?.avatarId || 'adventurer'}
                                seed={userData?.username || 'warrior'}
                                size={isActive('/profile') ? 30 : 26}
                            />
                        </div>
                        <span className="fw-bold ls-1" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Profile</span>
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
                .nav-item-link {
                    color: #777;
                    border: 2px solid transparent;
                    border-bottom: 2px solid transparent;
                }
                .nav-item-link:hover {
                    background-color: #f1f5f9;
                    color: #1e293b;
                }
                
                /* Duolingo Inspired Active State - Brand Black & Yellow */
                .nav-item-link.active {
                    background-color: #1e293b !important;
                    border: 2px solid #0f172a !important;
                    border-bottom: 4px solid #0f172a !important;
                    color: #FACC15 !important;
                    transform: translateY(-2px);
                }
                .nav-item-link.active i {
                    color: #FACC15 !important;
                }

                /* Admin Panel Link Customization */
                .active-admin {
                    background-color: #1e293b !important;
                    border: 2px solid #0f172a !important;
                    border-bottom: 4px solid #0f172a !important;
                    color: #fb7185 !important; /* Slightly distinct but consistent */
                    transform: translateY(-2px);
                }
                .active-admin i {
                    color: #fb7185 !important;
                }

                .ls-tight { letter-spacing: -1.2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2.2px; }
                .smallest { font-size: 10px; }
                .uppercase { text-transform: uppercase; }
                
                .mobile-top-bar {
                    height: 50px;
                    z-index: 1060;
                }
                
                .mobile-bottom-nav {
                    z-index: 1060;
                    padding-bottom: env(safe-area-inset-bottom, 15px); /* Interact with iPhone Home indicator */
                }

                .transition-all { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .bg-light-danger { background-color: #fff1f2; }
                .text-slate { color: #1e293b !important; }
                .text-primary { color: #FACC15 !important; }
                .bg-primary-subtle { background-color: #1e293b !important; }
                
                .btn-logout {
                    background-color: transparent;
                    color: #ef4444;
                    border: 2px solid transparent;
                }
                .btn-logout:hover {
                    background-color: #fef2f2;
                    border: 2px solid #fee2e2;
                    border-bottom: 4px solid #fee2e2;
                    transform: translateY(-1px);
                }

                .hover-bg-light:hover {
                    background-color: #f8fafc !important;
                    border-color: #e2e8f0 !important;
                }
            `}</style>
            {/* Logout Modal */}
            {showLogout && <LogoutModal onClose={() => setShowLogout(false)} onConfirm={confirmLogout} />}
        </>
    );
};

export default Sidebar;
