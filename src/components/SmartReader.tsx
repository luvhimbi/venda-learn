import React, { useState, useEffect, useRef } from 'react';

interface SmartReaderProps {
    title: string;
    text: string;
}

const SmartReader: React.FC<SmartReaderProps> = ({ title, text }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1);
    const [activeIndex, setActiveIndex] = useState<number>(-1); // Index of the active paragraph

    // Split text into paragraphs for cleaner rendering and tracking
    // We filter out empty strings to avoid index mismatches
    const paragraphs = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);

    const speakingRef = useRef(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            speakingRef.current = false;
        };
    }, []);

    // Scroll active paragraph into view
    useEffect(() => {
        if (activeIndex >= 0 && paragraphRefs.current[activeIndex]) {
            paragraphRefs.current[activeIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex]);

    const speak = () => {
        window.speechSynthesis.cancel(); // Clear previous

        // We join with a pause or break to ensure natural flow, but for tracking, 
        // we need to know where we are. 
        // Strategy: Speak the entire text as one utterance? 
        // Or speak paragraph by paragraph?
        // Speak entire text is better for continuous flow, but tracking requires math.

        // Let's reconstruct the full text exactly as we render it (joined by newlines? or spaces?)
        // To keep it simple and robust: Speak paragraph by paragraph? 
        // PRO: Perfect sync. CON: Slight pause between paragraphs.
        // Let's try paragraph by paragraph for "moving with the page" accuracy.

        startSpeakingParagraph(0);
    };

    const startSpeakingParagraph = (index: number) => {
        if (index >= paragraphs.length) {
            setIsSpeaking(false);
            setIsPaused(false);
            setActiveIndex(-1);
            return;
        }

        setActiveIndex(index);
        setIsSpeaking(true);
        setIsPaused(false);
        speakingRef.current = true;

        const utterance = new SpeechSynthesisUtterance(paragraphs[index]);
        utterance.rate = rate;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            // If we were cancelled (stopped), don't continue
            if (!speakingRef.current) return;

            // Move to next
            startSpeakingParagraph(index + 1);
        };

        utterance.onerror = (e) => {
            console.error("Speech error", e);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handlePlayPause = () => {
        if (isSpeaking && !isPaused) {
            // Pausing logic with paragraph-by-paragraph is tricky because 
            // window.speechSynthesis.pause() works globally.
            window.speechSynthesis.pause();
            setIsPaused(true);
        } else if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            speak();
        }
    };

    const handleStop = () => {
        speakingRef.current = false; // Flag to stop the chain
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveIndex(-1);
    };

    const changeSpeed = (newRate: number) => {
        setRate(newRate);
        // Rate change requires restart usually, but for now we'll just set it for NEXT paragraph
        // To be immediate, we'd have to simple cancel and restart current paragraph.
        if (isSpeaking) {
            speakingRef.current = false;
            window.speechSynthesis.cancel();
            setTimeout(() => {
                // Restart current paragraph
                startSpeakingParagraph(activeIndex >= 0 ? activeIndex : 0);
            }, 50);
        }
    };

    // Jump to specific paragraph on click
    const handleParagraphClick = (index: number) => {
        speakingRef.current = false;
        window.speechSynthesis.cancel();
        setTimeout(() => {
            startSpeakingParagraph(index);
        }, 50);
    };

    return (
        <div className="smart-reader">
            {/* CONTROLS HEADER */}
            <div className="sticky-top bg-white border-bottom shadow-sm p-3 mb-4 rounded-4" style={{ top: '20px', zIndex: 100 }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className={`player-icon-box ${isSpeaking && !isPaused ? 'pulse-animation' : ''}`}>
                            <i className="bi bi-soundwave fs-4 text-dark"></i>
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-uppercase ls-1 smallest-print text-muted">Smart Reader</h6>
                            <p className="mb-0 fw-bold text-dark small">{title}</p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center bg-light rounded-pill border px-2 py-1">
                            <button onClick={() => changeSpeed(0.8)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 0.8 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>0.8x</button>
                            <button onClick={() => changeSpeed(1)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 1 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>1x</button>
                            <button onClick={() => changeSpeed(1.2)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 1.2 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>1.2x</button>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {(isSpeaking || isPaused) && (
                                <button onClick={handleStop} className="btn btn-circle-sm btn-outline-danger">
                                    <i className="bi bi-stop-fill"></i>
                                </button>
                            )}
                            <button onClick={handlePlayPause} className="btn btn-play-large">
                                {isSpeaking && !isPaused ? <i className="bi bi-pause-fill"></i> : <i className="bi bi-play-fill ps-1"></i>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TEXT CONTENT */}
            <div ref={containerRef} className="reader-content px-2">
                {paragraphs.map((para, index) => (
                    <p
                        key={index}
                        ref={(el) => { paragraphRefs.current[index] = el; }}
                        onClick={() => handleParagraphClick(index)}
                        className={`
                            mb-4 p-3 rounded-3 transition-all cursor-pointer
                            ${activeIndex === index ? 'active-paragraph shadow-sm' : 'text-muted text-opacity-75'}
                        `}
                        style={{
                            lineHeight: '1.8',
                            fontSize: activeIndex === index ? '1.1rem' : '1rem',
                            borderLeft: activeIndex === index ? '4px solid #FACC15' : '4px solid transparent',
                            transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                            cursor: 'pointer'
                        }}
                    >
                        {para}
                    </p>
                ))}
            </div>

            <style>{`
                .transition-all { transition: all 0.4s ease; }
                .active-paragraph {
                    background-color: #FFFBEB; /* Light yellow */
                    color: #111827 !important;
                    font-weight: 500;
                }
                .cursor-pointer:hover { background-color: #f8f9fa; }
                
                 .player-icon-box {
                    width: 40px; height: 40px; background: #FACC15;
                    border-radius: 10px; display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .pulse-animation { animation: pulse-yellow 2s infinite; }
                @keyframes pulse-yellow {
                    0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
                }
                .btn-play-large {
                    width: 48px; height: 48px; background: #111827; color: white;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-size: 1.25rem; border: 3px solid #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.2s;
                }
                .btn-play-large:hover { transform: scale(1.05); background: #000; color: #FACC15; }
                .btn-circle-sm {
                    width: 36px; height: 36px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                }
            `}</style>
        </div>
    );
};

export default SmartReader;
