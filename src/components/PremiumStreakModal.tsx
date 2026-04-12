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
            <div className="premium-streak-modal-wrapper shadow-action" onClick={(e) => e.stopPropagation()}>
                <div className="brutalist-card bg-theme-card position-relative overflow-hidden d-flex flex-column" style={{ maxHeight: '90vh' }}>
                    {/* Munwenda Accent Top */}
                    <div className="minwenda-pattern-header" style={{ height: '8px', minHeight: '8px' }}></div>
                    
                    <div className="p-3 p-md-4 overflow-auto custom-scrollbar">
                        {/* Close button in top right */}
                        <button 
                            onClick={onClose}
                            className="btn btn-game-white rounded-circle position-absolute d-flex align-items-center justify-content-center border-3 shadow-action-sm"
                            style={{ top: '15px', right: '15px', width: '36px', height: '36px', padding: 0, zIndex: 11000 }}
                        >
                            <X size={18} strokeWidth={3} />
                        </button>

                        {/* Header Stats */}
                        <div className="text-center mb-3 mt-2">
                            <div className="d-inline-flex p-2 bg-danger bg-opacity-10 border border-danger border-2 rounded-4 mb-2 shadow-sm">
                                <Flame className="text-danger fire-animate" size={32} fill="currentColor" />
                            </div>
                            <h2 className="fw-black mb-0 ls-tight text-theme-main" style={{ fontSize: '2rem' }}>{streak}</h2>
                            <p className="fw-black text-theme-main uppercase ls-1 mb-0 smallest">DAY STREAK!</p>
                            <div className="badge bg-warning text-dark border border-theme-main border-2 p-1 px-3 mt-2 shadow-action-sm">
                                <Trophy size={12} className="me-2" />
                                <span className="smallest-print fw-black uppercase">{points} XP EARNED</span>
                            </div>
                        </div>

                        {/* Weekly Activity Grid */}
                        <div className="featured-week mb-3 p-3 bg-theme-surface border border-theme-main border-3 rounded-4 shadow-action-sm">
                            <p className="smallest-print fw-black text-theme-main uppercase mb-3 text-center ls-1">CURRENT WEEK PROGRESS</p>
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

                                    return (
                                        <div key={i} className="text-center d-flex flex-column align-items-center flex-grow-1">
                                            <span className={`smallest-print fw-black mb-1 ${isCurrent ? 'text-theme-main' : 'text-theme-muted'}`}>{wd}</span>
                                            <div className={`week-node-brutalist ${isActive ? 'active' : ''} ${isFrozen ? 'frozen' : ''} ${isCurrent ? 'current' : ''}`}>
                                                {isActive ? <Flame size={12} fill="currentColor" /> : (isFrozen ? <Shield size={12} fill="currentColor" /> : (isCurrent ? <div className="current-dot-brutalist"></div> : null))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="d-flex flex-column gap-2">
                            <button 
                                onClick={() => {
                                    onClose();
                                    navigate('/streak');
                                }}
                                className="btn btn-game btn-game-primary w-100 py-2 rounded-4 shadow-action-sm smallest fw-black"
                            >
                                VIEW FULL CALENDAR
                            </button>

                            {/* Freeze Status */}
                            <div className="p-2 px-3 bg-theme-surface border border-theme-main border-3 rounded-4 d-flex align-items-center justify-content-between shadow-action-sm">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="p-2 border border-info border-2 rounded-3 text-info bg-info bg-opacity-10 d-flex align-items-center justify-content-center">
                                        <Shield size={20} fill="currentColor" opacity={0.3} />
                                    </div>
                                    <div>
                                        <h6 className="fw-black mb-0 text-theme-main smallest uppercase">Freeze</h6>
                                        <p className="smallest-print fw-bold text-theme-muted uppercase ls-1 mb-0">Protects streak</p>
                                    </div>
                                </div>
                                <div className="text-end border-start border-2 ps-3 border-theme-main">
                                    <div className="d-flex align-items-baseline gap-1 justify-content-end">
                                        <span className="h5 fw-black text-theme-main mb-0">{streakFreezes}</span>
                                        <span className="smallest-print fw-black text-theme-muted">/ 5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="smallest italic text-center text-theme-muted mt-3 mb-1 opacity-75" style={{ fontSize: '10px' }}>"Nungo i bva kha u guda"</p>
                    </div>

                    <style>{`
                        .premium-streak-modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.7);
                            backdrop-filter: blur(8px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 10000;
                            animation: fadeInFade 0.3s ease;
                            padding: 20px;
                        }

                        @keyframes fadeInFade {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }

                        .premium-streak-modal-wrapper {
                            width: 100%;
                            max-width: 400px;
                            position: relative;
                            animation: modalScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                        }

                        @keyframes modalScaleIn {
                            from { transform: scale(0.8); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }

                        .week-node-brutalist {
                            width: 32px;
                            height: 32px;
                            border: 2px solid var(--color-border);
                            border-radius: 8px;
                            background: var(--color-card-bg);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                            color: var(--color-text-muted);
                        }

                        .week-node-brutalist.active {
                            background: #EF4444;
                            color: #fff;
                            box-shadow: 2px 2px 0px var(--color-border);
                        }

                        .week-node-brutalist.frozen {
                            background: linear-gradient(135deg, #7DD3FC 0%, #0EA5E9 100%);
                            color: #fff;
                            border-color: #BAE6FD;
                            box-shadow: 2px 2px 0px var(--color-border), 0 0 8px rgba(125, 211, 252, 0.4);
                            position: relative;
                            overflow: hidden;
                        }

                        .week-node-brutalist.frozen::after {
                            content: '';
                            position: absolute;
                            top: -50%;
                            left: -50%;
                            width: 200%;
                            height: 200%;
                            background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%);
                            animation: ice-shimmer 3s infinite;
                            pointer-events: none;
                        }

                        @keyframes ice-shimmer {
                            0% { transform: translate(-30%, -30%) rotate(0deg); }
                            100% { transform: translate(30%, 30%) rotate(0deg); }
                        }

                        .week-node-brutalist.current {
                            background: var(--color-surface);
                            border-color: var(--color-border);
                            border-width: 3px;
                            color: var(--color-text);
                        }

                        .current-dot-brutalist {
                            width: 6px;
                            height: 6px;
                            background: var(--color-text);
                            border-radius: 50%;
                        }

                        .fire-animate {
                            animation: fire-shake 1s infinite alternate;
                        }

                        @keyframes fire-shake {
                            from { transform: rotate(-5deg) scale(1); }
                            to { transform: rotate(5deg) scale(1.1); }
                        }

                        .smallest-print { font-size: 10px; }
                        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default PremiumStreakModal;
