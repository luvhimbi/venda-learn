import React from 'react';
import { Shield, Check, Flame, X, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumStreakModalProps {
    streak: number;
    activityHistory: string[]; // Array of YYYY-MM-DD
    streakFreezes: number;
    points: number;
    isVisible: boolean;
    onClose: () => void;
}

const PremiumStreakModal: React.FC<PremiumStreakModalProps> = ({ 
    streak, 
    activityHistory, 
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
                                const dateStr = targetDate.toISOString().split('T')[0];
                                const isActive = activityHistory.includes(dateStr);
                                const isCurrent = i === adjustedDay;

                                return (
                                    <div key={i} className="text-center d-flex flex-column align-items-center flex-grow-1">
                                        <span className={`smallest fw-bold mb-2 ${isCurrent ? 'text-dark' : 'text-slate-400'}`}>{wd}</span>
                                        <div className={`week-node ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                                            {isActive ? <Check size={14} strokeWidth={4} /> : (isCurrent ? <div className="current-dot"></div> : null)}
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

                    <div className="mt-4 pt-3 border-top border-slate-100 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                             <Shield size={14} className="text-info" />
                             <span className="smallest fw-bold text-info uppercase tracking-widest">{streakFreezes} FREEZES AVAILABLE</span>
                        </div>
                        <p className="smallest italic text-slate-400 mb-0 mt-2">"Nungo i bva kha u guda" (Strength comes from learning)</p>
                    </div>
                </div>
            </div>

            <style>{`
                .premium-streak-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.4);
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
                    animation: modalReveal 0.3s cubic-bezier(0.19, 1, 0.22, 1);
                }

                @keyframes modalReveal {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .venda-white-container {
                    background: white;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                }

                .venda-stripes {
                    height: 4px;
                    background: #1e293b;
                }

                .fire-animate {
                    animation: flicker 1.5s infinite ease-in-out;
                }

                @keyframes flicker {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.8; }
                }

                .week-node {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: white;
                    border: 1.5px solid #edf2f7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    color: #cbd5e0;
                }

                .week-node.active {
                    background: #EF4444;
                    color: white;
                    border-color: #EF4444;
                    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25);
                }

                .week-node.current {
                    border-color: #94a3b8;
                    border-width: 2px;
                }

                .current-dot {
                    width: 6px;
                    height: 6px;
                    background: #64748b;
                    border-radius: 50%;
                }

                .tracking-widest { letter-spacing: 0.15em; }
                .ls-tight { letter-spacing: -0.5px; }
            `}</style>
            </div>
        </div>
    );
};

export default PremiumStreakModal;
