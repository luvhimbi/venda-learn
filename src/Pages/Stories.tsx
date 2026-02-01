
import React, { useState, useEffect } from 'react';
import storiesData from '../data/stories.json';
import { completeStory } from '../services/storyService';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const Stories: React.FC = () => {
    const [activeStory, setActiveStory] = useState<any>(null);
    const [showEnglish, setShowEnglish] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userCompletedList, setUserCompletedList] = useState<string[]>([]);

    // Fetch user's completed stories on mount
    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUserCompletedList(docSnap.data().completedStories || []);
                }
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [activeStory]);

    const handleReadAloud = (text: string) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('ZA')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleFinish = async (id: string) => {
        window.speechSynthesis.cancel();

        // 1. Check if already claimed
        if (userCompletedList.includes(id)) {
            Swal.fire({
                title: 'Ndo no vhala!',
                text: "You have already claimed points for this story.",
                icon: 'info',
                confirmButtonColor: '#6c757d'
            });
            setActiveStory(null);
            return;
        }

        // 2. Award 15 LP
        const LP_REWARD = 15;
        const success = await completeStory(id, LP_REWARD);

        if (success) {
            setUserCompletedList(prev => [...prev, id]); // Update local state
            Swal.fire({
                title: 'Zwivhuya!',
                text: `You earned ${LP_REWARD} LP for finishing this Ngano!`,
                icon: 'success',
                confirmButtonColor: '#0d6efd',
                customClass: { popup: 'rounded-4' }
            });
            setActiveStory(null);
        }
    };

    if (activeStory) {
        const alreadyClaimed = userCompletedList.includes(activeStory.id);

        return (
            <div className="container py-5 animate__animated animate__fadeIn">
                <button
                    className="btn btn-link text-muted mb-4 p-0 text-decoration-none fw-bold"
                    onClick={() => {
                        window.speechSynthesis.cancel();
                        setActiveStory(null);
                    }}
                >
                    ← BACK TO LIBRARY
                </button>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 overflow-hidden position-relative">
                            {isSpeaking && (
                                <div className="position-absolute top-0 start-0 w-100 bg-primary opacity-10" style={{ height: '5px' }}>
                                    <div className="progress-bar-animated progress-bar-striped bg-primary h-100 w-100"></div>
                                </div>
                            )}

                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <h1 className="fw-bold mb-0">{activeStory.title}</h1>
                                <button
                                    className={`btn ${isSpeaking ? 'btn-danger' : 'btn-light'} rounded-circle shadow-sm p-3`}
                                    onClick={() => handleReadAloud(showEnglish ? activeStory.englishText : activeStory.vendaText)}
                                >
                                    {isSpeaking ? '⏹️' : '🔊'}
                                </button>
                            </div>

                            <div className="fs-5 text-dark mb-5" style={{ lineHeight: '1.9', whiteSpace: 'pre-line' }}>
                                {showEnglish ? activeStory.englishText : activeStory.vendaText}
                            </div>

                            <div className="d-flex flex-wrap gap-2 pt-4 border-top">
                                <button className="btn btn-outline-primary rounded-pill px-4 fw-bold" onClick={() => setShowEnglish(!showEnglish)}>
                                    {showEnglish ? 'SHOW TSHIVENDA' : 'TRANSLATE'}
                                </button>

                                {alreadyClaimed ? (
                                    <button className="btn btn-secondary rounded-pill px-4 fw-bold disabled opacity-75">
                                        ✅ POINTS CLAIMED
                                    </button>
                                ) : (
                                    <button className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" onClick={() => handleFinish(activeStory.id)}>
                                        MARK AS FINISHED (+15 LP)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 bg-primary text-white rounded-4 p-4 shadow sticky-top" style={{ top: '100px' }}>
                            <h5 className="fw-bold mb-3 border-bottom border-white border-opacity-25 pb-2 text-uppercase small ls-1">Vocabulary Help</h5>
                            <div className="vocabulary-list">
                                {activeStory.vocabulary.map((v: any, i: number) => (
                                    <div key={i} className="mb-3 p-2 rounded-3 hover-bg-white-10 transition-all">
                                        <div className="fw-bold d-flex justify-content-between">
                                            <span>{v.word}</span>
                                            <button className="btn btn-link btn-sm p-0 text-white opacity-50" onClick={() => handleReadAloud(v.word)}>
                                                <small>🔊</small>
                                            </button>
                                        </div>
                                        <div className="small opacity-75 italic">{v.mean}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="mb-5 animate__animated animate__fadeInDown">
                <h1 className="display-5 fw-bold mb-2">Ngano dza kale</h1>
                <p className="text-muted fs-5">Immerse yourself in traditional Venda stories and master the language.</p>
            </div>

            <div className="row g-4">
                {storiesData.map((story) => {
                    const isDone = userCompletedList.includes(story.id);
                    return (
                        <div key={story.id} className="col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                            <div className={`card border-0 shadow-sm rounded-4 h-100 hover-lift transition-all overflow-hidden border-bottom border-4 ${isDone ? 'border-secondary' : 'border-success'}`}>
                                <div className={`${isDone ? 'bg-secondary' : 'bg-success'} text-white p-5 text-center position-relative`}>
                                    <span className="display-1">{isDone ? '✅' : '📖'}</span>
                                    <div className="position-absolute bottom-0 end-0 p-3">
                                        <span className="badge rounded-pill bg-white text-dark shadow-sm">{story.level}</span>
                                    </div>
                                </div>
                                <div className="card-body p-4">
                                    <h4 className="fw-bold mb-2">{story.title}</h4>
                                    <div className="d-flex align-items-center text-muted mb-4">
                                        <span className="me-2">{isDone ? '✨' : '💎'}</span>
                                        <span className="small fw-bold">{isDone ? 'Completed' : '15 LP Reward'}</span>
                                    </div>
                                    <button className={`btn ${isDone ? 'btn-outline-secondary' : 'btn-primary'} w-100 rounded-pill fw-bold py-3 shadow-sm`} onClick={() => setActiveStory(story)}>
                                        {isDone ? 'RE-READ STORY' : 'START READING'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .hover-bg-white-10:hover { background: rgba(255,255,255,0.1); }
                .hover-lift:hover { transform: translateY(-5px); }
                .transition-all { transition: all 0.3s ease; }
                .italic { font-style: italic; }
            `}</style>
        </div>
    );
};

export default Stories;