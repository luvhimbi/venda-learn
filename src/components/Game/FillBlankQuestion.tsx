import React, { useState } from 'react';
import type { FBQuestion } from '../../types/game';

interface Props {
    q: FBQuestion;
    onSubmit: (answer: string) => void;
    status: 'correct' | 'wrong' | null;
}

const FillBlankQuestion: React.FC<Props> = ({ q, onSubmit, status }) => {
    const [input, setInput] = useState('');
    const submitted = status !== null;
    return (
        <div>
            {q.hint && <p className="text-muted smallest mb-3 ls-1">HINT: {q.hint}</p>}
            <div className="d-flex gap-2">
                <input
                    type="text"
                    className={`form-control form-control-lg rounded-3 fw-bold text-center ${submitted ? (status === 'correct' ? 'border-success' : 'border-danger') : ''}`}
                    placeholder="Type your answer…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={submitted}
                    onKeyDown={e => { if (e.key === 'Enter' && input.trim()) onSubmit(input.trim()); }}
                    style={{ borderWidth: 2 }}
                />
            </div>
            {!submitted && (
                <button className="btn game-btn-primary w-100 py-3 fw-bold ls-1 mt-3"
                    disabled={!input.trim()}
                    onClick={() => onSubmit(input.trim())}>
                    CHECK ANSWER
                </button>
            )}
        </div>
    );
};

export default FillBlankQuestion;
