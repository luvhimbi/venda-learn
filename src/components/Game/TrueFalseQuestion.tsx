import React from 'react';
import type { TFQuestion } from '../../types/game';

interface Props {
    q: TFQuestion;
    selected: boolean | null;
    status: 'correct' | 'wrong' | null;
    onSelect: (val: boolean) => void;
}

const TrueFalseQuestion: React.FC<Props> = ({ q, selected, status, onSelect }) => {
    const renderBtn = (val: boolean, label: string, vendaLabel: string) => {
        const isCorrect = val === q.correctAnswer;
        const isSelected = selected === val;
        let cls = 'btn-outline-dark border-2';
        if (isSelected) cls = isCorrect ? 'btn-success border-success text-white' : 'btn-danger border-danger text-white';
        else if (selected !== null && isCorrect && status === 'wrong') cls = 'btn-success border-success text-white opacity-75';
        return (
            <button className={`btn btn-lg py-4 fw-bold rounded-pill flex-fill ${cls}`}
                onClick={() => onSelect(val)} disabled={selected !== null}>
                <span className="d-block fs-3">{vendaLabel}</span>
                <span className="smallest text-uppercase ls-2 opacity-75">{label}</span>
            </button>
        );
    };
    return (
        <div className="d-flex gap-3">
            {renderBtn(true, 'TRUE', 'NGOHO')}
            {renderBtn(false, 'FALSE', 'MAZWIFHI')}
        </div>
    );
};

export default TrueFalseQuestion;
