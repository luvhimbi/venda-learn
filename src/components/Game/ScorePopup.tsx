import React from 'react';
import type { ScoreResult } from '../../services/scoringUtils';

interface Props {
    result: ScoreResult | null;
}

const ScorePopup: React.FC<Props> = ({ result }) => {
    if (!result) return null;
    return (
        <div className="score-popup animate__animated animate__bounceIn" style={{
            position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
            zIndex: 50, background: '#111827', color: '#FACC15', padding: '10px 28px',
            borderRadius: 40, fontWeight: 800, fontSize: 22, letterSpacing: 1,
            boxShadow: '0 6px 24px rgba(0,0,0,.35)', pointerEvents: 'none'
        }}>
            {result.label}
        </div>
    );
};

export default ScorePopup;
