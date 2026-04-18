import React, { useState } from 'react';
import type { MPQuestion } from '../../types/game';

interface Props {
    q: MPQuestion;
    onComplete: (allCorrect: boolean) => void;
}

const MatchPairsQuestion: React.FC<Props> = ({ q, onComplete }) => {
    const [selectedNativeIdx, setSelectedNativeIdx] = useState<number | null>(null);
    // matchedIndices stores the originalIndex of the pairs that have been successfully matched
    const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
    const [wrongEnglishIdx, setWrongEnglishIdx] = useState<number | null>(null);
    const [wrongNativeIdx, setWrongNativeIdx] = useState<number | null>(null);
    const [mistakes, setMistakes] = useState(0);

    // Shuffle English column once. Store objects with originalIndex and english text
    const [shuffledEnglish] = useState(() => 
        q.pairs.map((p, i) => ({ originalIndex: i, english: p.english }))
               .sort(() => Math.random() - 0.5)
    );

    const handleEnglishTap = (target: { originalIndex: number, english: string }) => {
        if (selectedNativeIdx === null || matchedIndices.includes(target.originalIndex) || wrongEnglishIdx !== null) return;
        
        if (selectedNativeIdx === target.originalIndex) {
            setMatchedIndices(prev => [...prev, target.originalIndex]);
            setSelectedNativeIdx(null);
            // Check completion
            if (matchedIndices.length + 1 === q.pairs.length) {
                setTimeout(() => onComplete(mistakes === 0), 600);
            }
        } else {
            setMistakes(m => m + 1);
            setWrongEnglishIdx(target.originalIndex);
            setWrongNativeIdx(selectedNativeIdx);
            setTimeout(() => { 
                setWrongEnglishIdx(null); 
                setWrongNativeIdx(null); 
                setSelectedNativeIdx(null); 
            }, 1000);
        }
    };

    return (
        <div className="position-relative w-100">
            {/* Error Message */}
            <div style={{ position: 'absolute', top: '-40px', left: 0, right: 0, zIndex: 10, minHeight: '30px' }} className="text-center">
                {wrongEnglishIdx !== null && (
                    <div className="text-white fw-bold px-3 py-2 rounded-pill mx-auto d-inline-block animate__animated animate__headShake shadow-sm" style={{ backgroundColor: '#EF4444', fontSize: '14px' }}>
                        Incorrect, try again.
                    </div>
                )}
            </div>

            <div className="row g-2 g-md-3 mt-1">
            {/* Venda Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">NATIVE</p>
                {q.pairs.map((p, i) => {
                    const isMatched = matchedIndices.includes(i);
                    const isWrong = wrongNativeIdx === i;
                    const isSelected = selectedNativeIdx === i;
                    
                    let bg = 'white';
                    let text = '#111827';
                    let border = '#E5E7EB';
                    
                    if (isMatched) { bg = '#10B981'; text = 'white'; border = '#10B981'; }
                    else if (isWrong) { bg = '#EF4444'; text = 'white'; border = '#EF4444'; }
                    else if (isSelected) { bg = '#111827'; text = 'white'; border = '#111827'; }
                    
                    return (
                        <button key={`native-${i}`}
                            className={`btn w-100 mb-2 py-2 fw-bold rounded-4 shadow-sm ${isWrong ? 'animate__animated animate__shakeX' : ''}`}
                            style={{ backgroundColor: bg, color: text, border: `2px solid ${border}`, transition: 'all 0.2s', opacity: isMatched ? 0.9 : 1 }}
                            disabled={isMatched || wrongEnglishIdx !== null}
                            onClick={() => setSelectedNativeIdx(i)}>
                            <span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>{p.nativeWord}</span>
                        </button>
                    );
                })}
            </div>
            {/* English Column */}
            <div className="col-6">
                <p className="smallest fw-bold text-muted ls-2 text-uppercase mb-3">ENGLISH</p>
                {shuffledEnglish.map((engObj, renderIdx) => {
                    const isMatched = matchedIndices.includes(engObj.originalIndex);
                    const isWrong = wrongEnglishIdx === engObj.originalIndex;
                    
                    let bg = 'white';
                    let text = '#111827';
                    let border = '#E5E7EB';
                    
                    if (isMatched) { bg = '#10B981'; text = 'white'; border = '#10B981'; }
                    else if (isWrong) { bg = '#EF4444'; text = 'white'; border = '#EF4444'; }
                    else if (selectedNativeIdx !== null) { border = '#111827'; } // highlight selectable border if a native word is chosen
                    
                    return (
                        <button key={`eng-${engObj.originalIndex}-${renderIdx}`}
                            className={`btn w-100 mb-2 py-2 fw-bold rounded-4 shadow-sm ${isWrong ? 'animate__animated animate__shakeX' : ''}`}
                            style={{ backgroundColor: bg, color: text, border: `2px solid ${border}`, transition: 'all 0.2s', opacity: (isMatched || selectedNativeIdx === null) ? 0.9 : 1 }}
                            disabled={isMatched || selectedNativeIdx === null || wrongEnglishIdx !== null}
                            onClick={() => handleEnglishTap(engObj)}>
                            <span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)' }}>{engObj.english}</span>
                        </button>
                    );
                })}
            </div>
            </div>
        </div>
    );
};

export default MatchPairsQuestion;






