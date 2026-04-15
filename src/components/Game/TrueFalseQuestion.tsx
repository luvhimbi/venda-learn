import React from 'react';
import type { TFQuestion } from '../../types/game';

interface Props {
    q: TFQuestion;
    selected: boolean | null;
    status: 'correct' | 'wrong' | null;
    onSelect: (val: boolean) => void;
}

const TrueFalseQuestion: React.FC<Props> = ({ q, selected, status, onSelect }) => {
    const renderBtn = (val: boolean, label: string) => {
        const isCorrect = val === q.correctAnswer;
        const isSelected = selected === val;
        let cls = 'btn-game-white border-dark border-3';
        if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
        else if (selected !== null && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white';
        return (
            <button className={`btn btn-lg py-4 fw-bold rounded-pill flex-fill ${cls}`}
                onClick={(e) => { e.stopPropagation(); onSelect(val); }} disabled={selected !== null}>
                <span className="fs-3 text-uppercase ls-1">{label}</span>
            </button>
        );
    };
    return (
        <div className="d-flex gap-3">
            {renderBtn(true, 'TRUE')}
            {renderBtn(false, 'FALSE')}
        </div>
    );
};

export default TrueFalseQuestion;
