import React from 'react';
import { Calendar as CalendarIcon, Shield, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface StreakCalendarProps {
    activityHistory: string[]; // Array of YYYY-MM-DD
    streakFreezes: number;
    points: number;
    onBuyFreeze: () => void;
}

interface CalendarDay {
    day: number;
    active: boolean;
    isToday: boolean;
    isStart: boolean;
    isEnd: boolean;
    isMiddle: boolean;
    isIsolated: boolean;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ activityHistory, streakFreezes, points, onBuyFreeze }) => {
    const today = new Date();
    const [viewDate, setViewDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    const generateDays = () => {
        const days: (CalendarDay | null)[] = [];
        const numDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());

        // Padding for the start of the month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                day: d,
                active: activityHistory.includes(dateStr),
                isToday: dateStr === today.toISOString().split('T')[0],
                isStart: false,
                isEnd: false,
                isMiddle: false,
                isIsolated: false
            });
        }

        // Second pass to find consecutive streaks
        for (let i = startDay; i < days.length; i++) {
            const currentDay = days[i];
            if (currentDay && currentDay.active) {
                // To connect across grid gaps within the same row, we need to know neighbors
                const prevDay = i > 0 ? days[i - 1] : null;
                const nextDay = i < days.length - 1 ? days[i + 1] : null;

                const prevActive = !!(prevDay && prevDay.active);
                const nextActive = !!(nextDay && nextDay.active);

                // Also check if they are on the same row (0-indexed position % 7)
                const isStartOfWeek = i % 7 === 0;
                const isEndOfWeek = i % 7 === 6;

                const connectPrev = prevActive && !isStartOfWeek; // Only connect left if not start of week row
                const connectNext = nextActive && !isEndOfWeek;   // Only connect right if not end of week row

                currentDay.isStart = !connectPrev && connectNext;
                currentDay.isEnd = connectPrev && !connectNext;
                currentDay.isMiddle = connectPrev && connectNext;
                currentDay.isIsolated = !connectPrev && !connectNext;
            }
        }

        return days;
    };

    const days = generateDays();
    const FREEZE_COST = 100;

    return (
        <div className="streak-calendar-container p-4 rounded-4 bg-white border shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-danger bg-opacity-10 text-danger">
                        <CalendarIcon size={20} />
                    </div>
                    <h5 className="fw-bold mb-0 text-dark">Activity Calendar</h5>
                </div>
                <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-3">
                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                        className="btn btn-sm btn-light p-1 border-0"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="small fw-bold px-2 text-uppercase ls-1">{monthName} {year}</span>
                    <button
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                        className="btn btn-sm btn-light p-1 border-0"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="calendar-grid mb-4 position-relative">
                {/* Horizontal line running behind the week rows (optional visual effect similar to Dribbble) */}
                <div className="position-absolute w-100 h-100" style={{ zIndex: 0, pointerEvents: 'none' }}></div>

                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={`${day}-${i}`} className="calendar-weekday text-muted smallest fw-bold text-center py-2 z-1">{day}</div>
                ))}

                {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="calendar-day-cell empty z-1"></div>;

                    let streakClass = '';
                    if (day.active) {
                        if (day.isStart) streakClass = 'streak-start';
                        else if (day.isMiddle) streakClass = 'streak-middle';
                        else if (day.isEnd) streakClass = 'streak-end';
                        else if (day.isIsolated) streakClass = 'streak-isolated';
                    }

                    return (
                        <div
                            key={idx}
                            className={`calendar-day-cell position-relative d-flex align-items-center justify-content-center ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''} ${streakClass} z-1`}
                        >
                            {/* Visual connector line that runs horizontally behind */}
                            {day.active && (day.isStart || day.isMiddle) && (
                                <div className="streak-connector"></div>
                            )}

                            {/* The Circle with either Day Number or Checkmark */}
                            <div className={`day-circle d-flex align-items-center justify-content-center bg-white shadow-sm position-relative z-1 ${day.active ? 'active-circle' : ''}`}>
                                {day.active ? (
                                    <Check size={16} strokeWidth={3} className="text-white" />
                                ) : (
                                    <span className="small fw-bold">{day.day}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="streak-freezes-section p-3 rounded-4 bg-light border-0">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="mb-0 fw-bold text-dark small">Streak Freezes</p>
                            <p className="mb-0 smallest text-muted text-uppercase ls-1">{streakFreezes} available</p>
                        </div>
                    </div>
                    <button
                        onClick={onBuyFreeze}
                        disabled={points < FREEZE_COST}
                        className="btn btn-sm btn-dark rounded-pill px-3 fw-bold smallest ls-1"
                    >
                        BUY FOR {FREEZE_COST} XP
                    </button>
                </div>
                <p className="smallest text-muted mb-0 italic">
                    Streak freezes automatically protect your progress if you miss a day of learning.
                </p>
            </div>

            <style>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 16px 0; /* Vertical gap between rows */
                }
                .calendar-weekday {
                    margin-bottom: 4px;
                }
                .calendar-day-cell {
                    aspect-ratio: 1;
                    position: relative;
                    margin: 0;
                }
                .calendar-day-cell.empty {
                    background: transparent;
                    border: none;
                }
                
                /* The actual circle inside the cell */
                .day-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    color: #1e293b; /* slate-800 */
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .calendar-day-cell.empty .day-circle {
                    display: none;
                }

                /* Active state (Orange/Coral gradient) */
                .day-circle.active-circle {
                    background: linear-gradient(135deg, #FF7E5F, #FEB47B);
                    border: none;
                    box-shadow: 0 4px 10px rgba(255, 126, 95, 0.4);
                    color: white;
                    transform: scale(1.1);
                }

                /* Today state (Not active) */
                .calendar-day-cell.today:not(.active) .day-circle {
                    border: 2px solid #FF7E5F;
                    color: #FF7E5F;
                    box-shadow: none;
                }

                /* Inactive state (just grey text, no background in dribbble) */
                .calendar-day-cell:not(.active):not(.today):not(.empty) .day-circle {
                    background-color: transparent;
                    box-shadow: none;
                    color: #94A3B8; /* slate-400 */
                }

                /* The connector physically bridges the cells */
                .streak-connector {
                    position: absolute;
                    top: 50%;
                    right: -50%; /* Extend fully to the center of the next cell */
                    height: 4px;
                    width: 100%;
                    background-color: #FF7E5F; /* Corresponds to the orange */
                    opacity: 0.3; /* Make it a faint line behind the circles */
                    transform: translateY(-50%);
                    z-index: 0;
                    border-radius: 4px;
                }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 10px; }
            `}</style>
        </div>
    );
};

export default StreakCalendar;
