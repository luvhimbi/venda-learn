import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

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
            const today = new Date().toISOString().split('T')[0];
            const docRef = doc(db, "dailyWords", today);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setWordData(docSnap.data() as DailyWord);
            } else {
                // Fallback content
                setWordData({
                    word: "Vhuthu",
                    meaning: "Humanity / Ubuntu",
                    explanation: "This is the core of Venda social values. It refers to kindness, respect, and the idea that 'I am because we are'.",
                    example: "Muthu u vhonala nga vhuthu hawe."
                });
            }
            setLoading(false);
        };
        fetchWord();
    }, []);

    const speakVenda = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const zaVoice = voices.find(v => v.lang.includes('ZA')) || voices[0];
        utterance.voice = zaVoice;
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-5 min-vh-100 d-flex flex-column align-items-center">
            <button className="btn btn-link text-decoration-none text-muted align-self-start mb-4" onClick={() => navigate(-1)}>
                ← Murahu (Back)
            </button>

            <div className="card border-0 shadow-lg rounded-5 overflow-hidden w-100" style={{ maxWidth: '600px' }}>
                <div className="bg-warning p-4 text-center">
                    <span className="badge bg-white text-dark rounded-pill px-3 mb-2">IPFI LA DUVHA</span>
                    <h5 className="mb-0 fw-bold">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h5>
                </div>

                <div className="card-body p-5 text-center">
                    <h1 className="display-2 fw-bold text-primary mb-0">{wordData?.word}</h1>
                    <button className="btn btn-outline-primary rounded-pill mt-2 mb-4 px-4" onClick={() => speakVenda(wordData?.word || "")}>
                        🔊 Thetshelesani (Listen)
                    </button>

                    <div className="bg-light p-4 rounded-4 mb-4">
                        <h4 className="fw-bold mb-1">Meaning</h4>
                        <p className="lead mb-0 text-muted">{wordData?.meaning}</p>
                    </div>

                    <div className="text-start">
                        <h5 className="fw-bold text-primary">Cultural Context</h5>
                        <p className="text-secondary" style={{ lineHeight: '1.8' }}>{wordData?.explanation}</p>

                        <div className="border-start border-4 border-warning ps-3 py-2 bg-light rounded-2 mt-4">
                            <h6 className="fw-bold mb-1">Tsumbo (Example Sentence):</h6>
                            <p className="fst-italic mb-0">"{wordData?.example}"</p>
                        </div>
                    </div>
                </div>

                <div className="card-footer bg-white border-0 p-4">
                    <button className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow" onClick={() => navigate('/')}>
                        Phanda na Pfunzo (Continue Learning)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyWordPage;