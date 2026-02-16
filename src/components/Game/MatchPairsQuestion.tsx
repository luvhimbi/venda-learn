import React, { useState } from 'react';
import type { MPQuestion } from '../../types/game';

interface Props {
    q: MPQuestion;
    onComplete: (allCorrect: boolean) => void;
}

const MatchPairsQuestion: React.FC<Props> = ({ q, onComplete }) => {
    const [selectedVenda, setSelectedVenda] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [wrongPair, setWrongPair] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);

    // Shuffle English column once
    const [shuffledEnglish] = useState(() => [...q.pairs].sort(() => Math.random() - 0.5).map(p => p.english));

    const handleEnglishTap = (eng: string) => {
        if (!selectedVenda || matched.includes(eng)) return;
        const correctPair = q.pairs.find(p => p.venda === selectedVenda);
        if (correctPair && correctPair.english === eng) {
            setMatched(prev => [...prev, eng]);
            setSelectedVenda(null);
            // Check completion
            if (matched.length + 1 === q.pairs.length) {
                setTimeout(() => onComplete(mistakes === 0), 600);
            }
        } else {
            setMistakes(m => m + 1);
            setWrongPair(eng);
            setTimeout(() => { setWrongPair(null); setSelectedVenda(null); }, 700);
        }
    };

    return (
        <div className="row g-3">
            {/* Venda Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">TSHIVENDA</p>
                {q.pairs.map(p => {
                    const isMatched = matched.includes(p.english);
                    return (
                        <button key={p.venda}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : selectedVenda === p.venda ? 'btn-dark text-white' : 'btn-outline-dark'}`}
                            disabled={isMatched}
                            onClick={() => setSelectedVenda(p.venda)}>
                            {p.venda}
                        </button>
                    );
                })}
            </div>
            {/* English Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">ENGLISH</p>
                {shuffledEnglish.map(eng => {
                    const isMatched = matched.includes(eng);
                    const isWrong = wrongPair === eng;
                    return (
                        <button key={eng}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-3 border-2 ${isMatched ? 'btn-success text-white border-success' : isWrong ? 'btn-danger text-white border-danger animate__animated animate__shakeX' : 'btn-outline-dark'}`}
                            disabled={isMatched || !selectedVenda}
                            onClick={() => handleEnglishTap(eng)}>
                            {eng}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MatchPairsQuestion;
