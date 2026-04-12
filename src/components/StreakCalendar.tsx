import React from 'react';
import { Shield, ChevronLeft, ChevronRight, Flame, Trophy, Calendar as CalendarIcon } from 'lucide-react';

interface StreakCalendarProps {
    activityHistory: string[]; // Array of YYYY-MM-DD
    frozenDays?: string[];      // Array of YYYY-MM-DD
    streakFreezes: number;
    points: number;
    streak?: number;
    onBuyFreeze: () => void;
    onShareClick?: () => void;
}

interface CalendarDay {
    day: number;
    dateStr: string;
    active: boolean;
    frozen: boolean;
    isToday: boolean;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({
    activityHistory,
    frozenDays = [],
    streakFreezes,
    points,
    streak = 0,
    onBuyFreeze,
    onShareClick
}) => {
    const today = new Date();
    const [viewDate, setViewDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const daysInMonthCount = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    // Generate days for the view date month
    const generateDays = () => {
        const days: (CalendarDay | null)[] = [];
        const numDays = daysInMonthCount(viewDate.getFullYear(), viewDate.getMonth());

        // Monday start adjustment
        const adjustedStart = (firstDayOfMonth + 6) % 7;

        for (let i = 0; i < adjustedStart; i++) {
            days.push(null);
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                day: d,
                dateStr,
                active: streak > 0 && activityHistory.includes(dateStr),
                frozen: frozenDays.includes(dateStr),
                isToday: dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            });
        }
        return days;
    };

    const days = generateDays();
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const FREEZE_COST = 100;

    return (
        <div className="brutalist-card overflow-hidden transition-all animate__animated animate__fadeIn p-0 border-theme-main bg-theme-surface">
            <div className="p-3 p-md-5">
                {/* Header with Streak and Stats */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4 pb-4 border-bottom border-theme-soft">
                    <div className="d-flex align-items-center gap-3 text-center text-md-start">
                        <div className="fire-badge-large p-2 p-md-3 brutalist-card--sm bg-warning shadow-none" style={{ borderRadius: '16px' }}>
                            <Flame className={`text-dark ${streak > 0 ? 'fire-animate' : ''}`} size={32} fill={streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <h2 className="fw-black mb-0 text-theme-main ls-tight uppercase" style={{ fontSize: '1.5rem' }}>{streak} Day Streak</h2>
                            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mt-1">
                                <Trophy size={14} className="text-warning" />
                                <span className="smallest fw-black text-theme-muted uppercase ls-1">{points} XP EARNED</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-2 w-100 w-md-auto">
                        {onShareClick && (
                            <button
                                onClick={onShareClick}
                                className="btn btn-game btn-game-primary flex-fill smallest py-2"
                            >
                                <Flame size={14} fill="currentColor" className="me-2" />
                                <span className="fw-black">SHARE</span>
                            </button>
                        )}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 bg-theme-base border border-theme-soft rounded-pill shadow-action-sm">
                            <Shield size={14} className="text-primary" />
                            <span className="fw-black text-theme-main uppercase ls-1" style={{ fontSize: '10px' }}>{streakFreezes} Freezes</span>
                        </div>
                    </div>
                </div>

                <div className="calendar-section">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-2 gap-md-3">
                            <div className="bg-theme-main p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                <CalendarIcon size={16} className="text-theme-base" />
                            </div>
                            <span className="fw-black text-theme-main uppercase ls-1" style={{ fontSize: '1rem' }}>{monthName} {year}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="btn btn-game-white p-1 rounded-3 border-theme-soft"
                                style={{ width: 36, height: 36 }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="btn btn-game-white p-1 rounded-3 border-theme-soft"
                                style={{ width: 36, height: 36 }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid-v3">
                        {weekDays.map((wd, i) => (
                            <div key={i} className="text-center smallest fw-black text-theme-muted uppercase mb-2 ls-1">{wd}</div>
                        ))}

                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="calendar-node-v2 empty"></div>;
                            return (
                                <div
                                    key={idx}
                                    className={`calendar-node-cell-v2 d-flex flex-column align-items-center justify-content-center`}
                                >
                                    <div className={`calendar-node-v2 ${day.active ? 'active' : ''} ${day.frozen ? 'frozen' : ''} ${day.isToday ? 'today' : ''} shadow-action-sm`}>
                                        {day.active ? <Flame size={18} fill="currentColor" className="fire-animate" /> : (day.frozen ? <Shield size={18} fill="currentColor" /> : <span className="node-day-num">{day.day}</span>)}
                                    </div>
                                    {(day.active || day.frozen) && <div className={day.active ? "active-dot mt-1" : "frozen-dot mt-1"}></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Premium Freeze Section */}
                <div className="mt-4 pt-4 border-top border-theme-soft">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 p-md-4 brutalist-card--sm bg-theme-base border-theme-soft">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-theme-surface border border-theme-soft rounded-4 shadow-action-sm text-theme-main d-flex align-items-center justify-content-center">
                                <Shield size={24} fill={streakFreezes > 0 ? "var(--venda-yellow)" : "none"} strokeWidth={2.5} />
                            </div>
                            <div className="text-center text-md-start">
                                <h5 className="fw-black mb-1 text-theme-main uppercase ls-tight">{streakFreezes} Streak Freezes</h5>
                                <p className="smallest fw-bold text-theme-muted uppercase ls-2 mb-0">Status: {streakFreezes > 0 ? <span className="text-success">Protected</span> : <span className="text-danger">At Risk</span>}</p>
                            </div>
                        </div>

                        <div className="w-100 w-md-auto">
                            <button
                                onClick={onBuyFreeze}
                                disabled={points < FREEZE_COST || (streak === 0 && !frozenDays.length)}
                                className={`btn btn-game ${points >= FREEZE_COST ? 'btn-game-primary' : 'bg-secondary text-white opacity-25'} w-100 px-4 py-2 smallest`}
                            >
                                <span className="fw-black me-2 uppercase">Buy Freeze</span>
                                <span className="badge bg-dark text-warning px-2 py-1" style={{ fontSize: '9px' }}>{FREEZE_COST} XP</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .calendar-grid-v3 {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }
                
                @media (max-width: 576px) {
                    .calendar-grid-v3 { gap: 4px; }
                }

                .calendar-node-cell-v2 {
                    aspect-ratio: 1;
                    min-height: 40px;
                }

                .calendar-node-v2 {
                    width: clamp(32px, 8vw, 44px);
                    height: clamp(32px, 8vw, 44px);
                    border-radius: 12px;
                    background: var(--color-card-bg);
                    border: 2px solid var(--color-border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    color: var(--color-text);
                    font-size: clamp(12px, 3vw, 15px);
                    font-weight: 900;
                    position: relative;
                }

                .calendar-node-v2.empty {
                    border: none;
                    background: transparent;
                    box-shadow: none;
                }

                .calendar-node-v2.active {
                    background: #EF4444;
                    color: white;
                    border-color: #B91C1C;
                    transform: scale(1.05);
                    box-shadow: 0 4px 0 #991B1B;
                }

                .calendar-node-v2.frozen {
                    background: linear-gradient(135deg, #7DD3FC 0%, #0EA5E9 100%);
                    color: white;
                    border-color: #BAE6FD;
                    box-shadow: 0 4px 0 #0369A1, 0 0 10px rgba(125, 211, 252, 0.4);
                    position: relative;
                    overflow: hidden;
                }

                .calendar-node-v2.frozen::after {
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

                .calendar-node-v2.today {
                    border-color: #EF4444;
                    border-width: 3px;
                    color: #EF4444;
                    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
                }

                .calendar-node-v2.today.active {
                    background: #EF4444;
                    color: white;
                    box-shadow: 0 4px 0 #991B1B, 0 0 20px rgba(239, 68, 68, 0.4);
                }
                
                .node-day-num {
                    opacity: 0.8;
                }

                .active-dot, .frozen-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .active-dot { background: #EF4444; }
                .frozen-dot { background: #7DD3FC; }

                @keyframes fireFlicker {
                    0%, 100% { 
                        transform: scale(1) rotate(-1deg);
                        filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.4));
                    }
                    25% {
                        transform: scale(1.1) rotate(2deg);
                        filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.6));
                    }
                    50% { 
                        transform: scale(1.05) rotate(-3deg);
                        filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.7));
                    }
                    75% {
                        transform: scale(1.15) rotate(1deg);
                        filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.5));
                    }
                }
                .fire-animate { 
                    animation: fireFlicker 1.2s infinite alternate ease-in-out;
                    transform-origin: bottom center;
                }
            `}</style>
        </div>
    );
};

export default StreakCalendar;
