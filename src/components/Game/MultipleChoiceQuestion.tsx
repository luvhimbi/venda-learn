import React from 'react';
import type { MCQuestion } from '../../types/game';

interface Props {
    q: MCQuestion;
    selected: string | null;
    status: 'correct' | 'wrong' | null;
    onSelect: (opt: string) => void;
}

const MultipleChoiceQuestion: React.FC<Props> = ({ q, selected, status, onSelect }) => (
    <div className="d-grid gap-3">
        {q.options.map((opt) => {
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
);

export default MultipleChoiceQuestion;
