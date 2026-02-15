import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { invalidateCache } from '../services/dataCache';
import Mascot from './Mascot';

const LogoutModal: React.FC<{ onClose: () => void, onConfirm: () => void }> = ({ onClose, onConfirm }) => (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50" style={{ zIndex: 1050 }}>
        <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '320px' }}>
            <div className="mb-3 d-flex justify-content-center">
                <Mascot mood="sad" width="120px" height="120px" />
            </div>
            <h5 className="fw-bold mb-2 text-slate">Leaving so soon?</h5>
            <p className="text-muted small mb-4">Are you sure u want to leave so soon?</p>
            <div className="d-flex gap-2">
                <button className="btn btn-light flex-grow-1 fw-bold text-slate" onClick={onClose}>
                    Stay
                </button>
                <button className="btn btn-danger flex-grow-1 fw-bold" onClick={onConfirm}>
                    Logout
                </button>
            </div>
        </div>
    </div>
);

const Sidebar: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<{ username: string, points: number, role?: string } | null>(null);
    const [chatCount, setChatCount] = useState(0);
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
                            role: docSnap.data().role
                        });
                    }
                });

                const unsubscribeChats = onSnapshot(
                    query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid)),
                    (snap) => {
                        let totalUnread = 0;
                        snap.docs.forEach(doc => {
                            const data = doc.data();
                            // Only count if not deleted by current user
                            const isDeleted = data.deletedBy?.includes(currentUser.uid);
                            if (!isDeleted) {
                                const count = data.unreadCount?.[currentUser.uid] || 0;
                                totalUnread += count;
                            }
                        });
                        setChatCount(totalUnread);
                    }
                );

                return () => {
                    unsubDoc();
                    unsubscribeChats();
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
        { path: '/history', label: 'Culture', icon: 'bi-bank2' ,tourClass: 'tour-sidebar-culture'},
        { path: '/practice', label: 'Practice', icon: 'bi-chat-heart-fill', badge: chatCount, tourClass: 'tour-sidebar-practice' },
        { path: '/mitambo', label: 'Games', icon: 'bi-controller', tourClass: 'tour-sidebar-games' },
        { path: '/muvhigo', label: 'Progress', icon: 'bi-graph-up-arrow' },
        { path: '/profile', label: 'Profile', icon: 'bi-person-circle', tourClass: 'tour-sidebar-profile' },
    ];

    if (!user) return null;

    return (
        <>
            {/* MOBILE TOP BAR (Hidden on Desktop) */}
            <div className="d-lg-none mobile-top-bar bg-white border-bottom px-4 d-flex align-items-center justify-content-between sticky-top shadow-sm">
                <div className="d-flex align-items-center gap-1"> {/* Reduced gap from 2 to 1 */}
                    <div
                        className="bg-warning rounded-pill d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '32px', height: '32px' }}
                    >
                        <span className="fw-bold smallest">V</span>
                    </div>
                    <span
                        className="fw-bold ls-tight mb-0"
                        style={{ marginLeft: '-2px' }} // Negative margin to pull text closer to the 'V' circle
                    >
            VENDA<span className="text-warning">LEARN</span>
        </span>
                </div>

                {/* Mobile Profile Link */}
                <Link to="/profile" className="d-flex align-items-center gap-2 text-decoration-none bg-light rounded-pill pe-3 p-1 border">
                    <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center fw-bold text-slate border shadow-sm"
                        style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                        {userData?.username.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <span className="smallest fw-bold text-muted ls-1">{userData?.points || 0} LP</span>
                </Link>
            </div>

            {/* MAIN SIDEBAR (Desktop Only) */}
            <aside className="sidebar bg-white border-end d-none d-lg-flex flex-column transition-all">

                {/* BRAND */}
                <div className="sidebar-brand px-4 py-5 d-flex align-items-center gap-3">
                    <div className="text-slate rounded-3 me-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0 bg-warning shadow-sm"
                        style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                        V
                    </div>
                    <div className="d-flex flex-column">
                        <span className="fw-bold ls-tight fs-5">VENDA<span className="text-warning">LEARN</span></span>
                        <span className="smallest text-muted fw-bold ls-2 uppercase">Shumela Venda</span>
                    </div>
                </div>

                {/* NAV LINKS */}
                <nav className="flex-grow-1 px-3 d-flex flex-column gap-2 overflow-auto scrollbar-hide">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item-link d-flex align-items-center gap-3 px-4 py-3 rounded-4 transition-all text-decoration-none ${item.tourClass || ''} ${isActive(item.path) ? 'active shadow-sm' : 'text-muted'}`}
                        >
                            <i className={`bi ${item.icon} fs-5`}></i>
                            <span className="fw-bold small ls-1 uppercase flex-grow-1">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && <span className="badge rounded-pill bg-danger border-0 smallest py-1 px-2">{item.badge}</span>}
                        </Link>
                    ))}

                    {userData?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="nav-item-link d-flex align-items-center gap-3 px-4 py-3 rounded-4 transition-all text-decoration-none text-danger mt-4 bg-light-danger border border-danger-subtle">
                            <i className="bi bi-shield-lock-fill fs-5"></i>
                            <span className="fw-bold small ls-1 uppercase">Admin Panel</span>
                        </Link>
                    )}
                </nav>

                {/* USER CARD (Bottom) */}
                <div className="sidebar-footer p-2 border-top bg-light-subtle">
                    <div className="user-profile-card bg-white border rounded-4 p-2 shadow-sm tour-sidebar-footer">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="profile-avatar bg-warning rounded-circle d-flex align-items-center justify-content-center fw-bold text-slate border-0 shadow-sm"
                                style={{ width: '36px', height: '36px' }}>
                                {userData?.username.charAt(0).toUpperCase() || 'W'}
                            </div>
                            <div className="overflow-hidden">
                                <h6 className="fw-bold mb-0 text-truncate small">{userData?.username || "Warrior"}</h6>
                                <p className="smallest text-muted mb-0 fw-bold ls-1">{userData?.points || 0} LP</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline-danger w-100 rounded-pill py-2 smallest fw-bold ls-2 uppercase border-0 bg-danger-subtle text-danger transition-all tour-sidebar-logout">
                            <i className="bi bi-box-arrow-right me-2 font-bold"></i> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV (Mobile Only) */}
            <nav className="mobile-bottom-nav fixed-bottom bg-white border-top d-lg-none d-flex align-items-center px-2 py-1 justify-content-between overflow-x-auto no-scrollbar shadow-lg">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`d-flex flex-column align-items-center justify-content-center p-2 rounded-3 text-decoration-none transition-all flex-grow-1 ${item.tourClass || ''} ${isActive(item.path) ? 'text-primary' : 'text-muted'}`}
                        style={{ minWidth: '65px' }}
                    >
                        <div className={`position-relative mb-1 rounded-circle d-flex align-items-center justify-content-center ${isActive(item.path) ? 'bg-primary-subtle' : ''}`} style={{ width: '32px', height: '32px' }}>
                            <i className={`bi ${item.icon} ${isActive(item.path) ? 'fs-5 text-primary' : 'fs-5'}`}></i>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger p-1 border border-light">
                                    <span className="visually-hidden">unread messages</span>
                                </span>
                            )}
                        </div>
                        <span className="fw-bold ls-1 d-none d-sm-block" style={{ fontSize: '9px', textTransform: 'uppercase' }}>{item.label}</span>
                    </Link>
                ))}

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
                    color: #64748b;
                }
                .nav-item-link:hover {
                    background-color: #f8fafc;
                    color: #1e293b;
                }
                .nav-item-link.active {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    color: white !important;
                }
                .nav-item-link.active i {
                    color: #FACC15 !important;
                }
                .ls-tight { letter-spacing: -1.2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2.2px; }
                .smallest { font-size: 10px; }
                .uppercase { text-transform: uppercase; }
                
                .mobile-top-bar {
                    height: 60px;
                    z-index: 1060;
                }
                
                .mobile-bottom-nav {
                    z-index: 1060;
                    padding-bottom: env(safe-area-inset-bottom, 15px); /* Interact with iPhone Home indicator */
                }

                .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .bg-light-danger { background-color: #fff1f2; }
                .text-slate { color: #1e293b !important; }
                .text-primary { color: #FACC15 !important; }
                .bg-primary-subtle { background-color: #FEF3C7 !important; }
                
                .btn-slate { background-color: #1e293b; color: white; border: none; }
                .btn-slate:hover { background-color: #334155; color: white; }
            `}</style>
            {/* Logout Modal */}
            {showLogout && <LogoutModal onClose={() => setShowLogout(false)} onConfirm={confirmLogout} />}
        </>
    );
};

export default Sidebar;
