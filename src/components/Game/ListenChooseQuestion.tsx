import React, { useEffect } from 'react';
import type { LCQuestion } from '../../types/game';

interface Props {
    q: LCQuestion;
    selected: string | null;
    status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void;
    speakVenda: (text: string) => void;
}

const ListenChooseQuestion: React.FC<Props> = ({ q, selected, status, onSelect, speakVenda }) => {
    // Auto-play on mount
    useEffect(() => { speakVenda(q.vendaWord); }, []);
    return (
        <div>
            <button className="btn btn-outline-dark border-2 rounded-pill px-5 py-3 mb-4 fw-bold"
                onClick={() => speakVenda(q.vendaWord)}>
                <i className="bi bi-volume-up-fill fs-3 me-2"></i> PLAY AGAIN
            </button>
            <div className="d-grid gap-3 mt-2">
                {q.options.map(opt => {
                    const isCorrect = opt === q.correctAnswer;
                    const isSelected = selected === opt;
                    let cls = 'btn-outline-dark border-2';
                    if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
                    else if (selected && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
                    return (
                        <button key={opt} className={`btn btn-lg py-4 fw-bold rounded-4 ${cls}`}
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
