import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Book, Zap, ShieldCheck, Loader2, Gamepad2 } from 'lucide-react';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import { fetchAllUsers, fetchLessons } from '../../services/dataCache';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalLessons: 0,
        totalPoints: 0,
        difficultyBreakdown: { Easy: 0, Medium: 0, Hard: 0 }
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const users = await fetchAllUsers();
            let totalPts = 0;
            users.forEach((u: any) => {
                totalPts += (u.points || 0);
            });

            const lessons = await fetchLessons();
            const breakdown = { Easy: 0, Medium: 0,Hard: 0 };
            lessons.forEach((l: any) => {
                const diff = l.difficulty as keyof typeof breakdown;
                if (breakdown[diff] !== undefined) breakdown[diff]++;
            });

            setStats({
                totalUsers: users.length,
                totalLessons: lessons.length,
                totalPoints: totalPts,
                difficultyBreakdown: breakdown
            });
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const statCards = [
        { title: 'Total Students', value: stats.totalUsers, icon: Users, color: '#FACC15', link: '/admin/users' },
        { title: 'Active Lessons', value: stats.totalLessons, icon: Book, color: '#000', link: '/admin/lessons' },
        { title: 'Game Puzzles', value: 'Manage', icon: Gamepad2, color: '#FACC15', link: '/admin/game-content' },
        { title: 'Community XP', value: stats.totalPoints.toLocaleString(), icon: Zap, color: '#FACC15', link: '#' },
    ];

    return (
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="row g-4 align-items-center">
                        <div className="col-12 text-center text-md-start">
                            <div className="px-3">
                                <span className="fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">System Overview</span>
                                <h1 className="fw-bold ls-tight mb-0 text-theme-main" style={{ fontSize: '2.5rem' }}>
                                    Admin <span className="text-warning-custom">Dashboard</span>
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-theme-muted">CALCULATING ANALYTICS...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 mb-5 px-2">
                            {statCards.map((card, i) => (
                                <div key={i} className="col-md-4">
                                    <Link to={card.link} className="text-decoration-none">
                                        <div className="card-premium p-4 h-100 stat-card-hover">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div className="icon-box-premium"
                                                    style={{ border: `1.5px solid ${card.color === '#000' ? 'var(--color-text)' : card.color}` }}>
                                                    <card.icon color={card.color === '#000' ? 'var(--color-text)' : card.color} size={20} />
                                                </div>
                                                <span className="smallest fw-bold text-theme-muted ls-1">LIVE DATA</span>
                                            </div>
                                            <h2 className="fw-bold mb-1 text-theme-main">{card.value}</h2>
                                            <p className="text-theme-muted mb-0 smallest fw-bold ls-1 text-uppercase">{card.title}</p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="row g-4 px-2">
                            <div className="col-lg-7">
                                <div className="card-premium p-4 h-100">
                                    <h6 className="fw-bold ls-1 text-uppercase text-theme-muted mb-4 border-bottom border-theme-soft pb-2">Lesson Breakdown</h6>
                                    <div className="d-flex flex-column gap-4 mt-3">
                                        {Object.entries(stats.difficultyBreakdown).map(([level, count]) => (
                                            <div key={level}>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="smallest fw-bold text-uppercase ls-1 text-theme-main">{level}</span>
                                                    <span className="smallest fw-bold text-theme-main">{count} Lessons</span>
                                                </div>
                                                <div className="progress-premium">
                                                    <div
                                                        className="progress-bar-premium"
                                                        style={{
                                                            width: `${(count / stats.totalLessons) * 100}%`,
                                                            backgroundColor: level === 'Easy' ? '#10B981' : level === 'Medium' ? 'var(--venda-yellow-dark)' : '#EF4444'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-5">
                                <div className="card-premium p-4 h-100 dark-action-card d-flex flex-column justify-content-center text-center">
                                    <div className="mb-3">
                                        <ShieldCheck className="text-warning-custom mx-auto" size={56} />
                                    </div>
                                    <h4 className="fw-bold text-white">Quick Actions</h4>
                                    <p className="smallest text-white-50 ls-1 text-uppercase mb-4">Manage your platform content</p>
                                    <div className="d-grid gap-2">
                                        <Link to="/admin/add-lesson" className="btn btn-warning-premium">CREATE NEW LESSON</Link>
                                        <Link to="/admin/reset" className="btn btn-outline-danger-premium">SYSTEM RESET</Link>
                                        <Link to="/admin/logs" className="btn btn-outline-light-premium">VIEW AUDIT LOGS</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .text-warning-custom { color: var(--venda-yellow-dark) !important; }
                .card-premium {
                    background-color: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    box-shadow: var(--shadow-premium);
                    transition: all 0.3s ease;
                }
                .stat-card-hover:hover {
                    transform: translateY(-5px);
                    border-color: var(--venda-yellow-dark);
                }
                .icon-box-premium {
                    width: 45px;
                    height: 45px;
                    background-color: var(--color-surface-soft);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .progress-premium {
                    height: 8px;
                    background-color: var(--color-surface-soft);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .progress-bar-premium {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.8s ease;
                }
                .btn-action-premium {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    transition: all 0.2s;
                }
                .btn-action-premium:hover {
                    background-color: var(--color-border);
                    border-color: var(--color-text-muted);
                }
                .dark-action-card {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border: none;
                }
                .btn-warning-premium {
                    background-color: var(--venda-yellow) !important;
                    color: #000 !important;
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    padding: 12px;
                    border-radius: 12px;
                    border: none;
                    transition: all 0.2s;
                }
                .btn-warning-premium:hover {
                    background-color: var(--venda-yellow-dark) !important;
                    transform: scale(1.02);
                }
                .btn-outline-danger-premium {
                    background-color: transparent;
                    color: #f87171;
                    border: 2px solid #ef444433;
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    padding: 12px;
                    border-radius: 12px;
                    transition: all 0.2s;
                    text-decoration: none;
                }
                .btn-outline-danger-premium:hover {
                    background-color: #ef444411;
                    border-color: #ef4444;
                    color: #ef4444;
                }
                .btn-outline-light-premium {
                    background-color: transparent;
                    color: rgba(255,255,255,0.7);
                    border: 2px solid rgba(255,255,255,0.1);
                    font-weight: 800;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    padding: 12px;
                    border-radius: 12px;
                    transition: all 0.2s;
                    text-decoration: none;
                }
                .btn-outline-light-premium:hover {
                    background-color: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.3);
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;











