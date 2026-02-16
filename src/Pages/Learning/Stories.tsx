
import React, { useState, useEffect } from 'react';
import storiesData from '../../data/stories.json';
import { completeStory } from '../../services/storyService';
import { auth } from '../../services/firebaseConfig';
import { fetchUserData } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { BookOpen, CheckCircle, Sparkles, Gem } from 'lucide-react';

import StoryReader from './StoryReader';

const Stories: React.FC = () => {
    const [activeStory, setActiveStory] = useState<any>(null);
    const [userCompletedList, setUserCompletedList] = useState<string[]>([]);

    // Fetch user's completed stories on mount
    useEffect(() => {
        const loadUserData = async () => {
            if (auth.currentUser) {
                const data = await fetchUserData();
                if (data) {
                    setUserCompletedList(data.completedStories || []);
                }
            }
        };
        loadUserData();
    }, []);

    const handleFinish = async (id: string) => {
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
        return (
            <StoryReader
                story={activeStory}
                onClose={() => setActiveStory(null)}
                onFinish={handleFinish}
                alreadyClaimed={userCompletedList.includes(activeStory.id)}
            />
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
                                <div className={`${isDone ? 'bg-secondary' : 'bg-success'} text-white p-5 text-center position-relative d-flex align-items-center justify-content-center`}>
                                    {isDone ? <CheckCircle size={64} strokeWidth={1.5} /> : <BookOpen size={64} strokeWidth={1.5} />}
                                    <div className="position-absolute bottom-0 end-0 p-3">
                                        <span className="badge rounded-pill bg-white text-dark shadow-sm">{story.level}</span>
                                    </div>
                                </div>
                                <div className="card-body p-4">
                                    <h4 className="fw-bold mb-2">{story.title}</h4>
                                    <div className="d-flex align-items-center text-muted mb-4 gap-2">
                                        {isDone ? <Sparkles size={18} className="text-warning" /> : <Gem size={18} className="text-primary" />}
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


