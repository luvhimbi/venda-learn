import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../../services/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchHistoryData } from '../../services/dataCache';
import { Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryStory {
    id: string;
    title: string;
    vendaTitle: string;
    category: 'History' | 'Food' | 'Dance' | 'Attire';
    era?: string;
    readTime: string;
    thumbnailEmoji: string;
    imageUrl?: string;
}

const CategoryCard: React.FC<{ title: string; count: number; image: string; active: boolean; onClick: () => void }> = ({ title, count, image, active, onClick }) => (
    <div
        className={`category-card rounded-4 overflow-hidden position-relative mb-3 transition-all scroll-snap-align-start ${active ? 'active-category' : ''}`}
        style={{ cursor: 'pointer', minWidth: '180px', height: '220px', flex: '0 0 auto' }}
        onClick={onClick}
    >
        <img src={image} alt={title} className="w-100 h-100 object-fit-cover" />
        <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-dark text-white text-center">
            <h6 className="fw-bold mb-0 small">{title}</h6>
            <span className="smallest-print opacity-75">{count} stories</span>
        </div>
        {active && <div className="active-indicator"></div>}
    </div>
);

const HistoryList: React.FC = () => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [stories, setStories] = useState<HistoryStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [authInitialized, setAuthInitialized] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [showGuestBanner, setShowGuestBanner] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Initial metadata for known categories
    const categoryMetadata = [
        { id: 'History', label: 'History & Origins' },
        { id: 'Food', label: 'Indigenous Cuisine' },
        { id: 'Dance', label: 'Music & Dance' },
        { id: 'Attire', label: 'Traditional Clothing' }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsGuest(!user || user.isAnonymous);
            setAuthInitialized(true);
        });

        const loadHistory = async () => {
            try {
                const data = await fetchHistoryData();
                setStories(data as HistoryStory[]);
            } catch (error) {
                console.error("Error fetching cultural data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (authInitialized) {
            loadHistory();
        }

        return () => unsubscribe();
    }, [authInitialized]);

    // Derive categories dynamically from stories in the database
    // This ensures we only show what's actually available "from the db"
    const categories = Array.from(new Set(stories.map(s => s.category?.toLowerCase()))).map(catId => {
        if (!catId) return null;
        const meta = categoryMetadata.find(m => m.id.toLowerCase() === catId) || { id: catId, label: catId };
        const firstStory = stories.find(s => s.category?.toLowerCase() === catId);
        return {
            id: meta.id,
            label: meta.label,
            img: firstStory?.imageUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400",
            count: stories.filter(s => s.category?.toLowerCase() === catId).length
        };
    }).filter(Boolean) as { id: string, label: string, img: string, count: number }[];

    const filteredStories = stories.filter(s =>
        (activeFilter === 'All' || s.category?.toLowerCase() === activeFilter.toLowerCase())
    );

    const featuredStory = stories.find(s => s.era === 'Sacred') || stories[0];

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning"></div>
        </div>
    );

    return (
        <div className="bg-white min-vh-100 history-redesign">
            <main className="container py-5">
                <div className="row g-4 justify-content-center">
                    <div className="col-lg-10">
                        {/* HERO FEATURED STORY (FROM DB) */}
                        {featuredStory && !activeFilter && (
                            <section
                                className="featured-hero rounded-4 overflow-hidden position-relative mb-5 shadow-sm group pointer"
                                onClick={() => navigate(`/history/${featuredStory.id}`)}
                            >
                                <img
                                    src={featuredStory.imageUrl || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200"}
                                    className="w-100 h-100 object-fit-cover transition-all group-hover-scale"
                                    alt="Featured"
                                />
                                <div className="position-absolute bottom-0 start-0 w-100 p-4 p-md-5 bg-gradient-dark text-white">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <span className="badge bg-warning text-dark uppercase smallest-print fw-bold">Featured Story</span>
                                        <span className="smallest-print opacity-75">{featuredStory.readTime} read</span>
                                    </div>
                                    <h1 className="display-5 fw-bold mb-3 ls-tight">{featuredStory.title}</h1>
                                    <p className="mb-0 opacity-75 fs-5">{featuredStory.vendaTitle}</p>
                                </div>
                            </section>
                        )}

                        {/* EXPLORE TRADITIONS SECTION */}
                        <section className="mb-5 position-relative">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold mb-0">Explore Traditions</h3>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="d-flex gap-1 me-2">
                                        <button 
                                            onClick={() => scroll('left')}
                                            className="btn btn-sm btn-outline-warning rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '32px', height: '32px' }}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button 
                                            onClick={() => scroll('right')}
                                            className="btn btn-sm btn-outline-warning rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '32px', height: '32px' }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                    <button
                                        className="btn btn-link text-warning fw-bold p-0 text-decoration-none smallest-print uppercase ls-1"
                                        onClick={() => setActiveFilter('All')}
                                    >
                                        View all
                                    </button>
                                </div>
                            </div>

                            <div 
                                ref={scrollContainerRef}
                                className="d-flex gap-3 overflow-auto no-scrollbar pb-3 scroll-snap-x-mandatory"
                            >
                                {categories.map(cat => (
                                    <CategoryCard
                                        key={cat.id}
                                        title={cat.label}
                                        count={cat.count}
                                        image={cat.img}
                                        active={activeFilter === cat.id}
                                        onClick={() => setActiveFilter(cat.id === activeFilter ? 'All' : cat.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* GUEST BANNER */}
                        {isGuest && showGuestBanner && (
                            <section className="mb-5 animate__animated animate__fadeIn">
                                <div className="bg-warning bg-opacity-10 border border-warning border-opacity-50 rounded-4 p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative">
                                    <button 
                                        onClick={() => setShowGuestBanner(false)} 
                                        className="btn btn-link text-dark position-absolute top-0 end-0 p-3 opacity-50 hover-opacity-100"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-warning text-dark rounded-circle p-2 d-none d-sm-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                                Browsing as Guest
                                            </h5>
                                            <p className="mb-0 text-muted small" style={{ maxWidth: '600px' }}>
                                                You can read a preview of every story. Log in or create a free account to unlock full stories, save your reading progress, and earn Learning Points!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2 shrink-0 z-1">
                                        <button onClick={() => navigate('/register')} className="btn game-btn-yellow fw-bold py-2 px-4 rounded-pill text-nowrap ls-1 smallest-print">
                                            SIGN UP FREE
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* FILTERED FEED */}
                        <section className="row g-4 mb-5">
                            <div className="col-12 mb-2">
                                <h5 className="fw-bold text-muted small uppercase ls-2">
                                    {activeFilter !== 'All' ? `Discovering ${activeFilter} Stories` : 'All Stories'}
                                </h5>
                            </div>
                            {filteredStories.map(story => (
                                <div key={story.id} className="col-md-6">
                                    <div
                                        className="story-list-item rounded-4 bg-white border overflow-hidden transition-all h-100 pointer shadow-sm position-relative"
                                        onClick={() => navigate(`/history/${story.id}`)}
                                    >
                                        <div className="bg-munwenda" style={{ height: '4px', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2 }}></div>
                                        <div className="ratio ratio-16x9">
                                            <img src={story.imageUrl || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600"} alt="" className="object-fit-cover" />
                                        </div>
                                        <div className="p-4">
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="text-warning fw-bold smallest-print uppercase ls-1">{story.category}</span>
                                                <span className="text-muted smallest-print">• {story.readTime}</span>
                                            </div>
                                            <h5 className="fw-bold mb-1">{story.title}</h5>
                                            <p className="text-muted smallest-print mb-0 italic">{story.vendaTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

                .history-redesign {
                    font-family: 'Outfit', sans-serif !important;
                    color: #1a1a1a;
                }
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .uppercase { text-transform: uppercase; }
                .smallest-print { font-size: 10px; }
                .bg-gradient-dark {
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
                }
                .pointer { cursor: pointer; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .scroll-snap-x-mandatory {
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                }
                .scroll-snap-align-start {
                    scroll-snap-align: start;
                }
                .italic { font-style: italic; }
                
                .active-nav {
                    border-bottom: 2px solid #FACC15;
                    padding-bottom: 2px;
                }

                /* Category Card */
                .category-card {
                    filter: grayscale(0.2);
                    border: 2px solid transparent;
                }
                .category-card:hover {
                    filter: grayscale(0);
                    transform: translateY(-5px);
                }
                .active-category {
                    border-color: #FACC15 !important;
                    filter: grayscale(0);
                    box-shadow: 0 10px 25px rgba(250, 204, 21, 0.2);
                }
                .active-indicator {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 12px;
                    height: 12px;
                    background: #FACC15;
                    border-radius: 50%;
                    border: 2px solid white;
                }

                /* Hero Section */
                .featured-hero { height: 400px; }
                .group-hover-scale { transition: transform 0.5s ease; }
                .featured-hero:hover .group-hover-scale { transform: scale(1.05); }

                /* Sidebar */
                .sidebar-sticky {
                    position: sticky;
                    top: 100px;
                }
                .nugget p { line-height: 1.6; }

                /* List Item */
                .story-list-item:hover {
                    border-color: #FACC15 !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }
                .hover-underline:hover { text-decoration: underline; }
                .hover-opacity-100:hover { opacity: 1 !important; }
                .game-btn-yellow { 
                    background-color: #FACC15 !important; 
                    color: #000 !important; 
                    border: none !important; 
                    box-shadow: 0 4px 0 #A1810B !important; 
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }

                @media (max-width: 768px) {
                    .featured-hero { height: 300px; }
                    .display-6 { font-size: 1.75rem; }
                }
            `}</style>
        </div>
    );
};

export default HistoryList;


