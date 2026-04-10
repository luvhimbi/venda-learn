import React, { useState } from 'react';
import type { MPQuestion } from '../../types/game';

interface Props {
    q: MPQuestion;
    onComplete: (allCorrect: boolean) => void;
}

const MatchPairsQuestion: React.FC<Props> = ({ q, onComplete }) => {
    const [selectedNative, setSelectedNative] = useState<string | null>(null);
    const [matched, setMatched] = useState<string[]>([]);
    const [wrongEnglish, setWrongEnglish] = useState<string | null>(null);
    const [wrongNative, setWrongNative] = useState<string | null>(null);
    const [mistakes, setMistakes] = useState(0);

    // Shuffle English column once
    const [shuffledEnglish] = useState(() => [...q.pairs].sort(() => Math.random() - 0.5).map(p => p.english));

    const handleEnglishTap = (eng: string) => {
        if (!selectedNative || matched.includes(eng) || wrongEnglish) return;
        const correctPair = q.pairs.find(p => p.nativeWord === selectedNative);
        if (correctPair && correctPair.english === eng) {
            setMatched(prev => [...prev, eng]);
            setSelectedNative(null);
            // Check completion
            if (matched.length + 1 === q.pairs.length) {
                setTimeout(() => onComplete(mistakes === 0), 600);
            }
        } else {
            setMistakes(m => m + 1);
            setWrongEnglish(eng);
            setWrongNative(selectedNative);
            setTimeout(() => { 
                setWrongEnglish(null); 
                setWrongNative(null); 
                setSelectedNative(null); 
            }, 1000);
        }
    };

    return (
        <div className="position-relative w-100">
            {/* Error Message */}
            <div style={{ position: 'absolute', top: '-40px', left: 0, right: 0, zIndex: 10, minHeight: '30px' }} className="text-center">
                {wrongEnglish && (
                    <div className="text-white fw-bold px-3 py-2 rounded-pill mx-auto d-inline-block animate__animated animate__headShake shadow-sm" style={{ backgroundColor: '#EF4444', fontSize: '14px' }}>
                        Incorrect, try again.
                    </div>
                )}
            </div>

            <div className="row g-2 g-md-3 mt-1">
            {/* Venda Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">NATIVE</p>
                {q.pairs.map(p => {
                    const isMatched = matched.includes(p.english);
                    const isWrong = wrongNative === p.nativeWord;
                    const isSelected = selectedNative === p.nativeWord;
                    
                    let bg = 'white';
                    let text = '#111827';
                    let border = '#E5E7EB';
                    
                    if (isMatched) { bg = '#10B981'; text = 'white'; border = '#10B981'; }
                    else if (isWrong) { bg = '#EF4444'; text = 'white'; border = '#EF4444'; }
                    else if (isSelected) { bg = '#111827'; text = 'white'; border = '#111827'; }
                    
                    return (
                        <button key={p.nativeWord}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-4 shadow-sm ${isWrong ? 'animate__animated animate__shakeX' : ''}`}
                            style={{ backgroundColor: bg, color: text, border: `2px solid ${border}`, transition: 'all 0.2s', opacity: isMatched ? 0.9 : 1 }}
                            disabled={isMatched || wrongEnglish !== null}
                            onClick={() => setSelectedNative(p.nativeWord)}>
                            <span style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>{p.nativeWord}</span>
                        </button>
                    );
                })}
            </div>
            {/* English Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">ENGLISH</p>
                {shuffledEnglish.map(eng => {
                    const isMatched = matched.includes(eng);
                    const isWrong = wrongEnglish === eng;
                    
                    let bg = 'white';
                    let text = '#111827';
                    let border = '#E5E7EB';
                    
                    if (isMatched) { bg = '#10B981'; text = 'white'; border = '#10B981'; }
                    else if (isWrong) { bg = '#EF4444'; text = 'white'; border = '#EF4444'; }
                    else if (selectedNative) { border = '#111827'; } // highlight selectable border if a native word is chosen
                    
                    return (
                        <button key={eng}
                            className={`btn w-100 mb-2 py-3 fw-bold rounded-4 shadow-sm ${isWrong ? 'animate__animated animate__shakeX' : ''}`}
                            style={{ backgroundColor: bg, color: text, border: `2px solid ${border}`, transition: 'all 0.2s', opacity: (isMatched || !selectedNative) ? 0.9 : 1 }}
                            disabled={isMatched || !selectedNative || wrongEnglish !== null}
                            onClick={() => handleEnglishTap(eng)}>
                            <span style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>{eng}</span>
                        </button>
                    );
                })}
            </div>
            </div>
        </div>
    );
};

export default MatchPairsQuestion;
