import React, { useState, useEffect, useRef } from 'react';

interface PodcastPlayerProps {
    title: string;
    textToRead: string;
    onComplete?: () => void;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ title, textToRead, onComplete }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1); // 1.0 is normal speed

    // Use a ref to keep track if we should be speaking, 
    // because window.speechSynthesis.speaking can be flaky
    const speakingRef = useRef(false);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            window.speechSynthesis.cancel();
            speakingRef.current = false;
        };
    }, []);

    const speak = () => {
        window.speechSynthesis.cancel(); // Clear any previous

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = rate;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            speakingRef.current = false;
            if (onComplete) onComplete();
        };

        utterance.onerror = (e) => {
            console.error("Speech error", e);
            setIsSpeaking(false);
            speakingRef.current = false;
        };

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        speakingRef.current = true;
    };

    const handlePlayPause = () => {
        if (isSpeaking && !isPaused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsSpeaking(false); // UI update
        } else if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsSpeaking(true);
        } else {
            speak();
        }
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        speakingRef.current = false;
    };

    const changeSpeed = (newRate: number) => {
        setRate(newRate);
        // If currently speaking, we need to restart to apply rate change
        // web speech api doesn't support changing rate mid-utterance mostly
        if (isSpeaking || isPaused) {
            window.speechSynthesis.cancel();

            // Small timeout to allow cancel to process
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.rate = newRate;
                utterance.onend = () => {
                    setIsSpeaking(false);
                    setIsPaused(false);
                };
                window.speechSynthesis.speak(utterance);
                setIsSpeaking(true);
                setIsPaused(false);
            }, 50);
        }
    };

    return (
        <div className="podcast-player mb-4 p-3 rounded-4 bg-light border d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 shadow-sm">
            <div className="d-flex align-items-center gap-3 w-100">
                <div className={`player-icon-box ${isSpeaking ? 'pulse-animation' : ''}`}>
                    <i className="bi bi-headphones fs-4 text-dark"></i>
                </div>
                <div className="flex-grow-1">
                    <h6 className="fw-bold mb-0 text-uppercase ls-1 smallest-print text-muted">Read Aloud</h6>
                    <p className="mb-0 fw-bold text-dark small text-truncate" style={{ maxWidth: '200px' }}>{title}</p>
                </div>
            </div>

            <div className="d-flex align-items-center gap-3">
                {/* Speed Control */}
                <div className="d-flex align-items-center bg-white rounded-pill border px-2 py-1">
                    <button onClick={() => changeSpeed(0.75)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 0.75 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>0.75x</button>
                    <button onClick={() => changeSpeed(1)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 1 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>1x</button>
                    <button onClick={() => changeSpeed(1.5)} className={`btn btn-sm btn-link text-decoration-none fw-bold ${rate === 1.5 ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '10px' }}>1.5x</button>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {(isSpeaking || isPaused) && (
                        <button onClick={handleStop} className="btn btn-circle-sm btn-outline-danger">
                            <i className="bi bi-stop-fill"></i>
                        </button>
                    )}

                    <button onClick={handlePlayPause} className="btn btn-play-large">
                        {isSpeaking ? <i className="bi bi-pause-fill"></i> : <i className="bi bi-play-fill ps-1"></i>}
                    </button>
                </div>
            </div>

            <style>{`
                .podcast-player { transition: all 0.3s ease; }
                .player-icon-box {
                    width: 50px; height: 50px; background: #FACC15;
                    border-radius: 12px; display: flex; align-items: center; justify-content: center;
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

export default PodcastPlayer;
