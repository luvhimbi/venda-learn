import React from 'react';
import { Shield, ChevronLeft, ChevronRight, Check, Flame, Trophy, Calendar as CalendarIcon } from 'lucide-react';

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
        <div className="brutalist-card overflow-hidden shadow-action animate__animated animate__fadeIn p-0">
            <div className="p-4 p-md-5">
                {/* Header with Streak and Stats */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 mb-5 pb-5 border-bottom border-dark border-2">
                    <div className="d-flex align-items-center gap-4 text-center text-md-start">
                        <div className="fire-badge-large p-3 brutalist-card--sm bg-warning shadow-none">
                            <Flame className={`text-dark ${streak > 0 ? 'fire-animate' : ''}`} size={40} fill={streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <h2 className="fw-black mb-0 text-dark ls-tight uppercase" style={{ fontSize: '2rem' }}>{streak} Day Streak</h2>
                            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mt-2">
                                <Trophy size={16} className="text-dark" />
                                <span className="smallest fw-black text-dark uppercase ls-1">{points} XP EARNED</span>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-3 w-100 w-md-auto">
                        {onShareClick && (
                            <button
                                onClick={onShareClick}
                                className="btn btn-game btn-game-primary flex-fill"
                            >
                                <Flame size={18} fill="currentColor" className="me-2" />
                                <span className="fw-black">SHARE</span>
                            </button>
                        )}
                        <div className="d-flex align-items-center gap-2 px-4 py-2 bg-white border border-dark border-3 rounded-pill shadow-action-sm">
                            <Shield size={18} className="text-dark" />
                            <span className="fw-black text-dark uppercase ls-1" style={{ fontSize: '12px' }}>{streakFreezes} Freezes</span>
                        </div>
                    </div>
                </div>

                <div className="calendar-section">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-dark p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                                <CalendarIcon size={20} className="text-white" />
                            </div>
                            <span className="fw-black text-dark uppercase ls-2" style={{ fontSize: '1.25rem' }}>{monthName} {year}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="btn btn-game-white p-2 rounded-3 border-dark border-2"
                                style={{ width: 44, height: 44 }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="btn btn-game-white p-2 rounded-3 border-dark border-2"
                                style={{ width: 44, height: 44 }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid-v2">
                        {weekDays.map((wd, i) => (
                            <div key={i} className="text-center smallest fw-black text-muted uppercase mb-3 ls-1">{wd}</div>
                        ))}

                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="calendar-node empty"></div>;
                            return (
                                <div
                                    key={idx}
                                    className={`calendar-node-cell d-flex flex-column align-items-center justify-content-center`}
                                >
                                    <div className={`calendar-node ${day.active ? 'active' : ''} ${day.frozen ? 'frozen' : ''} ${day.isToday ? 'today' : ''} shadow-action-sm`}>
                                        {day.active ? <Check size={20} strokeWidth={4} /> : (day.frozen ? <Shield size={20} fill="currentColor" /> : <span className="node-day-num">{day.day}</span>)}
                                    </div>
                                    {(day.active || day.frozen) && <div className={day.active ? "active-dot mt-2" : "frozen-dot mt-2"}></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Premium Freeze Section */}
                <div className="mt-5 pt-5 border-top border-dark border-2">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 p-4 p-md-5 brutalist-card shadow-action-light bg-light">
                        <div className="d-flex align-items-center gap-4">
                            <div className="p-3 bg-white border border-dark border-3 rounded-4 shadow-action-sm text-dark d-flex align-items-center justify-content-center">
                                <Shield size={32} fill={streakFreezes > 0 ? "#FACC15" : "none"} strokeWidth={3} />
                            </div>
                            <div className="text-center text-md-start">
                                <h4 className="fw-black mb-1 text-dark uppercase ls-tight">{streakFreezes} STREAK FREEZES</h4>
                                <p className="smallest fw-black text-muted uppercase ls-2 mb-0">Status: {streakFreezes > 0 ? <span className="text-success">Protected</span> : <span className="text-danger">At Risk</span>}</p>
                            </div>
                        </div>

                        <div className="w-100 w-md-auto">
                            <button
                                onClick={onBuyFreeze}
                                disabled={points < FREEZE_COST || streak === 0}
                                className={`btn btn-game ${points >= FREEZE_COST && streak > 0 ? 'btn-game-primary' : 'bg-secondary text-white opacity-50'} w-100 px-5 py-3 shadow-action-sm`}
                            >
                                <span className="fw-black me-2">BUY FREEZE</span>
                                <span className={`badge ${points >= FREEZE_COST ? 'bg-dark text-warning' : 'bg-dark'}`} style={{ fontSize: '12px' }}>{FREEZE_COST} XP</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .fire-animate {
                    animation: fireFlicker 1.5s infinite ease-in-out;
                }

                @keyframes fireFlicker {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.9; }
                }

                .calendar-grid-v2 {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 12px;
                }

                .calendar-node-cell {
                    aspect-ratio: 1;
                    min-height: 52px;
                }

                .calendar-node {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: #fff;
                    border: 3px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.1s ease;
                    color: #000;
                    font-size: 15px;
                    font-weight: 900;
                    position: relative;
                }

                .calendar-node.active {
                    background: #22c55e;
                    color: white;
                    border-color: #000;
                }

                .calendar-node.frozen {
                    background: #0ea5e9;
                    color: white;
                    border-color: #000;
                }

                .calendar-node.today {
                    background: #FACC15;
                    border-width: 4px;
                    color: #000;
                }
                
                .active-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border: 1px solid #000;
                    border-radius: 50%;
                }

                .frozen-dot {
                    width: 8px;
                    height: 8px;
                    background: #0ea5e9;
                    border: 1px solid #000;
                    border-radius: 50%;
                }

                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 10px; }
                .fw-black { font-weight: 900; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default StreakCalendar;
