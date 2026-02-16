import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHistoryData } from '../../services/dataCache';
import Swal from 'sweetalert2';

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

const HistoryDetail: React.FC = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState<StoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            setScrollProgress((currentScroll / totalScroll) * 100);
            setShowScrollTop(currentScroll > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning" role="status"></div>
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
        <div className={`bg-white min-vh-100 pb-5 text-size-${textSize}`}>
            {/* READING PROGRESS BAR */}
            <div className="reading-progress-container">
                <div className="reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
            </div>
            {/* ENHANCED IMAGE SECTION */}
            <div className="image-hero-container position-relative w-100 overflow-hidden shadow-sm animate-on-scroll">
                {!imgError && story.imageUrl ? (
                    <>
                        <img
                            src={story.imageUrl}
                            alt="Background Blur"
                            className="img-blur-layer"
                        />
                        <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="img-main-focus"
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
                <header className="mb-4 animate-on-scroll">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <span className="meta-tag">{story.era}</span>
                        <div className="dot-separator"></div>
                        <span className="meta-tag">{story.readTime} MINUTES READ</span>
                    </div>
                    <h1 className="display-5 fw-bold ls-tight mb-2 text-dark">{story.title}</h1>
                    <p className="venda-subtitle">{story.vendaTitle}</p>
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
                            <p key={idx} className="content-paragraph animate-on-scroll">
                                {renderInteractiveContent(paragraph)}
                            </p>
                        )
                    ))}
                </article>

                {/* FUN FACT CARD */}
                <div className="mt-5 p-4 rounded-4 fun-fact-card animate-on-scroll">
                    <div className="d-flex gap-3">
                        <div className="fun-fact-icon">💡</div>
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
                        <div className="cat-icon-small">{story.thumbnailEmoji}</div>
                        <div>
                            <p className="smallest-print text-muted mb-0 uppercase ls-1">Culture Type</p>
                            <h6 className="fw-bold mb-0">{story.category}</h6>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION BAR */}
            <div className={`floating-bar ${showScrollTop ? 'active' : ''}`}>
                <div className="floating-bar-content mx-auto shadow-lg">
                    <button
                        className={`btn-action ${textSize === 'large' ? 'active' : ''}`}
                        onClick={() => setTextSize(textSize === 'normal' ? 'large' : 'normal')}
                        title="Toggle Text Size"
                    >
                        <i className="bi bi-fonts fs-5"></i>
                    </button>
                    <div className="action-divider"></div>
                    <button
                        className="btn-action"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        title="Scroll to Top"
                    >
                        <i className="bi bi-arrow-up-short fs-4"></i>
                    </button>
                    <div className="action-divider"></div>
                    <button
                        className="btn-action"
                        onClick={() => navigate('/history')}
                        title="Back to History"
                    >
                        <i className="bi bi-grid fs-5"></i>
                    </button>
                </div>
            </div>

            <style>{`
                .reading-progress-container {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: rgba(0,0,0,0.05);
                    z-index: 1000;
                }
                .reading-progress-bar {
                    height: 100%;
                    background: #FACC15;
                    transition: width 0.1s ease;
                }

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
                }
                .img-main-focus {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    z-index: 1;
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
                
                .text-size-large .content-paragraph { font-size: 1.4rem; }
                .text-size-normal .content-paragraph { font-size: 1.15rem; }

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

                .fun-fact-card {
                    background: #111827;
                    color: #fff;
                    border: none;
                }
                .fun-fact-icon {
                    font-size: 24px;
                }

                /* ANIMATIONS */
                .animate-on-scroll {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease-out;
                }
                .animate-on-scroll.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* FLOATING BAR */
                .floating-bar {
                    position: fixed;
                    bottom: 30px;
                    left: 0; right: 0;
                    z-index: 1000;
                    transform: translateY(100px);
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .floating-bar.active {
                    transform: translateY(0);
                }
                .floating-bar-content {
                    width: fit-content;
                    background: rgba(17, 24, 39, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 8px 16px;
                    border-radius: 50px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .btn-action {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    padding: 8px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-action:hover { color: #fff; background: rgba(255,255,255,0.1); }
                .btn-action.active { color: #FACC15; }
                .action-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255,255,255,0.1);
                }

                .swal2-venda-style {
                    border-radius: 24px !important;
                    font-family: 'Poppins', sans-serif !important;
                }
                
                /* Player styles removed as they are now in PodcastPlayer component */
            `}</style>
        </div>
    );
};

export default HistoryDetail;


