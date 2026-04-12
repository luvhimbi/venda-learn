import React from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

interface WeeklyActivityGraphProps {
    dailyXP: Record<string, number>;
}

const WeeklyActivityGraph: React.FC<WeeklyActivityGraphProps> = ({ dailyXP = {} }) => {
    // Get the last 7 days including today using dayjs for consistency
    const days = [];
    const now = dayjs();
    
    for (let i = 6; i >= 0; i--) {
        const d = now.subtract(i, 'day');
        const dateStr = d.format('YYYY-MM-DD');
        const dayName = d.format('ddd');
        days.push({
            date: dateStr,
            label: dayName[0], // S, M, T, W, T, F, S
            fullName: dayName,
            xp: dailyXP[dateStr] || 0
        });
    }

    const maxXP = Math.max(...days.map(d => d.xp), 50); // Default max 50 to avoid 0 height

    return (
        <div className="brutalist-card p-4 bg-theme-surface mt-4 overflow-hidden position-relative">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-black text-theme-main mb-1 ls-tight uppercase">Daily Activity</h5>
                    <p className="smallest fw-bold text-theme-muted mb-0 ls-1 uppercase">XP Histogram • Last 7 Days</p>
                </div>
                <div className="text-end">
                    <span className="fw-black text-warning h4 mb-0">{days.reduce((a, b) => a + b.xp, 0)}</span>
                    <p className="smallest fw-bold text-theme-muted mb-0 ls-1 uppercase">Total XP</p>
                </div>
            </div>

            <div className="d-flex align-items-end justify-content-center w-100" style={{ height: '180px', paddingBottom: '30px' }}>
                {days.map((day, idx) => {
                    const heightPercentage = Math.max((day.xp / maxXP) * 100, 2); // At least 2% to see the baseline
                    const isToday = day.date === dayjs().format('YYYY-MM-DD');

                    return (
                        <div key={day.date} className="flex-grow-1 d-flex flex-column align-items-center h-100 position-relative" style={{ minWidth: 0 }}>
                            {/* Value Label */}
                            {day.xp > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="position-absolute smallest fw-black text-theme-main ls-1" 
                                    style={{ bottom: `${heightPercentage + 4}%`, zIndex: 2 }}
                                >
                                    {day.xp}
                                </motion.div>
                            )}

                            {/* Histogram Bar */}
                            <div className="w-100 h-100 position-relative px-0.5">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercentage}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.05, ease: "circOut" }}
                                    className={`w-100 position-absolute bottom-0 histogram-bar ${isToday ? 'active' : ''}`}
                                    style={{ 
                                        backgroundColor: isToday ? 'var(--venda-yellow)' : 'var(--color-text-muted)',
                                        opacity: isToday ? 1 : 0.4 + (idx * 0.08),
                                        borderTopLeftRadius: '4px',
                                        borderTopRightRadius: '4px'
                                    }}
                                >
                                    {isToday && <div className="histogram-glow" />}
                                </motion.div>
                            </div>

                            {/* X-Axis Label */}
                            <div className={`position-absolute bottom-0 fw-black smallest ls-1 uppercase mb-n1 ${isToday ? 'text-warning' : 'text-theme-muted'}`} style={{ fontSize: '9px' }}>
                                {day.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .uppercase { text-transform: uppercase; }
                .histogram-bar {
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }
                .histogram-bar:hover {
                    transform: scaleY(1.03);
                    opacity: 1 !important;
                    background-color: var(--venda-yellow-dark) !important;
                }
                .histogram-bar.active {
                    background: linear-gradient(180deg, var(--venda-yellow) 0%, var(--venda-yellow-dark) 100%) !important;
                }
                .histogram-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 10px;
                    background: white;
                    filter: blur(8px);
                    opacity: 0.3;
                }
                .px-0.5 { padding-left: 1px; padding-right: 1px; }
            `}</style>
        </div>
    );
};

export default WeeklyActivityGraph;
