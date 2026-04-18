import React, { useEffect } from 'react';
import type { LCQuestion } from '../../types/game';

interface Props {
    q: LCQuestion;
    selected: string | null;
    status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void;
    speakNative: (text: string) => void;
}

const ListenChooseQuestion: React.FC<Props> = ({ q, selected, status, onSelect, speakNative }) => {
    // Auto-play on mount
    useEffect(() => { speakNative(q.nativeWord); }, []);
    return (
        <div>
            <button className="btn btn-game-white border-dark border-3 rounded-pill px-4 py-2 mb-3 fw-black ls-1 smallest"
                onClick={() => speakNative(q.nativeWord)}>
                <i className="bi bi-volume-up-fill fs-5 me-2"></i> PLAY AGAIN
            </button>
            <div className="d-grid gap-2 mt-1">
                {q.options.map(opt => {
                    const isCorrect = opt === q.correctAnswer;
                    const isSelected = selected === opt;
                    let cls = 'btn-game-white border-dark border-3';
                    if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
                    else if (selected && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
                    return (
                        <button key={opt} className={`btn py-3 fw-bold rounded-4 ${cls}`} style={{ fontSize: '0.95rem' }}
                            onClick={() => onSelect(opt)} disabled={!!selected}>
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ListenChooseQuestion;






