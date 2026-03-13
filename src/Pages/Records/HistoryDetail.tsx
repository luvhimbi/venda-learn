import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHistoryData } from '../../services/dataCache';
import Swal from 'sweetalert2';
import Mascot from '../../components/Mascot';

interface StoryData {
    title: string;
    vendaTitle: string;
    category: string;
    era: string;
    readTime: string;
    content: string;
    imageUrl?: string;
    thumbnailEmoji: string;
}

import PodcastPlayer from '../../components/PodcastPlayer';
import { BookOpen, Lightbulb } from 'lucide-react';

const HistoryDetail: React.FC = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState<StoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [heroOffset, setHeroOffset] = useState(0);

    // Mascot state
    const mascotMood = scrollProgress > 75 ? 'excited' : 'happy';
    const mascotSpeech =
        scrollProgress < 10
            ? 'Vhalani!'
            : scrollProgress < 50
                ? 'Ni khou ita zwavhuḓi!'
                : scrollProgress < 80
                    ? 'Ni tsini!'
                    : 'Ndi zwone!';

    const handleScroll = useCallback(() => {
        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;
        const progress = totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0;
        setScrollProgress(progress);
        setHeroOffset(currentScroll * 0.35);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        if (loading || !story) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const animateElements = document.querySelectorAll('.animate-on-scroll');
        animateElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [loading, story]);

    useEffect(() => {
        const fetchStory = async () => {
            if (!storyId) return;
            try {
                const allHistory = await fetchHistoryData();
                const found = allHistory.find((s: any) => s.id === storyId);
                if (found) {
                    setStory(found as StoryData);
                } else {
                    navigate('/history');
                }
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStory();
    }, [storyId, navigate]);

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex flex-column justify-content-center align-items-center gap-3">
            <div className="mascot-loader">
                <Mascot width="120px" height="120px" mood="excited" />
            </div>
            <p className="text-muted fw-semibold" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '1.5px', fontSize: '12px', textTransform: 'uppercase' }}>
                Loading story...
            </p>
            <style>{`
                @keyframes loaderFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                .mascot-loader { animation: loaderFloat 1.5s ease-in-out infinite; }
            `}</style>
        </div>
    );

    if (!story) return null;

    const textToRead = `${story.title}. ${story.vendaTitle}. ${story.content}`;

    // Interactive word dictionary
    const vocabulary: Record<string, string> = {
        'Vhavenda': 'The Venda people of South Africa.',
        'Domba': 'Traditional Venda dance, often called the python dance.',
        'Python Dance': 'The famous Domba dance performed during initiation.',
        'Zwiambaro': 'Traditional Venda clothing.',
        'Mvelele': 'Culture and heritage.',
        'Ḓivhazwakale': 'History.',
        'Tshivenda': 'The language of the Venda people.'
    };

    const renderInteractiveContent = (text: string) => {
        let parts: any[] = [text];

        Object.keys(vocabulary).forEach(word => {
            const newParts: any[] = [];
            parts.forEach(part => {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    return;
                }
                const regex = new RegExp(`(${word})`, 'gi');
                const subParts = part.split(regex);
                subParts.forEach(sub => {
                    if (sub.toLowerCase() === word.toLowerCase()) {
                        newParts.push(
                            <span
                                key={`${word}-${Math.random()}`}
                                className="interactive-word"
                                onClick={() => Swal.fire({
                                    title: sub,
                                    text: vocabulary[word],
                                    confirmButtonColor: '#FACC15',
                                    icon: 'info',
                                    customClass: { popup: 'swal2-venda-style' }
                                })}
                            >
                                {sub}
                            </span>
                        );
                    } else {
                        newParts.push(sub);
                    }
                });
            });
            parts = newParts;
        });

        return parts;
    };

    return (
        <div className="bg-white min-vh-100 pb-5">
            {/* READING PROGRESS BAR */}
            <div className="reading-progress-container">
                <div className="reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
            </div>

            {/* PARALLAX HERO IMAGE */}
            <div className="image-hero-container position-relative w-100 overflow-hidden shadow-sm animate-on-scroll">
                {!imgError && story.imageUrl ? (
                    <>
                        <img
                            src={story.imageUrl}
                            alt="Background Blur"
                            className="img-blur-layer"
                            style={{ transform: `translateY(${heroOffset * 0.2}px) scale(1.1)` }}
                        />
                        <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="img-main-focus"
                            style={{ transform: `translateY(${heroOffset * 0.15}px)` }}
                            onError={() => setImgError(true)}
                        />
                        {/* COPYRIGHT SHORT NOTICE */}
                        <div className="position-absolute bottom-0 end-0 m-2 z-3">
                            <span className="copyright-tag">Image source: External</span>
                        </div>
                    </>
                ) : (
                    <div className="w-100 h-100 bg-light d-flex flex-column align-items-center justify-content-center">
                        <span style={{ fontSize: '80px' }}>{story.thumbnailEmoji}</span>
                        <p className="smallest-print text-muted mt-2 fw-bold ls-1">NO IMAGE AVAILABLE</p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/history')}
                    className="btn btn-back-blur position-absolute top-0 start-0 m-4"
                >
                    <i className="bi bi-arrow-left"></i>
                </button>

                <div className="position-absolute bottom-0 start-0 w-100 p-4 img-gradient-overlay">
                    <span className="badge-venda">{story.category}</span>
                </div>
            </div>

            <div className="container mt-5" style={{ maxWidth: '750px' }}>
                {/* STAGGERED HEADER */}
                <header className="mb-4 animate-on-scroll">
                    <div className="d-flex align-items-center gap-3 mb-3 stagger-item stagger-1">
                        <span className="meta-tag">{story.era}</span>
                        <div className="dot-separator"></div>
                        <span className="meta-tag">{story.readTime} MINUTES READ</span>
                    </div>
                    <h1 className="display-5 fw-bold ls-tight mb-2 text-dark stagger-item stagger-2">{story.title}</h1>
                    <p className="venda-subtitle stagger-item stagger-3">{story.vendaTitle}</p>
                </header>

                {/* REUSABLE PODCAST PLAYER */}
                <div className="mb-5 animate-on-scroll">
                    <PodcastPlayer
                        title="Listen to Story"
                        textToRead={textToRead}
                    />
                </div>

                <article className="article-content">
                    {story.content.split('\n').map((paragraph, idx) => (
                        paragraph && (
                            <p
                                key={idx}
                                className={`content-paragraph animate-on-scroll para-slide para-slide-${idx % 2 === 0 ? 'left' : 'right'}`}
                            >
                                {renderInteractiveContent(paragraph)}
                            </p>
                        )
                    ))}
                </article>

                {/* FUN FACT CARD */}
                <div className="mt-5 p-4 rounded-4 fun-fact-card animate-on-scroll fun-fact-glow">
                    <div className="d-flex gap-3">
                        <div className="fun-fact-icon text-warning">
                            <Lightbulb size={24} />
                        </div>
                        <div>
                            <h6 className="fw-bold smallest-print ls-1 uppercase mb-1 text-warning">Quick Insight</h6>
                            <p className="mb-0 small" style={{ lineHeight: '1.5' }}>
                                Venda culture is among the oldest in Southern Africa, with roots stretching back to Great Zimbabwe.
                            </p>
                        </div>
                    </div>
                </div>

                {/* COPYRIGHT & TAKEDOWN DISCLAIMER */}
                <div className="mt-5 p-4 rounded-4 bg-light border-0 animate-on-scroll">
                    <div className="d-flex gap-3">
                        <i className="bi bi-info-circle-fill text-muted fs-4"></i>
                        <div>
                            <h6 className="fw-bold smallest-print ls-1 uppercase mb-1">Copyright Notice</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                                We do not own the copyrights to the images used in this section. All visual content is used for educational purposes to preserve Venda culture.
                                <strong> If you are the owner of this image and would like it removed, please contact us immediately and we will take it down.</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-nav mt-5 pt-5 border-top d-flex justify-content-between align-items-center animate-on-scroll">
                    <div className="d-flex align-items-center gap-3">
                        <div className="cat-icon-small">
                            <BookOpen size={20} className="text-warning" />
                        </div>
                        <div>
                            <p className="smallest-print text-muted mb-0 uppercase ls-1">Culture Type</p>
                            <h6 className="fw-bold mb-0">{story.category}</h6>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING MASCOT COMPANION */}
            <div className="mascot-reading-companion">
                <div className="mascot-speech-bubble">
                    <span>{mascotSpeech}</span>
                </div>
                <Mascot
                    width="80px"
                    height="80px"
                    mood={mascotMood}
                />
            </div>


            <style>{`
                /* ===== READING PROGRESS ===== */
                .reading-progress-container {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: rgba(0,0,0,0.05);
                    z-index: 1000;
                }
                .reading-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #FACC15, #F59E0B, #EF4444);
                    transition: width 0.1s ease;
                    box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
                }

                /* ===== HERO IMAGE ===== */
                .image-hero-container {
                    height: 45vh;
                    min-height: 350px;
                    background-color: #111827;
                }
                .img-blur-layer {
                    position: absolute;
                    width: 110%;
                    height: 110%;
                    object-fit: cover;
                    filter: blur(20px) brightness(0.6);
                    left: -5%;
                    top: -5%;
                    transition: transform 0.05s linear;
                    will-change: transform;
                }
                .img-main-focus {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    z-index: 1;
                    transition: transform 0.05s linear;
                    will-change: transform;
                }
                .img-gradient-overlay {
                    background: linear-gradient(transparent, rgba(0,0,0,0.7));
                    z-index: 2;
                }
                .copyright-tag {
                    font-size: 9px;
                    color: rgba(255,255,255,0.6);
                    background: rgba(0,0,0,0.4);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: 'Poppins', sans-serif;
                }

                .btn-back-blur {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;
                    transition: all 0.3s ease;
                }
                .btn-back-blur:hover {
                    background: rgba(255, 255, 255, 0.35);
                    transform: scale(1.1);
                }
                .badge-venda {
                    background: #FACC15;
                    color: #111827;
                    padding: 6px 16px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }

                .ls-tight { letter-spacing: -2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest-print { font-size: 11px; font-family: 'Poppins', sans-serif; }
                .uppercase { text-transform: uppercase; }
                
                .venda-subtitle { font-size: 1.25rem; color: #EAB308; font-weight: 600; }
                
                .content-paragraph { font-size: 1.15rem; }

                .content-paragraph {
                    line-height: 1.8;
                    color: #374151;
                    margin-bottom: 1.5rem;
                }

                .interactive-word {
                    color: #EAB308;
                    font-weight: 700;
                    cursor: help;
                    border-bottom: 2px dashed #FDE68A;
                    transition: all 0.2s;
                }
                .interactive-word:hover {
                    color: #111827;
                    background: #FEF3C7;
                    border-bottom-color: #FACC15;
                }

                /* ===== STAGGERED HEADER ENTRANCE ===== */
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-on-scroll.visible .stagger-item {
                    animation: fadeInUp 0.7s ease-out forwards;
                    opacity: 0;
                }
                .stagger-1 { animation-delay: 0.1s !important; }
                .stagger-2 { animation-delay: 0.3s !important; }
                .stagger-3 { animation-delay: 0.5s !important; }

                /* ===== PARAGRAPH SLIDE-IN ===== */
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .para-slide {
                    opacity: 0;
                }
                .para-slide.visible {
                    opacity: 1;
                }
                .para-slide-left.visible {
                    animation: slideInLeft 0.6s ease-out forwards;
                }
                .para-slide-right.visible {
                    animation: slideInRight 0.6s ease-out forwards;
                }

                /* ===== FUN FACT GLOW ===== */
                .fun-fact-card {
                    background: #111827;
                    color: #fff;
                    border: none;
                    transition: box-shadow 0.4s ease;
                }
                .fun-fact-icon {
                    font-size: 24px;
                }
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
                    50%      { box-shadow: 0 0 24px 4px rgba(250, 204, 21, 0.25); }
                }
                .fun-fact-glow.visible {
                    animation: pulseGlow 2.5s ease-in-out 3;
                }

                /* ===== SCROLL REVEAL BASE ===== */
                .animate-on-scroll {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease-out;
                }
                .animate-on-scroll.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* ===== FLOATING MASCOT COMPANION ===== */
                @keyframes mascotFloat {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-8px); }
                }
                @keyframes speechPop {
                    0%   { opacity: 0; transform: translateY(6px) scale(0.9); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .mascot-reading-companion {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    z-index: 999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: mascotFloat 3s ease-in-out infinite;
                    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));
                }
                .mascot-speech-bubble {
                    background: white;
                    border: 2px solid #FACC15;
                    border-radius: 16px;
                    padding: 6px 14px;
                    margin-bottom: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    font-family: 'Poppins', sans-serif;
                    color: #111827;
                    white-space: nowrap;
                    box-shadow: 0 4px 16px rgba(250, 204, 21, 0.18);
                    animation: speechPop 0.4s ease-out;
                    position: relative;
                }
                .mascot-speech-bubble::after {
                    content: '';
                    position: absolute;
                    bottom: -7px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0; height: 0;
                    border-left: 7px solid transparent;
                    border-right: 7px solid transparent;
                    border-top: 7px solid #FACC15;
                }


                .swal2-venda-style {
                    border-radius: 24px !important;
                    font-family: 'Poppins', sans-serif !important;
                }

                /* ===== MOBILE RESPONSIVE ===== */
                @media (max-width: 576px) {
                    .image-hero-container {
                        height: 30vh;
                        min-height: 220px;
                    }
                    .mascot-reading-companion {
                        bottom: 80px;
                        right: 8px;
                        transform: scale(0.6);
                        transform-origin: bottom right;
                    }
                    .mascot-speech-bubble {
                        font-size: 9px;
                        padding: 3px 8px;
                    }
                }
                @media (max-width: 400px) {
                    .mascot-reading-companion {
                        bottom: 75px;
                        right: 5px;
                        transform: scale(0.5);
                        transform-origin: bottom right;
                    }
                }
            `}</style>
        </div>
    );
};

export default HistoryDetail;
