import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { fetchAllUsers, fetchLessons } from '../services/dataCache';
import { seedPuzzles } from '../services/seedPuzzles';
import { seedSyllables } from '../services/seedSyllables';
import { seedDailyWords } from '../services/seedDailyWords';
import { seedSentences } from '../services/seedSentences';

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
            const breakdown = { Easy: 0, Medium: 0, Hard: 0 };
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
        { title: 'Total Students', value: stats.totalUsers, icon: 'bi-people', color: '#FACC15', link: '/admin/users' },
        { title: 'Active Lessons', value: stats.totalLessons, icon: 'bi-book', color: '#000', link: '/admin/lessons' },
        { title: 'Community XP', value: stats.totalPoints.toLocaleString(), icon: 'bi-lightning-charge', color: '#FACC15', link: '#' },
    ];

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="row g-4 align-items-center">
                        <div className="col-md-9">
                            <div className="px-3">
                                <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">System Overview</span>
                                <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                    Admin <span style={{ color: '#FACC15' }}>Dashboard</span>
                                </h1>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100 p-3 text-center">
                                <div className="mb-3 text-warning">
                                    <i className="bi bi-database-fill-gear fs-2"></i>
                                </div>
                                <h6 className="fw-bold">Seed Puzzles</h6>
                                <p className="text-muted small mb-3">Reset / Populate Word Puzzles</p>
                                <button onClick={seedPuzzles} className="btn btn-outline-warning btn-sm w-100 fw-bold mb-2">
                                    Seed Word Puzzles
                                </button>
                                <button onClick={seedSyllables} className="btn btn-outline-info btn-sm w-100 fw-bold mb-2">
                                    Seed Syllables
                                </button>
                                <button onClick={async () => {
                                    if (window.confirm("Seed Daily Words?")) {
                                        const res = await seedDailyWords();
                                        alert(res.message);
                                    }
                                }} className="btn btn-outline-success btn-sm w-100 fw-bold mb-2">
                                    Seed Daily Words
                                </button>
                                <button onClick={async () => {
                                    const res = await seedSentences();
                                    alert(res.message);
                                }} className="btn btn-outline-primary btn-sm w-100 fw-bold">
                                    Seed Sentences
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status"></div>
                        <p className="mt-3 ls-1 smallest fw-bold text-muted">CALCULATING ANALYTICS...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 mb-5 px-2">
                            {statCards.map((card, i) => (
                                <div key={i} className="col-md-4">
                                    <Link to={card.link} className="text-decoration-none">
                                        <div className="stat-card p-4 rounded-4 bg-white border shadow-sm h-100">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div className="icon-box rounded-3 d-flex align-items-center justify-content-center"
                                                    style={{ width: '45px', height: '45px', backgroundColor: '#f8f9fa', border: `1px solid ${card.color}` }}>
                                                    <i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1.2rem' }}></i>
                                                </div>
                                                <span className="smallest fw-bold text-muted ls-1">LIVE DATA</span>
                                            </div>
                                            <h2 className="fw-bold mb-1 text-dark">{card.value}</h2>
                                            <p className="text-secondary mb-0 smallest fw-bold ls-1 text-uppercase">{card.title}</p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="row g-4 px-2">
                            <div className="col-lg-7">
                                <div className="bg-white p-4 rounded-4 border shadow-sm h-100">
                                    <h6 className="fw-bold ls-1 text-uppercase text-muted mb-4 border-bottom pb-2">Lesson Breakdown</h6>
                                    <div className="d-flex flex-column gap-4 mt-3">
                                        {Object.entries(stats.difficultyBreakdown).map(([level, count]) => (
                                            <div key={level}>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="smallest fw-bold text-uppercase ls-1">{level}</span>
                                                    <span className="smallest fw-bold">{count} Lessons</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
                                                    <div
                                                        className="progress-bar"
                                                        style={{
                                                            width: `${(count / stats.totalLessons) * 100}%`,
                                                            backgroundColor: level === 'Easy' ? '#10B981' : level === 'Medium' ? '#FACC15' : '#EF4444'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-lg-5">
                                <div className="bg-dark text-white p-4 rounded-4 border shadow-sm h-100 d-flex flex-column justify-content-center text-center">
                                    <div className="mb-3">
                                        <i className="bi bi-shield-lock-fill text-warning" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <h4 className="fw-bold">Quick Actions</h4>
                                    <p className="smallest text-secondary ls-1 text-uppercase mb-4">Manage your platform content</p>
                                    <div className="d-grid gap-2">
                                        <Link to="/admin/add-lesson" className="btn btn-warning fw-bold smallest ls-1 py-3 rounded-3">CREATE NEW LESSON</Link>
                                        <Link to="/admin/logs" className="btn btn-outline-light fw-bold smallest ls-1 py-3 rounded-3 border-2">VIEW AUDIT LOGS</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .stat-card { transition: all 0.3s ease; border-bottom: 4px solid transparent !important; }
                .stat-card:hover { transform: translateY(-5px); border-bottom-color: #FACC15 !important; }
                .progress { background-color: #f0f0f0; }
                .btn-warning { background-color: #FACC15 !important; color: #000 !important; border: none; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;