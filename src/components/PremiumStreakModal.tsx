import React from 'react';
import { Shield, Flame, X, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumStreakModalProps {
    streak: number;
    activityHistory: string[]; // Array of YYYY-MM-DD
    frozenDays?: string[];      // Array of YYYY-MM-DD
    streakFreezes: number;
    points: number;
    isVisible: boolean;
    onClose: () => void;
}

const PremiumStreakModal: React.FC<PremiumStreakModalProps> = ({ 
    streak, 
    activityHistory, 
    frozenDays = [],
    streakFreezes, 
    points,
    isVisible,
    onClose
}) => {
    const navigate = useNavigate();
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    if (!isVisible) return null;

    return (
        <div className="premium-streak-modal-overlay" onClick={onClose}>
            <div className="premium-streak-modal-wrapper shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="venda-white-container rounded-4 overflow-hidden border border-slate-200">
                {/* Clean Top Border */}
                <div style={{ height: '4px', background: '#1e293b' }}></div>
                
                <div className="p-4 bg-white text-dark text-start">
                    {/* Header with Close Button and XP display */}
                    <div className="d-flex justify-content-between align-items-start mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <div className="fire-badge p-2 rounded-2xl bg-danger bg-opacity-10">
                                <Flame className="text-danger fire-animate" size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h4 className="fw-bold mb-0 text-slate-900 ls-tight">{streak} Day Streak</h4>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                    <Trophy size={12} className="text-warning-emphasis" />
                                    <span className="smallest fw-bold text-warning-emphasis uppercase tracking-widest">{points} XP EARNED</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="btn btn-link text-slate-400 p-1 hover:text-slate-900 transition-colors border-0"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Featured Weekly View */}
                    <div className="featured-week mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="smallest fw-bold text-slate-400 uppercase mb-3 text-center tracking-widest">Arali u tshi guda (Current Week)</p>
                        <div className="d-flex justify-content-between gap-1 px-1">
                            {weekDays.map((wd, i) => {
                                const d = new Date();
                                const dayOfWeek = d.getDay(); 
                                const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                const diff = i - adjustedDay;
                                const targetDate = new Date(d);
                                targetDate.setDate(d.getDate() + diff);
                                 const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                                const isActive = streak > 0 && activityHistory.includes(dateStr);
                                const isFrozen = frozenDays.includes(dateStr);
                                const isCurrent = i === adjustedDay;

                                const isCurrentState = isCurrent && !isActive && !isFrozen;

                                return (
                                    <div key={i} className="text-center d-flex flex-column align-items-center flex-grow-1">
                                        <span className={`smallest fw-bold mb-2 ${isCurrent ? 'text-dark' : 'text-slate-400'}`}>{wd}</span>
                                        <div className={`week-node ${isActive ? 'active' : ''} ${isFrozen ? 'frozen' : ''} ${isCurrentState ? 'current' : ''}`}>
                                            {isActive ? <Flame size={14} fill="currentColor" /> : (isFrozen ? <Shield size={14} fill="currentColor" /> : (isCurrentState ? <div className="current-dot"></div> : null))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Full Calendar Link Action */}
                    <button 
                        onClick={() => {
                            onClose();
                            navigate('/profile');
                        }}
                        className="btn btn-light w-100 rounded-2xl py-3 fw-bold small text-slate-600 hover:bg-slate-100 transition-all border border-slate-100 d-flex align-items-center justify-content-center gap-2"
                    >
                        VIEW FULL STREAK CALENDAR
                    </button>

                    {/* Premium Streak Freeze Section */}
                    <div className="freeze-card mt-4 p-3 rounded-2xl d-flex align-items-center justify-content-between bg-slate-50 border border-slate-100">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-xl bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center shadow-sm">
                                <Shield size={24} fill="currentColor" opacity={0.2} strokeWidth={2} />
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-slate-800 small">Streak Freeze</h6>
                                <p className="smallest fw-bold text-slate-400 uppercase tracking-widest mb-0" style={{ fontSize: '9px' }}>Auto-protects progress</p>
                            </div>
                        </div>
                        <div className="text-end border-start ps-3 border-slate-200">
                            <div className="d-flex align-items-baseline gap-1 justify-content-end">
                                <span className="h4 fw-bold text-slate-900 mb-0">{streakFreezes}</span>
                                <span className="smallest fw-bold text-slate-400">/ 5</span>
                            </div>
                            <p className="smallest fw-extrabold text-info uppercase mb-0 tracking-tighter" style={{ fontSize: '8px' }}>Available</p>
                        </div>
                    </div>
                    <p className="smallest italic text-center text-slate-400 mt-3 mb-0 opacity-75">"Nungo i bva kha u guda"</p>
                </div>
            </div>

            <style>{`
                .premium-streak-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .premium-streak-modal-wrapper {
                    width: 100%;
                    max-width: 380px;
                    margin: 0 20px;
                    transform-origin: center;
                    animation: modalReveal 0.35s cubic-bezier(0.19, 1, 0.22, 1);
                }

                @keyframes modalReveal {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .venda-white-container {
                    background: white;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                .fire-animate {
                    animation: flicker 2s infinite ease-in-out;
                }

                @keyframes flicker {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(239, 68, 68, 0)); }
                    50% { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.4)); }
                }

                .week-node {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    color: #cbd5e0;
                }

                .week-node.active {
                    background: #EF4444;
                    color: white;
                    border-color: #EF4444;
                    box-shadow: 0 8px 16px -4px rgba(239, 68, 68, 0.4);
                }

                .week-node.frozen {
                    background: #0ea5e9;
                    color: white;
                    border-color: #0ea5e9;
                    box-shadow: 0 8px 16px -4px rgba(14, 165, 233, 0.4);
                }

                .week-node.current {
                    border-color: #e2e8f0;
                    background: #f8fafc;
                }

                .current-dot {
                    width: 6px;
                    height: 6px;
                    background: #94a3b8;
                    border-radius: 50%;
                }

                .tracking-widest { letter-spacing: 0.15em; }
                .tracking-tighter { letter-spacing: -0.02em; }
                .ls-tight { letter-spacing: -1px; }

                .freeze-card {
                    transition: transform 0.2s ease;
                }
                .freeze-card:hover {
                    transform: translateY(-2px);
                }
            `}</style>
            </div>
        </div>
    );
};

export default PremiumStreakModal;
