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
        <div className="unified-streak-calendar rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm animate__animated animate__fadeIn">

            
            <div className="p-4">
                {/* Header with Streak and Stats */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 mb-4 pb-4 border-bottom border-slate-100">
                    <div className="d-flex align-items-center gap-3">
                        <div className="fire-badge-large p-3 rounded-2xl bg-danger bg-opacity-10 d-flex align-items-center justify-content-center">
                            <Flame className={`text-danger ${streak > 0 ? 'fire-animate' : ''}`} size={32} fill={streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <div>
                            <h3 className="fw-bold mb-0 text-slate-900 ls-tight">{streak} Day Streak</h3>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <Trophy size={14} className="text-warning-emphasis" />
                                <span className="smallest fw-bold text-warning-emphasis uppercase tracking-widest">{points} XP EARNED</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                        {onShareClick && (
                            <button 
                                onClick={onShareClick}
                                className="btn btn-danger d-flex align-items-center gap-2 px-3 py-2 rounded-xl border-0 shadow-sm transition-all"
                            >
                                <Flame size={16} fill="currentColor" />
                                <span className="small fw-bold">Share</span>
                            </button>
                        )}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <Shield size={16} className="text-info" />
                            <span className="small fw-bold text-info">{streakFreezes} Freezes</span>
                        </div>
                    </div>
                </div>

                <div className="calendar-section">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <CalendarIcon size={16} className="text-slate-400" />
                            <span className="small fw-bold text-slate-600 uppercase tracking-widest">{monthName} {year}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                className="btn btn-light btn-sm rounded-lg p-1 border-slate-200"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                className="btn btn-light btn-sm rounded-lg p-1 border-slate-200"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid-v2">
                        {weekDays.map((wd, i) => (
                            <div key={i} className="text-center smallest fw-bold text-slate-400 uppercase mb-2">{wd}</div>
                        ))}
                        
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="calendar-node empty"></div>;
                            return (
                                <div 
                                    key={idx} 
                                    className={`calendar-node-cell d-flex flex-column align-items-center justify-content-center`}
                                >
                                    <div className={`calendar-node ${day.active ? 'active' : ''} ${day.frozen ? 'frozen' : ''} ${day.isToday ? 'today' : ''}`}>
                                        {day.active ? <Check size={16} strokeWidth={4} /> : (day.frozen ? <Shield size={16} fill="currentColor" opacity={0.5} /> : <span className="node-day-num">{day.day}</span>)}
                                    </div>
                                    {(day.active || day.frozen) && <div className={day.active ? "active-dot mt-1" : "frozen-dot mt-1"}></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Premium Freeze Section */}
                <div className="mt-4 pt-4 border-top border-slate-100">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm">
                        <div className="d-flex align-items-center gap-3">
                            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-info d-flex align-items-center justify-content-center shadow-sm">
                                <Shield size={24} fill="currentColor" opacity={0.15} strokeWidth={2} />
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0 text-slate-900">{streakFreezes} Streak Freezes</h5>
                                <p className="smallest fw-bold text-slate-400 uppercase tracking-widest mb-0 mt-1">Status: {streakFreezes > 0 ? 'Protected' : 'At Risk'}</p>
                            </div>
                        </div>
                        
                        <div className="d-flex flex-column gap-2 align-items-stretch min-w-[140px]">
                            <button
                                onClick={onBuyFreeze}
                                disabled={points < FREEZE_COST || streak === 0}
                                className={`btn ${points >= FREEZE_COST && streak > 0 ? 'btn-dark' : 'btn-slate-200'} rounded-2xl px-4 py-3 fw-bold small ls-1 transition-all d-flex align-items-center justify-content-center gap-2`}
                            >
                                <span className="opacity-75">Buy Freeze</span>
                                <span className={points >= FREEZE_COST ? 'badge bg-warning text-dark' : ''}>{FREEZE_COST} XP</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .unified-streak-calendar {
                    font-family: 'Inter', sans-serif;
                }
                


                .fire-animate {
                    animation: fireFlicker 1.5s infinite ease-in-out;
                }

                @keyframes fireFlicker {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }

                .calendar-grid-v2 {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                }

                .calendar-node-cell {
                    aspect-ratio: 1;
                    min-height: 48px;
                }

                .calendar-node {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1.5px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    color: #94a3b8;
                    font-size: 14px;
                    font-weight: 700;
                    position: relative;
                }

                .calendar-node.active {
                    background: #EF4444;
                    color: white;
                    border-color: #EF4444;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
                    transform: scale(1.05);
                }

                .calendar-node.frozen {
                    background: #0ea5e9;
                    color: white;
                    border-color: #0ea5e9;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
                }

                .calendar-node.today {
                    border-color: #FACC15;
                    border-width: 2px;
                    color: #334155;
                }
                
                .calendar-node.today:not(.active):not(.frozen) {
                    background: #fffbeb;
                }

                .active-dot {
                    width: 5px;
                    height: 5px;
                    background: #EF4444;
                    border-radius: 50%;
                }

                .frozen-dot {
                    width: 5px;
                    height: 5px;
                    background: #0ea5e9;
                    border-radius: 50%;
                }

                .ls-tight { letter-spacing: -0.5px; }
                .tracking-widest { letter-spacing: 0.1em; }
                .smallest { font-size: 10px; }
            `}</style>
        </div>
    );
};

export default StreakCalendar;
