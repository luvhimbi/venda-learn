import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDailyWord } from '../services/dataCache';

interface DailyWord {
    word: string;
    meaning: string;
    explanation: string;
    example: string;
    pronunciation?: string;
}

const DailyWordPage: React.FC = () => {
    const [wordData, setWordData] = useState<DailyWord | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWord = async () => {
            const word = await fetchDailyWord();
            setWordData(word as DailyWord);
            setLoading(false);
        };
        fetchWord();
    }, []);

    const speakVenda = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-ZA'; // Closest approximation for phonetics if Venda isn't native
        utterance.rate = 0.7;
        window.speechSynthesis.speak(utterance);
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    return (
        <div className="min-vh-100 bg-white py-5 px-3">
            <div className="container" style={{ maxWidth: '700px' }}>

                {/* BACK NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-5 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-2 text-uppercase"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left"></i> Murahu
                </button>

                {/* HEADER SECTION */}
                <div className="mb-5 border-bottom pb-4">
                    <div className="d-flex justify-content-between align-items-end">
                        <div>
                            <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Ipfi la Duvha</p>
                            <h5 className="fw-bold mb-0">DAILY WORD</h5>
                        </div>
                        <p className="smallest fw-bold text-muted mb-0">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* MAIN WORD SECTION */}
                <main className="text-center py-5 mb-5">
                    <h1 className="display-1 fw-bold mb-2 ls-tight" style={{ color: '#111827' }}>
                        {wordData?.word}
                    </h1>
                    <button
                        className="btn btn-link text-decoration-none fw-bold smallest ls-1 p-0 mb-4"
                        style={{ color: '#FACC15' }}
                        onClick={() => speakVenda(wordData?.word || "")}
                    >
                        <i className="bi bi-volume-up-fill me-1"></i> THETSHELESANI (LISTEN)
                    </button>

                    <div className="mt-4">
                        <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">Meaning</p>
                        <h3 className="fw-bold" style={{ color: '#111827' }}>{wordData?.meaning}</h3>
                    </div>
                </main>

                {/* CONTENT SECTION */}
                <div className="row g-5">
                    <div className="col-12">
                        <section className="mb-5">
                            <h6 className="fw-bold text-uppercase text-muted small ls-2 mb-4">Cultural Context</h6>
                            <p className="fs-5 text-secondary" style={{ lineHeight: '1.8' }}>
                                {wordData?.explanation}
                            </p>
                        </section>

                        <section className="p-4 border-start border-4" style={{ borderColor: '#FACC15', backgroundColor: '#fdfdfd' }}>
                            <h6 className="fw-bold text-uppercase text-muted small ls-2 mb-3">Tsumbo (Example)</h6>
                            <p className="fs-4 fst-italic mb-1" style={{ color: '#111827' }}>"{wordData?.example}"</p>
                            <p className="small text-muted mb-0">Listen and repeat to perfect your accent.</p>
                        </section>
                    </div>
                </div>

                {/* FOOTER ACTION */}
                <footer className="mt-5 pt-5 border-top">
                    <button
                        className="btn game-btn-primary w-100 py-3 fw-bold ls-1"
                        onClick={() => navigate('/')}
                    >
                        PHANDA NA PFUNZO (CONTINUE)
                    </button>
                </footer>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default DailyWordPage;